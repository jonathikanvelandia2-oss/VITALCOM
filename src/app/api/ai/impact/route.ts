import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/ai/impact ──────────────────────────────────
// Dashboard de Impact Tracking V21: devuelve agregados + timeline
// de AppliedAction. Query: ?days=7|30|90 (default 30).

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30'), 7), 365)
  const from = new Date(Date.now() - days * 86400000)

  const [all, inWindow, bySource, byType, topActions] = await Promise.all([
    prisma.appliedAction.count({ where: { userId: session.id } }),
    prisma.appliedAction.findMany({
      where: { userId: session.id, appliedAt: { gte: from } },
      orderBy: { appliedAt: 'desc' },
      take: 100,
    }),
    prisma.appliedAction.groupBy({
      by: ['source'],
      where: { userId: session.id, appliedAt: { gte: from } },
      _count: true,
      _sum: { estimatedImpactUsd: true, realizedImpactUsd: true },
    }),
    prisma.appliedAction.groupBy({
      by: ['actionType'],
      where: { userId: session.id, appliedAt: { gte: from } },
      _count: true,
      _sum: { estimatedImpactUsd: true },
    }),
    prisma.appliedAction.findMany({
      where: {
        userId: session.id,
        appliedAt: { gte: from },
        estimatedImpactUsd: { not: null },
      },
      orderBy: { estimatedImpactUsd: 'desc' },
      take: 5,
    }),
  ])

  // Join manual a Product (no hay relación directa en el schema)
  const productIds = Array.from(
    new Set([...inWindow, ...topActions].map((a) => a.productId).filter(Boolean) as string[]),
  )
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, images: true, slug: true },
      })
    : []
  const productMap = new Map(products.map((p) => [p.id, p]))

  // Agregados totales
  const totals = inWindow.reduce(
    (acc, a) => {
      const est = a.estimatedImpactUsd ?? 0
      const real = a.realizedImpactUsd ?? 0
      acc.totalEstimated += est
      acc.totalRealized += real
      if (a.estimatedImpactKind === 'savings') acc.savings += est
      if (a.estimatedImpactKind === 'revenue') acc.revenue += est
      if (a.estimatedImpactKind === 'margin') acc.margin += est
      return acc
    },
    { totalEstimated: 0, totalRealized: 0, savings: 0, revenue: 0, margin: 0 },
  )

  // Timeline diaria — agrupar por día
  const dailyMap = new Map<string, { estimated: number; count: number }>()
  for (const a of inWindow) {
    const key = a.appliedAt.toISOString().slice(0, 10)
    const cur = dailyMap.get(key) ?? { estimated: 0, count: 0 }
    cur.estimated += a.estimatedImpactUsd ?? 0
    cur.count += 1
    dailyMap.set(key, cur)
  }
  const daily = Array.from(dailyMap.entries())
    .map(([day, v]) => ({ day, estimated: v.estimated, count: v.count }))
    .sort((a, b) => a.day.localeCompare(b.day))

  return apiSuccess({
    period: { days, from: from.toISOString() },
    totals: {
      allTimeApplied: all,
      appliedInPeriod: inWindow.length,
      estimatedImpactUsd: Math.round(totals.totalEstimated),
      realizedImpactUsd: Math.round(totals.totalRealized),
      savingsUsd: Math.round(totals.savings),
      revenueUsd: Math.round(totals.revenue),
      marginUsd: Math.round(totals.margin),
    },
    bySource: bySource.map((s) => ({
      source: s.source,
      count: s._count,
      estimatedImpactUsd: Math.round(s._sum.estimatedImpactUsd ?? 0),
      realizedImpactUsd: Math.round(s._sum.realizedImpactUsd ?? 0),
    })),
    byType: byType
      .map((t) => ({
        actionType: t.actionType,
        count: t._count,
        estimatedImpactUsd: Math.round(t._sum.estimatedImpactUsd ?? 0),
      }))
      .sort((a, b) => b.estimatedImpactUsd - a.estimatedImpactUsd),
    topActions: topActions.map((a) => ({
      id: a.id,
      source: a.source,
      actionType: a.actionType,
      title: a.title,
      product: a.productId ? productMap.get(a.productId) ?? null : null,
      estimatedImpactUsd: Math.round(a.estimatedImpactUsd ?? 0),
      estimatedImpactKind: a.estimatedImpactKind,
      estimatedRationale: a.estimatedRationale,
      appliedAt: a.appliedAt,
    })),
    timeline: inWindow.map((a) => ({
      id: a.id,
      source: a.source,
      actionType: a.actionType,
      title: a.title,
      product: a.productId ? productMap.get(a.productId) ?? null : null,
      estimatedImpactUsd: Math.round(a.estimatedImpactUsd ?? 0),
      estimatedImpactKind: a.estimatedImpactKind,
      estimatedRationale: a.estimatedRationale,
      realizedImpactUsd: a.realizedImpactUsd,
      appliedAt: a.appliedAt,
    })),
    daily,
  })
})
