// V31 — GET/POST /api/alerts (alertas proactivas del usuario)
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { guardRateLimit } from '@/lib/security/rate-limit'
import { ProactiveAlertChannel, ProactiveAlertType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const TYPE_VALUES = Object.values(ProactiveAlertType) as [string, ...string[]]
const CHANNEL_VALUES = Object.values(ProactiveAlertChannel) as [string, ...string[]]

const createSchema = z.object({
  type: z.enum(TYPE_VALUES),
  channel: z.enum(CHANNEL_VALUES).default('IN_APP'),
  enabled: z.boolean().default(true),
  config: z.record(z.unknown()).default({}),
  cooldownMinutes: z.number().int().min(15).max(10080).default(1440),
})

export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  const alerts = await prisma.proactiveAlert.findMany({
    where: { userId: session.id },
    orderBy: [{ enabled: 'desc' }, { type: 'asc' }],
  })
  return apiSuccess({
    items: alerts.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      lastTriggeredAt: a.lastTriggeredAt?.toISOString() ?? null,
    })),
  })
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  // 10 alertas creadas / hora — una regla anti-spam para config masiva
  const blocked = guardRateLimit(`alerts:create:${session.id}`, { maxRequests: 10, windowMs: 60 * 60_000 })
  if (blocked) return blocked

  const body = await req.json()
  const data = createSchema.parse(body)

  const existing = await prisma.proactiveAlert.findFirst({
    where: { userId: session.id, type: data.type as ProactiveAlertType },
  })
  if (existing) {
    return apiError('Ya existe una alerta de este tipo. Actualízala en lugar de crear otra.', 400, 'DUPLICATE')
  }

  const alert = await prisma.proactiveAlert.create({
    data: {
      userId: session.id,
      type: data.type as ProactiveAlertType,
      channel: data.channel as ProactiveAlertChannel,
      enabled: data.enabled,
      config: data.config as never,
      cooldownMinutes: data.cooldownMinutes,
    },
  })

  return apiSuccess({ id: alert.id }, 201)
})
