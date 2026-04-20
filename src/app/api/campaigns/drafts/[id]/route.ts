import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/campaigns/drafts/[id] ───────────────────────
export const GET = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params
  const draft = await prisma.campaignDraft.findFirst({
    where: { id, userId: session.id },
    include: {
      product: {
        select: { id: true, sku: true, name: true, images: true, precioPublico: true, precioComunidad: true, description: true, videoUrl: true, benefits: true },
      },
    },
  })
  if (!draft) return apiError('Borrador no encontrado', 404, 'NOT_FOUND')
  return apiSuccess(draft)
})

// ── PATCH /api/campaigns/drafts/[id] ─────────────────────
// Actualiza cualquier subset de campos del wizard.

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  productId: z.string().nullable().optional(),
  platform: z.enum(['META', 'TIKTOK', 'GOOGLE', 'OTHER']).optional(),
  objective: z.enum(['CONVERSIONS', 'TRAFFIC', 'REACH', 'LEADS', 'ENGAGEMENT', 'MESSAGES']).optional(),
  status: z.enum(['DRAFT', 'READY', 'LAUNCHED', 'PAUSED', 'ARCHIVED']).optional(),
  step: z.number().int().min(1).max(5).optional(),
  // Audiencia
  targetCountry: z.enum(['CO', 'EC', 'GT', 'CL']).nullable().optional(),
  ageMin: z.number().int().min(13).max(65).nullable().optional(),
  ageMax: z.number().int().min(13).max(65).nullable().optional(),
  gender: z.enum(['ALL', 'MALE', 'FEMALE']).nullable().optional(),
  interests: z.array(z.string()).optional(),
  placements: z.array(z.string()).optional(),
  // Creativo
  headline: z.string().max(120).nullable().optional(),
  primaryText: z.string().max(2000).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  cta: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  landingUrl: z.string().url().nullable().optional(),
  // Presupuesto
  dailyBudget: z.number().positive().nullable().optional(),
  totalBudget: z.number().positive().nullable().optional(),
  durationDays: z.number().int().min(1).max(90).nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
})

export const PATCH = withErrorHandler(async (req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params
  const body = await req.json()
  const data = patchSchema.parse(body)

  const existing = await prisma.campaignDraft.findFirst({ where: { id, userId: session.id }, select: { id: true } })
  if (!existing) return apiError('Borrador no encontrado', 404, 'NOT_FOUND')

  const updated = await prisma.campaignDraft.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : data.startDate === null ? null : undefined,
    },
    include: {
      product: { select: { id: true, sku: true, name: true, images: true, precioComunidad: true } },
    },
  })
  return apiSuccess(updated)
})

// ── DELETE /api/campaigns/drafts/[id] ────────────────────
export const DELETE = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params
  const existing = await prisma.campaignDraft.findFirst({ where: { id, userId: session.id }, select: { id: true } })
  if (!existing) return apiError('Borrador no encontrado', 404, 'NOT_FOUND')
  await prisma.campaignDraft.delete({ where: { id } })
  return apiSuccess({ id })
})
