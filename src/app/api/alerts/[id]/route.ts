// V31 — PATCH/DELETE/POST-test /api/alerts/[id]
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { ProactiveAlertChannel } from '@prisma/client'
import { evaluateAlert } from '@/lib/alerts/engine'

export const dynamic = 'force-dynamic'

const CHANNEL_VALUES = Object.values(ProactiveAlertChannel) as [string, ...string[]]

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  channel: z.enum(CHANNEL_VALUES).optional(),
  config: z.record(z.unknown()).optional(),
  cooldownMinutes: z.number().int().min(15).max(10080).optional(),
})

async function getOwnAlert(id: string, userId: string) {
  return prisma.proactiveAlert.findFirst({ where: { id, userId } })
}

export const PATCH = withErrorHandler(async (req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const alert = await getOwnAlert(ctx.params.id, session.id)
  if (!alert) return apiError('Alerta no encontrada', 404, 'NOT_FOUND')

  const body = await req.json()
  const data = patchSchema.parse(body)

  const updated = await prisma.proactiveAlert.update({
    where: { id: ctx.params.id },
    data: {
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.channel !== undefined && { channel: data.channel as ProactiveAlertChannel }),
      ...(data.config !== undefined && { config: data.config as never }),
      ...(data.cooldownMinutes !== undefined && { cooldownMinutes: data.cooldownMinutes }),
    },
  })

  return apiSuccess({ id: updated.id })
})

export const DELETE = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const alert = await getOwnAlert(ctx.params.id, session.id)
  if (!alert) return apiError('Alerta no encontrada', 404, 'NOT_FOUND')

  await prisma.proactiveAlert.delete({ where: { id: ctx.params.id } })
  return apiSuccess({ deleted: true })
})

// POST /api/alerts/[id] — dispara evaluación manual (para testing)
export const POST = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const alert = await getOwnAlert(ctx.params.id, session.id)
  if (!alert) return apiError('Alerta no encontrada', 404, 'NOT_FOUND')

  const occ = await evaluateAlert(alert)
  return apiSuccess({
    fired: Boolean(occ),
    occurrence: occ,
  })
})
