import { prisma } from '@/lib/db/prisma'
import type { BotResult } from './types'
import { generateRecommendations } from '@/lib/ai/agents/media-buyer'
import {
  expireStaleMediaBuyer,
  seenMediaBuyerKeys,
  MEDIA_BUYER_EXPIRY_MS,
} from '@/lib/ai/recommendation-helpers'
import { syncCriticalToNotifications } from '@/lib/ai/notify-critical'

// ── AdsBot ───────────────────────────────────────────────
// Dispara el agente MediaBuyer para cada usuario con campañas
// activas, persiste recomendaciones deduplicadas, y sincroniza
// críticas al bell. Corre 1x/día · proactivo sin intervención.

export async function runAdsBot(): Promise<BotResult> {
  // Usuarios con cuentas de ads activas
  const users = await prisma.user.findMany({
    where: {
      active: true,
      adAccounts: { some: { active: true } },
    },
    select: { id: true },
  })

  if (users.length === 0) {
    return {
      usersProcessed: 0,
      itemsAffected: 0,
      notifsCreated: 0,
      errors: 0,
      summary: 'Sin usuarios con cuentas de ads activas.',
    }
  }

  let totalNewRecs = 0
  let totalNotifs = 0
  let errors = 0
  const errorLog: Array<{ userId?: string; message: string }> = []

  for (const user of users) {
    try {
      await expireStaleMediaBuyer(user.id)
      const [{ recommendations }, seen] = await Promise.all([
        generateRecommendations(user.id, 7),
        seenMediaBuyerKeys(user.id),
      ])

      const toCreate = recommendations.filter(
        (r) => !seen.has(`${r.type}:${r.campaignId ?? 'none'}`),
      )
      const expiresAt = new Date(Date.now() + MEDIA_BUYER_EXPIRY_MS)

      if (toCreate.length > 0) {
        await prisma.campaignRecommendation.createMany({
          data: toCreate.map((r) => ({
            userId: user.id,
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
            expiresAt,
          })),
        })
      }

      const notifRes = await syncCriticalToNotifications(user.id)
      totalNewRecs += toCreate.length
      totalNotifs += notifRes.created
    } catch (err) {
      errors++
      errorLog.push({
        userId: user.id,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    usersProcessed: users.length,
    itemsAffected: totalNewRecs,
    notifsCreated: totalNotifs,
    errors,
    errorLog,
    summary: `${users.length} usuarios analizados · ${totalNewRecs} recs nuevas · ${totalNotifs} notifs críticas.`,
  }
}
