// V38 — Admin CRUD de canal individual.
// PATCH: actualizar. DELETE: soft delete (active=false).

import { z } from 'zod'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { validateChannelInput, normalizePhone } from '@/lib/channels/helpers'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  type: z.enum(['STAFF_DM', 'COMMUNITY_GROUP', 'BROADCAST_LIST', 'ANNOUNCEMENTS']).optional(),
  area: z.enum(['DIRECCION', 'MARKETING', 'COMERCIAL', 'ADMINISTRATIVA', 'LOGISTICA', 'CONTABILIDAD']).nullable().optional(),
  label: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  inviteUrl: z.string().url().max(500).nullable().optional(),
  defaultMessage: z.string().max(500).nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
  country: z.enum(['CO', 'EC', 'GT', 'CL']).nullable().optional(),
  active: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
})

export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params

  const existing = await prisma.vitalcomChannel.findUnique({ where: { id } })
  if (!existing) return apiError('Canal no encontrado', 404, 'NOT_FOUND')

  const body = await req.json()
  const data = updateSchema.parse(body)

  // Validamos contra el merge (lo existente + lo que cambia)
  const merged = {
    type: data.type ?? existing.type,
    label: data.label ?? existing.label,
    phone: data.phone !== undefined ? data.phone : existing.phone,
    inviteUrl: data.inviteUrl !== undefined ? data.inviteUrl : existing.inviteUrl,
  }
  const errs = validateChannelInput(merged)
  if (errs.length > 0) {
    return apiError(errs[0].message, 400, 'VALIDATION_ERROR')
  }

  const updated = await prisma.vitalcomChannel.update({
    where: { id },
    data: {
      ...data,
      phone: data.phone ? normalizePhone(data.phone) : data.phone,
    },
  })

  return apiSuccess(updated)
})

export const DELETE = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params

  const existing = await prisma.vitalcomChannel.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return apiError('Canal no encontrado', 404, 'NOT_FOUND')

  const updated = await prisma.vitalcomChannel.update({
    where: { id },
    data: { active: false },
  })

  return apiSuccess({ id: updated.id, active: false })
})
