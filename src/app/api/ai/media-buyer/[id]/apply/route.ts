import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/media-buyer/[id]/apply ──────────────────
// Ejecuta la acción sugerida por una recomendación:
// - PAUSE_CAMPAIGN       → AdCampaign.status = 'PAUSED'
// - SCALE_BUDGET/REDUCE  → marca aplicada (la acción real de budget
//                           se ejecuta al registrar el próximo spend)
// - TEST_CREATIVE        → redirecciona a lanzador (no acción server)
// - ADD_TRACKING         → solo marca como dismissed (info)
// - OPTIMIZE_BID         → marca aplicada (requiere acción manual)
// - RESTART_CAMPAIGN     → AdCampaign.status = 'ACTIVE'

export const POST = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params

  const rec = await prisma.campaignRecommendation.findFirst({
    where: { id, userId: session.id, status: 'PENDING' },
    include: { campaign: true },
  })
  if (!rec) return apiError('Recomendación no encontrada o ya aplicada', 404, 'NOT_FOUND')

  let sideEffect: string | null = null

  if (rec.type === 'PAUSE_CAMPAIGN' && rec.campaign) {
    await prisma.adCampaign.update({
      where: { id: rec.campaign.id },
      data: { status: 'PAUSED' },
    })
    sideEffect = `campaign_paused:${rec.campaign.id}`
  }

  if (rec.type === 'RESTART_CAMPAIGN' && rec.campaign) {
    await prisma.adCampaign.update({
      where: { id: rec.campaign.id },
      data: { status: 'ACTIVE' },
    })
    sideEffect = `campaign_active:${rec.campaign.id}`
  }

  const updated = await prisma.campaignRecommendation.update({
    where: { id },
    data: { status: 'APPLIED', appliedAt: new Date() },
  })

  return apiSuccess({ recommendation: updated, sideEffect })
})
