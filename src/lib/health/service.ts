// V32 — Servicio que construye inputs + persiste UserHealthScore
// ═══════════════════════════════════════════════════════════
// Divide responsabilidades con calculator.ts: aquí van las queries
// Prisma; el scoring en sí es puro.

import { prisma } from '@/lib/db/prisma'
import { UserHealthSegment, UserRole } from '@prisma/client'
import { computeHealthScore, type HealthInputs, type HealthResult } from './calculator'

const THIRTY_DAYS_MS = 30 * 86_400_000

// Carga los inputs de un usuario y devuelve el HealthResult
export async function computeUserHealth(userId: string): Promise<HealthResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      points: true,
    },
  })
  if (!user) return null

  const since30d = new Date(Date.now() - THIRTY_DAYS_MS)

  const [
    ordersLast30d,
    postsLast30d,
    commentsLast30d,
    lessonsLast30d,
    lastPost,
    lastComment,
    lastOrder,
    shopifyStore,
    goalProgress,
  ] = await Promise.all([
    prisma.order.count({ where: { userId, createdAt: { gte: since30d } } }),
    prisma.post.count({ where: { authorId: userId, createdAt: { gte: since30d } } }),
    prisma.comment.count({ where: { authorId: userId, createdAt: { gte: since30d } } }),
    prisma.courseProgress.count({
      where: {
        userId,
        updatedAt: { gte: since30d },
        percentage: { gt: 0 },
      },
    }),
    prisma.post.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.comment.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.order.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.shopifyStore.findFirst({
      where: { userId, status: 'connected' },
      select: { id: true },
    }),
    prisma.userGoal.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [
          { achievedRevenue: { gt: 0 } },
          { achievedOrders: { gt: 0 } },
        ],
      },
      select: { id: true },
    }),
  ])

  const lastActivityAt = newestDate([
    lastPost?.createdAt,
    lastComment?.createdAt,
    lastOrder?.createdAt,
    user.updatedAt,
  ])

  const inputs: HealthInputs = {
    userCreatedAt: user.createdAt,
    lastActivityAt,
    ordersLast30d,
    postsLast30d,
    commentsLast30d,
    courseLessonsCompletedLast30d: lessonsLast30d,
    hasConnectedShopifyStore: Boolean(shopifyStore),
    hasGoalWithProgress: Boolean(goalProgress),
    totalPoints: user.points,
  }

  return computeHealthScore(inputs)
}

function newestDate(dates: Array<Date | undefined | null>): Date | null {
  let best: Date | null = null
  for (const d of dates) {
    if (!d) continue
    if (!best || d.getTime() > best.getTime()) best = d
  }
  return best
}

// Guarda (upsert) el score calculando delta + previousSegment
export async function upsertUserHealthScore(userId: string): Promise<HealthResult | null> {
  const result = await computeUserHealth(userId)
  if (!result) return null

  const existing = await prisma.userHealthScore.findUnique({ where: { userId } })

  const scoreDelta = existing ? result.score - existing.score : 0
  const previousScore = existing?.score ?? null
  const previousSegment = existing?.segment ?? null

  await prisma.userHealthScore.upsert({
    where: { userId },
    create: {
      userId,
      score: result.score,
      segment: result.segment,
      breakdown: result.breakdown as never,
      scoreDelta,
      previousScore,
      previousSegment,
    },
    update: {
      score: result.score,
      segment: result.segment,
      breakdown: result.breakdown as never,
      scoreDelta,
      previousScore,
      previousSegment,
      computedAt: new Date(),
    },
  })

  // Si cayó de ACTIVE → AT_RISK o AT_RISK → CHURNED, disparar retención
  if (
    existing
    && existing.segment !== result.segment
    && segmentWorsened(existing.segment, result.segment)
  ) {
    await triggerRetention(userId, existing.segment, result.segment)
  }

  return result
}

function segmentWorsened(prev: UserHealthSegment, next: UserHealthSegment): boolean {
  const order: UserHealthSegment[] = [
    UserHealthSegment.NEW,
    UserHealthSegment.ACTIVE,
    UserHealthSegment.AT_RISK,
    UserHealthSegment.CHURNED,
  ]
  return order.indexOf(next) > order.indexOf(prev)
}

// Dispara notificación in-app de retención + marca lastRetentionTriggerAt
async function triggerRetention(
  userId: string,
  prevSegment: UserHealthSegment,
  newSegment: UserHealthSegment,
) {
  const title =
    newSegment === UserHealthSegment.CHURNED
      ? 'Te echamos de menos en Vitalcom'
      : 'Tu salud bajó — reactivemos tu tienda'

  const body =
    newSegment === UserHealthSegment.CHURNED
      ? 'No te vemos hace tiempo. Agenda 15min con el equipo y volvemos a poner tu tienda en marcha.'
      : 'Hay señales de bajada. Revisa tu P&G, una alerta de stock o una nueva lección.'

  await prisma.notification.create({
    data: {
      userId,
      type: 'AI_ACTION',
      title,
      body,
      link: '/mi-score',
      meta: { previousSegment: prevSegment, newSegment } as never,
    },
  })

  await prisma.userHealthScore.update({
    where: { userId },
    data: { lastRetentionTriggerAt: new Date() },
  })
}

// Recalcula para todos los usuarios activos de comunidad + dropshippers
export async function runHealthScoreBatch(options?: { take?: number }): Promise<{
  processed: number
  retentionTriggered: number
}> {
  const take = options?.take ?? 500
  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: [UserRole.COMMUNITY, UserRole.DROPSHIPPER] },
    },
    select: { id: true },
    take,
  })

  let processed = 0
  let retentionTriggered = 0

  for (const u of users) {
    const existing = await prisma.userHealthScore.findUnique({ where: { userId: u.id } })
    const result = await upsertUserHealthScore(u.id)
    if (!result) continue
    processed++

    if (
      existing
      && existing.segment !== result.segment
      && segmentWorsened(existing.segment, result.segment)
    ) {
      retentionTriggered++
    }
  }

  return { processed, retentionTriggered }
}
