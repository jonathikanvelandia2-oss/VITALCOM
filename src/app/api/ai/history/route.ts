import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { isRevertibleType } from '@/lib/ai/revert-action'

export const dynamic = 'force-dynamic'

// ── GET /api/ai/history ──────────────────────────────────
// Timeline de acciones IA aplicadas por el usuario con flag
// `reversible` que le dice a la UI si el botón "Revertir" debe
// estar habilitado. Filtros: ?source=MEDIA_BUYER | STORE_OPTIMIZER
// + ?status=applied|reverted|all + ?days=30

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const source = url.searchParams.get('source') as 'MEDIA_BUYER' | 'STORE_OPTIMIZER' | 'CREATIVE_MAKER' | null
  const status = (url.searchParams.get('status') as 'applied' | 'reverted' | 'all') ?? 'all'
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '60'), 7), 365)
  const from = new Date(Date.now() - days * 86400000)

  const where: Record<string, unknown> = {
    userId: session.id,
    appliedAt: { gte: from },
  }
  if (source) where.source = source
  if (status === 'applied') where.revertedAt = null
  else if (status === 'reverted') where.revertedAt = { not: null }

  const [items, totalCount, revertedCount] = await Promise.all([
    prisma.appliedAction.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: 200,
    }),
    prisma.appliedAction.count({ where: { userId: session.id, appliedAt: { gte: from } } }),
    prisma.appliedAction.count({
      where: { userId: session.id, appliedAt: { gte: from }, revertedAt: { not: null } },
    }),
  ])

  const productIds = Array.from(
    new Set(items.map((a) => a.productId).filter(Boolean) as string[]),
  )
  const campaignIds = Array.from(
    new Set(items.map((a) => a.campaignId).filter(Boolean) as string[]),
  )

  const [products, campaigns] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, images: true, slug: true },
        })
      : [],
    campaignIds.length
      ? prisma.adCampaign.findMany({
          where: { id: { in: campaignIds } },
          select: { id: true, name: true, status: true },
        })
      : [],
  ])

  const productMap = new Map(products.map((p) => [p.id, p]))
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]))

  return apiSuccess({
    period: { days, from: from.toISOString() },
    summary: {
      total: totalCount,
      reverted: revertedCount,
      active: totalCount - revertedCount,
    },
    items: items.map((a) => ({
      id: a.id,
      source: a.source,
      actionType: a.actionType,
      title: a.title,
      product: a.productId ? productMap.get(a.productId) ?? null : null,
      campaign: a.campaignId ? campaignMap.get(a.campaignId) ?? null : null,
      beforeSnapshot: a.beforeSnapshot,
      estimatedImpactUsd: a.estimatedImpactUsd,
      estimatedImpactKind: a.estimatedImpactKind,
      estimatedRationale: a.estimatedRationale,
      realizedImpactUsd: a.realizedImpactUsd,
      appliedAt: a.appliedAt,
      revertedAt: a.revertedAt,
      revertSideEffect: a.revertSideEffect,
      reversible: isRevertibleType(a.actionType) && !a.revertedAt,
    })),
  })
})
