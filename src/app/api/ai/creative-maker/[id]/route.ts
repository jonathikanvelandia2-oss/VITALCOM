import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/ai/creative-maker/[id] ──────────────────────
// Detalle de creativo.

export const GET = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params
  const creative = await prisma.adCreative.findFirst({
    where: { id, userId: session.id },
    include: { product: { select: { id: true, name: true, slug: true, images: true, description: true } } },
  })
  if (!creative) return apiError('Creativo no encontrado', 404, 'NOT_FOUND')
  return apiSuccess(creative)
})

// ── PATCH /api/ai/creative-maker/[id] ────────────────────
// Toggle favorito, editar copy manualmente.

const patchSchema = z.object({
  isFavorite: z.boolean().optional(),
  headline: z.string().min(1).max(80).optional(),
  primaryText: z.string().min(1).max(600).optional(),
  description: z.string().max(120).optional(),
  cta: z.string().max(30).optional(),
})

export const PATCH = withErrorHandler(async (req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params
  const body = await req.json()
  const input = patchSchema.parse(body)

  const existing = await prisma.adCreative.findFirst({ where: { id, userId: session.id } })
  if (!existing) return apiError('Creativo no encontrado', 404, 'NOT_FOUND')

  const updated = await prisma.adCreative.update({
    where: { id },
    data: input,
    include: { product: { select: { id: true, name: true, slug: true, images: true } } },
  })
  return apiSuccess(updated)
})

// ── DELETE /api/ai/creative-maker/[id] ───────────────────

export const DELETE = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params
  const existing = await prisma.adCreative.findFirst({ where: { id, userId: session.id } })
  if (!existing) return apiError('Creativo no encontrado', 404, 'NOT_FOUND')
  await prisma.adCreative.delete({ where: { id } })
  return apiSuccess({ id })
})
