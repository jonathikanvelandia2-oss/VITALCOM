// V38 — GET /api/channels — lista pública para la comunidad.
// Devuelve canales activos, filtrados por país y con la URL resuelta
// (wa.me o invite). Sin analytics sensibles.

import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import {
  filterChannelsForCountry,
  groupChannelsForUI,
  resolveChannelUrl,
  type ChannelLike,
  type ChannelTypeLite,
} from '@/lib/channels/helpers'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  country: z.enum(['CO', 'EC', 'GT', 'CL']).optional(),
  type: z.enum(['STAFF_DM', 'COMMUNITY_GROUP', 'BROADCAST_LIST', 'ANNOUNCEMENTS']).optional(),
})

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const url = new URL(req.url)
  const parsed = querySchema.parse({
    country: url.searchParams.get('country') || undefined,
    type: url.searchParams.get('type') || undefined,
  })

  // Si el user tiene país propio y no se pidió filtro explícito, usar el
  // suyo. Así CO ve lo de CO + globales sin tener que pedirlo.
  const country = parsed.country ?? session.country ?? null

  const where: { active: true; type?: ChannelTypeLite } = { active: true }
  if (parsed.type) where.type = parsed.type

  const channels = await prisma.vitalcomChannel.findMany({
    where,
    orderBy: [{ order: 'asc' }, { label: 'asc' }],
  })

  const mapped: ChannelLike[] = channels.map((c) => ({
    id: c.id,
    type: c.type,
    area: c.area,
    label: c.label,
    description: c.description,
    phone: c.phone,
    inviteUrl: c.inviteUrl,
    defaultMessage: c.defaultMessage,
    icon: c.icon,
    country: c.country,
    active: c.active,
    order: c.order,
  }))

  const filtered = filterChannelsForCountry(mapped, country)
  const groups = groupChannelsForUI(filtered)

  // Agregamos URL resuelta a cada canal para que el cliente no tenga
  // que duplicar la lógica de wa.me.
  const enriched = groups.map((g) => ({
    ...g,
    channels: g.channels.map((c) => ({
      ...c,
      resolvedUrl: resolveChannelUrl(c),
    })),
  }))

  return apiSuccess({ country, groups: enriched, total: filtered.length })
})
