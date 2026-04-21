import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { generateRecommendations } from '@/lib/ai/agents/media-buyer'
import { generateOptimizations } from '@/lib/ai/agents/store-optimizer'
import { syncCriticalToNotifications } from '@/lib/ai/notify-critical'
import {
  expireStaleMediaBuyer,
  expireStaleStoreOptimizer,
  seenMediaBuyerKeys,
  seenStoreOptimizerKeys,
  MEDIA_BUYER_EXPIRY_MS,
  STORE_OPTIMIZER_EXPIRY_MS,
} from '@/lib/ai/recommendation-helpers'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/command-center/refresh ──────────────────
// Dispara los 2 agentes IA accionables en paralelo + expira
// vencidas + dedup + sync de críticas al bell. Un solo botón → todo fresco.

export const POST = withErrorHandler(async () => {
  const session = await requireSession()
  const userId = session.id

  // Paraleliza todo lo que puede correr sin depender del anterior:
  // expira vencidas + genera nuevas + obtiene keys de dedup
  const [mbRes, soRes, mbSeen, soSeen] = await Promise.all([
    generateRecommendations(userId, 7),
    generateOptimizations(userId),
    expireStaleMediaBuyer(userId).then(() => seenMediaBuyerKeys(userId)),
    expireStaleStoreOptimizer(userId).then(() => seenStoreOptimizerKeys(userId)),
  ])

  const mbExpiresAt = new Date(Date.now() + MEDIA_BUYER_EXPIRY_MS)
  const soExpiresAt = new Date(Date.now() + STORE_OPTIMIZER_EXPIRY_MS)

  const mbToCreate = mbRes.recommendations.filter(
    (r) => !mbSeen.has(`${r.type}:${r.campaignId ?? 'none'}`),
  )
  const soToCreate = soRes.optimizations.filter(
    (r) => !soSeen.has(`${r.type}:${r.productId ?? 'none'}`),
  )

  // Inserts en paralelo también
  await Promise.all([
    mbToCreate.length > 0
      ? prisma.campaignRecommendation.createMany({
          data: mbToCreate.map((r) => ({
            userId,
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
      : Promise.resolve(),
    soToCreate.length > 0
      ? prisma.storeOptimization.createMany({
          data: soToCreate.map((r) => ({
            userId,
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
      : Promise.resolve(),
  ])

  // V20 — sync críticas a bell (se ejecuta después porque necesita las nuevas)
  const notifSync = await syncCriticalToNotifications(userId)

  return apiSuccess({
    mediaBuyer: { created: mbToCreate.length, total: mbRes.recommendations.length },
    storeOptimizer: { created: soToCreate.length, total: soRes.optimizations.length },
    notifications: notifSync,
    totalNew: mbToCreate.length + soToCreate.length,
  })
})
