import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { updateOrderStatusSchema, VALID_TRANSITIONS } from '@/lib/api/schemas/order'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/orders/[id] — Detalle de pedido ────────────
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, sku: true, name: true, images: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!order) throw new Error('NOT_FOUND')

  // Comunidad solo puede ver sus propios pedidos
  const isStaff = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(session.role)
  if (!isStaff && order.userId !== session.id) {
    throw new Error('FORBIDDEN')
  }

  return apiSuccess(order)
})

// ── PATCH /api/orders/[id] — Cambiar estado ─────────────
// Valida transiciones permitidas (ej: PENDING → CONFIRMED ok, DELIVERED → PENDING no)
// Acceso: EMPLOYEE o superior
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const isStaff = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(session.role)
  if (!isStaff) throw new Error('FORBIDDEN')

  const { id } = await ctx!.params

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw new Error('NOT_FOUND')

  const body = await req.json()
  const data = updateOrderStatusSchema.parse(body)

  // Validar transición de estado
  const allowed = VALID_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(data.status)) {
    return apiError(
      `No se puede cambiar de ${order.status} a ${data.status}`,
      400,
      'INVALID_TRANSITION'
    )
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: data.status,
      trackingCode: data.trackingCode ?? order.trackingCode,
      carrier: data.carrier ?? order.carrier,
      notes: data.notes ? `${order.notes ? order.notes + '\n' : ''}${data.notes}` : order.notes,
    },
    include: {
      items: { include: { product: { select: { id: true, sku: true, name: true } } } },
    },
  })

  return apiSuccess(updated)
})
