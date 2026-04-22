// V33 — PATCH /api/admin/assets/[id] — aprobar/rechazar/feature/archive
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AssetStatus, AssetType, SalesAngle } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  status: z.nativeEnum(AssetStatus).optional(),
  type: z.nativeEnum(AssetType).optional(),
  angle: z.nativeEnum(SalesAngle).nullable().optional(),
  altText: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  heroRank: z.number().int().min(1).max(100).nullable().optional(),
  rejectionReason: z.string().max(300).optional(),
})

export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireRole('ADMIN')
  const { id } = await ctx!.params

  const asset = await prisma.productAsset.findUnique({ where: { id } })
  if (!asset) return apiError('Asset no encontrado', 404, 'NOT_FOUND')

  const body = await req.json()
  const data = patchSchema.parse(body)

  const updates: Record<string, unknown> = {}
  if (data.status !== undefined) {
    updates.status = data.status
    updates.reviewedBy = session.id
    updates.reviewedAt = new Date()
    if (data.status === AssetStatus.REJECTED && data.rejectionReason) {
      updates.rejectionReason = data.rejectionReason
    }
  }
  if (data.type !== undefined) updates.type = data.type
  if (data.angle !== undefined) updates.angle = data.angle
  if (data.altText !== undefined) updates.altText = data.altText
  if (data.caption !== undefined) updates.caption = data.caption
  if (data.heroRank !== undefined) updates.heroRank = data.heroRank

  await prisma.productAsset.update({ where: { id }, data: updates })
  return apiSuccess({ updated: true })
})

export const DELETE = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params
  const asset = await prisma.productAsset.findUnique({ where: { id }, select: { id: true } })
  if (!asset) return apiError('Asset no encontrado', 404, 'NOT_FOUND')
  await prisma.productAsset.update({
    where: { id },
    data: { status: AssetStatus.ARCHIVED },
  })
  return apiSuccess({ archived: true })
})
