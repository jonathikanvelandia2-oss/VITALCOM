import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { updateOrderStatusSchema, VALID_TRANSITIONS } from '@/lib/api/schemas/order'
import { OrderRepository } from '@/lib/repositories/order-repository'
import { FinanceRepository } from '@/lib/repositories/finance-repository'
import { prisma } from '@/lib/db/prisma'
import { createNotification } from '@/lib/notifications/service'
import { sendOrderStatusUpdateEmail } from '@/lib/email'
import { captureException } from '@/lib/observability'
import { writeFulfillmentLog } from '@/lib/fulfillment/service'
import { writeAuditLog, extractRequestMeta } from '@/lib/audit/logger'
import type { FulfillmentAction } from '@prisma/client'

const STAFF_ROLES = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'] as const
function isStaffRole(role: string): boolean {
  return (STAFF_ROLES as readonly string[]).includes(role)
}

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/orders/[id] — Detalle de pedido ────────────
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params
  const isStaff = isStaffRole(session.role)

  // Aplicamos ownership en la misma query — si no cumple, 404 (sin
  // revelar existencia del recurso).
  const order = await prisma.order.findFirst({
    where: isStaff ? { id } : { id, userId: session.id },
  })
  if (!order) throw new Error('NOT_FOUND')

  // Devolvemos vía repository para mantener el mismo shape de datos
  const detailed = await OrderRepository.findById(id)
  return apiSuccess(detailed)
})

// ── PATCH /api/orders/[id] — Cambiar estado ─────────────
// Staff: transiciones normales.
// Dueño del pedido: solo puede CANCELAR si está PENDING o CONFIRMED.
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const isStaff = isStaffRole(session.role)

  const { id } = await ctx!.params

  // Filtrado atómico de ownership — si no cumple, 404.
  const order = await prisma.order.findFirst({
    where: isStaff ? { id } : { id, userId: session.id },
  })
  if (!order) throw new Error('NOT_FOUND')

  const body = await req.json()
  const data = updateOrderStatusSchema.parse(body)

  // Dueño solo puede cancelar pedidos early-stage
  const isOwner = order.userId === session.id
  if (!isStaff && isOwner) {
    const cancellable = ['PENDING', 'CONFIRMED']
    if (data.status !== 'CANCELLED' || !cancellable.includes(order.status)) {
      return apiError(
        'Solo puedes cancelar pedidos que aún no están en proceso',
        403,
        'FORBIDDEN_TRANSITION',
      )
    }
  }

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

  // V37 — Audit trail: cada transición deja registro con actor + metadata.
  // Fire-and-forget: no bloqueamos al cliente si falla el log.
  const actionByStatus: Record<string, FulfillmentAction> = {
    PENDING: 'STATUS_CHANGED',
    CONFIRMED: 'STATUS_CHANGED',
    PROCESSING: 'STATUS_CHANGED',
    DISPATCHED: 'TRACKING_ASSIGNED',
    DELIVERED: 'DELIVERED_CONFIRMED',
    CANCELLED: 'CANCELLED',
    RETURNED: 'RETURNED',
  }
  writeFulfillmentLog(prisma, {
    orderId: id,
    actorId: session.id,
    action: actionByStatus[data.status] ?? 'STATUS_CHANGED',
    fromStatus: order.status,
    toStatus: data.status,
    message: data.notes ?? null,
    metadata: {
      ...(data.trackingCode ? { trackingCode: data.trackingCode } : {}),
      ...(data.carrier ? { carrier: data.carrier } : {}),
      actor: session.role,
    },
  }).catch((err) =>
    captureException(err, {
      route: '/api/orders/[id]',
      tags: { stage: 'audit-log' },
      extra: { orderId: id, toStatus: data.status },
    }),
  )

  // V40 — Audit log global: escribir también en la bitácora de seguridad
  // general (complementaria a FulfillmentLog que es específica de pedidos).
  const meta = extractRequestMeta(req)
  const isCancellation = data.status === 'CANCELLED'
  writeAuditLog({
    resource: 'ORDER',
    action: isCancellation ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
    resourceId: id,
    summary: `${session.email} cambió pedido ${updated.number}: ${order.status} → ${data.status}`,
    actor: { id: session.id, email: session.email, role: session.role },
    metadata: {
      orderNumber: updated.number,
      fromStatus: order.status,
      toStatus: data.status,
      trackingCode: data.trackingCode ?? null,
      carrier: data.carrier ?? null,
      cancelledByOwner: !isStaff && isOwner,
    },
    ip: meta.ip,
    userAgent: meta.userAgent,
  })

  // Efectos financieros según el nuevo estado
  if (data.status === 'DELIVERED') {
    await FinanceRepository.recordOrderDelivery(id)
  } else if (data.status === 'CANCELLED') {
    await FinanceRepository.recordOrderCancellation(id)
  } else if (data.status === 'RETURNED') {
    await FinanceRepository.recordOrderReturn(id)
  }

  // Notificar al dueño del pedido (bell + email) — solo estados finales/visibles
  const notifiableStatus = ['DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED'] as const
  if (order.userId && (notifiableStatus as readonly string[]).includes(data.status)) {
    const title = {
      DISPATCHED: `Pedido ${updated.number} despachado`,
      DELIVERED: `Pedido ${updated.number} entregado`,
      CANCELLED: `Pedido ${updated.number} cancelado`,
      RETURNED: `Pedido ${updated.number} devuelto`,
    }[data.status as 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED']

    createNotification({
      userId: order.userId,
      type: 'ORDER_STATUS',
      title,
      body: updated.trackingCode ? `Guía: ${updated.trackingCode}` : undefined,
      link: `/pedidos`,
      meta: { orderId: id, orderNumber: updated.number, status: data.status },
    }).catch(err =>
      captureException(err, {
        route: '/api/orders/[id]',
        tags: { stage: 'notify' },
        extra: { orderId: id, recipientId: order.userId },
      }),
    )

    if (order.customerEmail) {
      sendOrderStatusUpdateEmail(order.customerEmail, {
        orderNumber: updated.number,
        customerName: updated.customerName,
        status: data.status as 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED',
        trackingCode: updated.trackingCode,
        carrier: updated.carrier,
        total: updated.total,
        country: updated.country,
      }).catch(err =>
        captureException(err, {
          route: '/api/orders/[id]',
          tags: { stage: 'email' },
          extra: { orderId: id, orderNumber: updated.number },
        }),
      )
    }
  }

  OrderRepository.invalidateOne(id, order.userId)
  return apiSuccess(updated)
})
