// V38 — Admin CRUD de canales Vitalcom.
// GET: lista completa con analytics (clicks agregados por canal)
// POST: crear canal — valida input con helper puro + Prisma.

import { z } from 'zod'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { validateChannelInput, aggregateClicks, normalizePhone } from '@/lib/channels/helpers'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  type: z.enum(['STAFF_DM', 'COMMUNITY_GROUP', 'BROADCAST_LIST', 'ANNOUNCEMENTS']),
  area: z.enum(['DIRECCION', 'MARKETING', 'COMERCIAL', 'ADMINISTRATIVA', 'LOGISTICA', 'CONTABILIDAD']).nullable().optional(),
  label: z.string().min(2).max(100),
  description: z.string().max(500).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  inviteUrl: z.string().url().max(500).nullable().optional(),
  defaultMessage: z.string().max(500).nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
  country: z.enum(['CO', 'EC', 'GT', 'CL']).nullable().optional(),
  active: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
})

export const GET = withErrorHandler(async () => {
  await requireRole('MANAGER_AREA')

  const channels = await prisma.vitalcomChannel.findMany({
    orderBy: [{ order: 'asc' }, { label: 'asc' }],
  })

  // Aggregamos clicks de los últimos 30 días para dashboard de admin.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const clicks = await prisma.channelClick.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { channelId: true, createdAt: true },
  })

  const agg = aggregateClicks(clicks)

  const items = channels.map((c) => ({
    ...c,
    analytics: agg.get(c.id) ?? {
      channelId: c.id,
      total: 0,
      last7Days: 0,
      last30Days: 0,
      lastClickAt: null,
    },
  }))

  return apiSuccess({ items })
})

export const POST = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')

  const body = await req.json()
  const data = createSchema.parse(body)

  // Validación semántica: phone requerido para ciertos tipos, URL para otros.
  const validationErrors = validateChannelInput({
    type: data.type,
    label: data.label,
    phone: data.phone,
    inviteUrl: data.inviteUrl,
  })
  if (validationErrors.length > 0) {
    return apiError(validationErrors[0].message, 400, 'VALIDATION_ERROR')
  }

  const created = await prisma.vitalcomChannel.create({
    data: {
      type: data.type,
      area: data.area ?? null,
      label: data.label,
      description: data.description ?? null,
      phone: data.phone ? normalizePhone(data.phone) : null,
      inviteUrl: data.inviteUrl ?? null,
      defaultMessage: data.defaultMessage ?? null,
      icon: data.icon ?? null,
      country: data.country ?? null,
      active: data.active,
      order: data.order,
    },
  })

  return apiSuccess(created, 201)
})
