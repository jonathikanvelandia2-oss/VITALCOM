import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/creative-maker/[id]/use ─────────────────
// Crea un CampaignDraft pre-llenado a partir del creativo y retorna el id.
// Incrementa timesUsed + lastUsedAt.

export const POST = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params

  const creative = await prisma.adCreative.findFirst({
    where: { id, userId: session.id },
    include: { product: { select: { id: true, name: true } } },
  })
  if (!creative) return apiError('Creativo no encontrado', 404, 'NOT_FOUND')

  const [draft] = await prisma.$transaction([
    prisma.campaignDraft.create({
      data: {
        userId: session.id,
        productId: creative.productId,
        name: `${creative.product.name} — ${creative.angle}`,
        platform: creative.platform,
        step: 3, // Arranca en paso 3 (Creativo) — ya tiene producto+creativo
        headline: creative.headline,
        primaryText: creative.primaryText,
        description: creative.description,
        cta: creative.cta,
        imageUrl: creative.imageUrl,
      },
      select: { id: true },
    }),
    prisma.adCreative.update({
      where: { id },
      data: {
        timesUsed: { increment: 1 },
        lastUsedAt: new Date(),
      },
    }),
  ])

  return apiSuccess({ draftId: draft.id })
})
