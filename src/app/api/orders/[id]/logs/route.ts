// V37 — GET /api/orders/[id]/logs
// Audit trail completo del pedido. Staff ve todo; el dueño del pedido ve
// los eventos relevantes para su visibilidad (sin metadata sensible).

import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession, isStaff } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { listLogs } from '@/lib/fulfillment/service'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!order) return apiError('Pedido no encontrado', 404, 'NOT_FOUND')

  const staff = isStaff(session.role)
  if (!staff && order.userId !== session.id) {
    return apiError('Sin permisos', 403, 'FORBIDDEN')
  }

  const logs = await listLogs(id, 100)

  // Para el dueño (no staff) escondemos metadata (puede tener costos reales,
  // comentarios internos, etc). Devolvemos solo lo visible al cliente.
  const items = logs.map((log) => ({
    id: log.id,
    action: log.action,
    fromStatus: log.fromStatus,
    toStatus: log.toStatus,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
    actor: staff
      ? {
          id: log.actor.id,
          name: log.actor.name,
          email: log.actor.email,
          role: log.actor.role,
          area: log.actor.area,
        }
      : { name: log.actor.name ?? 'Equipo Vitalcom' },
    metadata: staff ? log.metadata : undefined,
  }))

  return apiSuccess({ items, total: items.length })
})
