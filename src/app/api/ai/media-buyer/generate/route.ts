import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { generateRecommendations } from '@/lib/ai/agents/media-buyer'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/media-buyer/generate ────────────────────
// Analiza campañas del usuario y persiste nuevas recomendaciones.
// Evita duplicados: si ya existe PENDING del mismo tipo+campaña, no crea otra.

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7'), 3), 30)

  const { recommendations } = await generateRecommendations(session.id, days)

  // Expira viejas antes de crear nuevas
  await prisma.campaignRecommendation.updateMany({
    where: { userId: session.id, status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  })

  const existing = await prisma.campaignRecommendation.findMany({
    where: { userId: session.id, status: 'PENDING' },
    select: { type: true, campaignId: true },
  })
  const seen = new Set(existing.map((e) => `${e.type}:${e.campaignId ?? 'none'}`))

  const expiresAt = new Date(Date.now() + 72 * 3600 * 1000)
  const toCreate = recommendations.filter((r) => !seen.has(`${r.type}:${r.campaignId ?? 'none'}`))

  if (toCreate.length > 0) {
    await prisma.campaignRecommendation.createMany({
      data: toCreate.map((r) => ({
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
        expiresAt,
      })),
    })
  }

  return apiSuccess({
    created: toCreate.length,
    total: recommendations.length,
    deduped: recommendations.length - toCreate.length,
  })
})
