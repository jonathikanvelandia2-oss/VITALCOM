import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── POST /api/campaigns/drafts/[id]/launch ───────────────
// Valida que el borrador esté completo y lo marca READY.
// Si existe una AdAccount conectada con OAuth, además crea
// un AdCampaign espejo para que aparezca en /publicidad.
// Cuando el OAuth esté vivo, aquí se llama al API real y
// el estado transiciona a LAUNCHED.

export const POST = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params

  const draft = await prisma.campaignDraft.findFirst({
    where: { id, userId: session.id },
  })
  if (!draft) return apiError('Borrador no encontrado', 404, 'NOT_FOUND')

  const missing: string[] = []
  if (!draft.productId) missing.push('producto')
  if (!draft.targetCountry) missing.push('país objetivo')
  if (!draft.headline || !draft.primaryText) missing.push('copy creativo')
  if (!draft.imageUrl) missing.push('imagen')
  if (!draft.dailyBudget || draft.dailyBudget <= 0) missing.push('presupuesto diario')

  if (missing.length > 0) {
    return apiError(`Faltan datos: ${missing.join(', ')}`, 400, 'INCOMPLETE_DRAFT')
  }

  // Busca cuenta conectada para la plataforma
  const connectedAccount = await prisma.adAccount.findFirst({
    where: {
      userId: session.id,
      platform: draft.platform,
      active: true,
      connected: true,
    },
  })

  const linkedCampaign = connectedAccount
    ? await prisma.adCampaign.create({
        data: {
          accountId: connectedAccount.id,
          name: draft.name,
          objective: draft.objective,
          status: 'READY',
          startDate: draft.startDate ?? new Date(),
          endDate: draft.durationDays
            ? new Date((draft.startDate?.getTime() ?? Date.now()) + draft.durationDays * 24 * 3600 * 1000)
            : null,
        },
      })
    : null

  const updated = await prisma.campaignDraft.update({
    where: { id },
    data: {
      status: 'READY',
      launchedCampaignId: linkedCampaign?.id ?? null,
      launchNotes: connectedAccount
        ? `Listo para push en ${draft.platform} — espejo creado.`
        : `Conecta tu cuenta ${draft.platform} (OAuth) para publicar. Guardado como READY.`,
    },
  })

  return apiSuccess({
    draft: updated,
    linkedCampaignId: linkedCampaign?.id ?? null,
    oauthConnected: !!connectedAccount,
  })
})
