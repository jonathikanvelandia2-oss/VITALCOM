import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/impact/recompute ────────────────────────
// Para cada AppliedAction >=7 días antigüedad sin afterSnapshot,
// toma las métricas reales de la ventana post-apply y calcula
// el impacto realizado. Se puede correr manual o por cron diario.

const POST_APPLY_WINDOW_DAYS = 7

export const POST = withErrorHandler(async () => {
  const session = await requireSession()

  const cutoff = new Date(Date.now() - POST_APPLY_WINDOW_DAYS * 86400000)
  const candidates = await prisma.appliedAction.findMany({
    where: {
      userId: session.id,
      appliedAt: { lte: cutoff },
      afterSnapshot: { equals: null as any },
    },
    take: 50,
  })

  let updated = 0

  for (const a of candidates) {
    const windowStart = a.appliedAt
    const windowEnd = new Date(a.appliedAt.getTime() + POST_APPLY_WINDOW_DAYS * 86400000)

    let afterSnapshot: Record<string, unknown> = {}
    let realizedImpact: number | null = null

    if (a.source === 'MEDIA_BUYER' && a.campaignId) {
      const spendAgg = await prisma.adSpendEntry.aggregate({
        where: {
          campaignId: a.campaignId,
          date: { gte: windowStart, lte: windowEnd },
        },
        _sum: { spend: true, clicks: true, conversions: true, impressions: true },
      })
      const revAgg = await prisma.order.aggregate({
        where: {
          userId: session.id,
          status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        _sum: { total: true },
      })
      const spend = spendAgg._sum.spend ?? 0
      const revenue = revAgg._sum.total ?? 0
      afterSnapshot = {
        spend,
        clicks: spendAgg._sum.clicks ?? 0,
        conversions: spendAgg._sum.conversions ?? 0,
        impressions: spendAgg._sum.impressions ?? 0,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
      }
      // Impact realizado: comparar ROAS antes vs después
      const before = a.beforeSnapshot as { spend?: number; roas?: number } | null
      if (a.estimatedImpactKind === 'savings' && before?.spend) {
        // Si se pausó, el ahorro realizado = spend que habríamos gastado - spend real
        const expectedSpend = (before.spend ?? 0) * (POST_APPLY_WINDOW_DAYS / 30)
        realizedImpact = Math.max(0, expectedSpend - spend)
      } else if (a.estimatedImpactKind === 'revenue') {
        // Revenue incremental = revenue real - revenue esperado sin acción
        realizedImpact = revenue - (before?.spend ?? 0) * (before?.roas ?? 0) * (POST_APPLY_WINDOW_DAYS / 30)
      }
    }

    if (a.source === 'STORE_OPTIMIZER' && a.productId) {
      const items = await prisma.orderItem.findMany({
        where: {
          productId: a.productId,
          order: {
            userId: session.id,
            createdAt: { gte: windowStart, lte: windowEnd },
            status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
          },
        },
        select: { quantity: true, total: true },
      })
      const salesQty = items.reduce((s, it) => s + it.quantity, 0)
      const revenue = items.reduce((s, it) => s + it.total, 0)
      afterSnapshot = {
        salesWindow: salesQty,
        revenueWindow: revenue,
        windowDays: POST_APPLY_WINDOW_DAYS,
      }
      const before = a.beforeSnapshot as { revenueLast30?: number; salesLast30?: number } | null
      const expectedRevenueInWindow =
        ((before?.revenueLast30 ?? 0) * POST_APPLY_WINDOW_DAYS) / 30
      realizedImpact = revenue - expectedRevenueInWindow
    }

    await prisma.appliedAction.update({
      where: { id: a.id },
      data: {
        afterSnapshot: afterSnapshot as any,
        afterSnapshotAt: new Date(),
        realizedImpactUsd: realizedImpact != null ? Math.round(realizedImpact) : null,
        realizedCalculatedAt: realizedImpact != null ? new Date() : null,
      },
    })
    updated++
  }

  return apiSuccess({ processed: candidates.length, updated })
})
