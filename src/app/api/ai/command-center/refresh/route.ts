import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { generateRecommendations } from '@/lib/ai/agents/media-buyer'
import { generateOptimizations } from '@/lib/ai/agents/store-optimizer'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/command-center/refresh ──────────────────
// Dispara los 3 agentes IA en paralelo y persiste las nuevas
// recomendaciones deduplicadas. Un solo botón → todo fresco.

export const POST = withErrorHandler(async () => {
  const session = await requireSession()

  // Expira viejas
  await Promise.all([
    prisma.campaignRecommendation.updateMany({
      where: { userId: session.id, status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    }),
    prisma.storeOptimization.updateMany({
      where: { userId: session.id, status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    }),
  ])

  const [mbRes, soRes] = await Promise.all([
    generateRecommendations(session.id, 7),
    generateOptimizations(session.id),
  ])

  // MediaBuyer dedup + persist
  const mbExisting = await prisma.campaignRecommendation.findMany({
    where: { userId: session.id, status: 'PENDING' },
    select: { type: true, campaignId: true },
  })
  const mbSeen = new Set(mbExisting.map((e) => `${e.type}:${e.campaignId ?? 'none'}`))
  const mbExpiresAt = new Date(Date.now() + 72 * 3600 * 1000)
  const mbToCreate = mbRes.recommendations.filter(
    (r) => !mbSeen.has(`${r.type}:${r.campaignId ?? 'none'}`),
  )

  if (mbToCreate.length > 0) {
    await prisma.campaignRecommendation.createMany({
      data: mbToCreate.map((r) => ({
        userId: session.id,
        campaignId: r.campaignId,
        accountId: r.accountId,
        type: r.type,
        title: r.title,
        reasoning: r.reasoning,
        actionLabel: r.actionLabel,
        suggestedValue: r.suggestedValue,
        priority: r.priority,
        confidence: r.confidence,
        roas: r.metrics.roas,
        spend: r.metrics.spend,
        revenue: r.metrics.revenue,
        clicks: r.metrics.clicks,
        conversions: r.metrics.conversions,
        impressions: r.metrics.impressions,
        expiresAt: mbExpiresAt,
      })),
    })
  }

  // OptimizadorTienda dedup + persist
  const soExisting = await prisma.storeOptimization.findMany({
    where: { userId: session.id, status: 'PENDING' },
    select: { type: true, productId: true },
  })
  const soSeen = new Set(soExisting.map((e) => `${e.type}:${e.productId ?? 'none'}`))
  const soExpiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000)
  const soToCreate = soRes.optimizations.filter(
    (r) => !soSeen.has(`${r.type}:${r.productId ?? 'none'}`),
  )

  if (soToCreate.length > 0) {
    await prisma.storeOptimization.createMany({
      data: soToCreate.map((r) => ({
        userId: session.id,
        productId: r.productId,
        type: r.type,
        title: r.title,
        reasoning: r.reasoning,
        actionLabel: r.actionLabel,
        suggestedValue: r.suggestedValue,
        suggestedText: r.suggestedText,
        suggestedData: r.suggestedData as any,
        priority: r.priority,
        confidence: r.confidence,
        salesLast30: r.metrics.salesLast30,
        revenueLast30: r.metrics.revenueLast30,
        marginPct: r.metrics.marginPct,
        stockLevel: r.metrics.stockLevel,
        conversionRate: r.metrics.conversionRate,
        expiresAt: soExpiresAt,
      })),
    })
  }

  return apiSuccess({
    mediaBuyer: {
      created: mbToCreate.length,
      total: mbRes.recommendations.length,
    },
    storeOptimizer: {
      created: soToCreate.length,
      total: soRes.optimizations.length,
    },
    totalNew: mbToCreate.length + soToCreate.length,
  })
})
