import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { updateOrderStatusSchema, VALID_TRANSITIONS } from '@/lib/api/schemas/order'
import { OrderRepository } from '@/lib/repositories/order-repository'
import { FinanceRepository } from '@/lib/repositories/finance-repository'
import { prisma } from '@/lib/db/prisma'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/orders/[id] — Detalle de pedido ────────────
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const order = await OrderRepository.findById(id)
  if (!order) throw new Error('NOT_FOUND')

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

  // Efectos financieros según el nuevo estado
  if (data.status === 'DELIVERED') {
    await FinanceRepository.recordOrderDelivery(id)
  } else if (data.status === 'CANCELLED') {
    await FinanceRepository.recordOrderCancellation(id)
  } else if (data.status === 'RETURNED') {
    await FinanceRepository.recordOrderReturn(id)
  }

  OrderRepository.invalidateOne(id, order.userId)
  return apiSuccess(updated)
})
