import { prisma } from '@/lib/db/prisma'
import type { BotResult } from './types'

// ── InactivityBot ────────────────────────────────────────
// Detecta dropshippers que llevan 7+ días sin entrar a la
// plataforma (último pedido, finance entry, o cualquier acción)
// y les envía un nudge personalizado con su próxima acción IA.
// Corre 3x/semana (lun, mié, vie).

const INACTIVITY_DAYS = 7
const MAX_NUDGES_PER_30D = 2  // no spamear

export async function runInactivityBot(): Promise<BotResult> {
  const cutoff = new Date(Date.now() - INACTIVITY_DAYS * 86400000)
  const from30 = new Date(Date.now() - 30 * 86400000)

  // Dropshippers activos con cuenta verificada
  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ['COMMUNITY', 'DROPSHIPPER'] },
      createdAt: { lte: cutoff },   // ya llevan más de 7 días desde registro
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  })

  let usersProcessed = 0
  let notifsCreated = 0
  let errors = 0
  const errorLog: Array<{ userId?: string; message: string }> = []

  for (const user of users) {
    try {
      // Actividad real: último pedido o finance entry
      const [lastOrder, lastFinance, recentNudges] = await Promise.all([
        prisma.order.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        prisma.financeEntry.findFirst({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
          select: { date: true },
        }),
        prisma.notification.count({
          where: {
            userId: user.id,
            type: 'SYSTEM',
            createdAt: { gte: from30 },
            meta: { path: ['bot'], equals: 'INACTIVITY_BOT' },
          },
        }),
      ])

      const lastActivity = [lastOrder?.createdAt, lastFinance?.date]
        .filter(Boolean)
        .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0]

      // Si nunca tuvo actividad, no es inactivo — es nuevo (OnboardingBot lo maneja)
      if (!lastActivity) continue
      if (lastActivity > cutoff) continue           // actividad reciente, skip
      if (recentNudges >= MAX_NUDGES_PER_30D) continue

      // Busca siguiente acción sugerida desde Command Center
      const topRec = await prisma.storeOptimization.findFirst({
        where: { userId: user.id, status: 'PENDING' },
        orderBy: { priority: 'desc' },
        select: { title: true },
      })
      const topMb = await prisma.campaignRecommendation.findFirst({
        where: { userId: user.id, status: 'PENDING' },
        orderBy: { priority: 'desc' },
        select: { title: true },
      })

      const nudgeBody = topRec
        ? `Tu próxima acción IA: ${topRec.title}. Entra a revisar y aplicarla con 1 clic.`
        : topMb
          ? `Tu próxima acción IA: ${topMb.title}. Entra a aplicarla con 1 clic.`
          : 'Te extrañamos. Entra al Command Center y deja que la IA analice tu tienda — encontrará palancas nuevas.'

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: `🌿 Hola ${user.name?.split(' ')[0] ?? ''}, tu tienda te espera`,
          body: nudgeBody,
          link: '/comando',
          meta: {
            bot: 'INACTIVITY_BOT',
            daysSinceActivity: Math.floor((Date.now() - lastActivity.getTime()) / 86400000),
          },
        },
      })
      notifsCreated++
      usersProcessed++
    } catch (err) {
      errors++
      errorLog.push({
        userId: user.id,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    usersProcessed,
    itemsAffected: usersProcessed,
    notifsCreated,
    errors,
    errorLog,
    summary: `${usersProcessed} usuarios inactivos reactivados (${notifsCreated} notifs).`,
  }
}
