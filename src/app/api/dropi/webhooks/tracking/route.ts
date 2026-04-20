import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  verifyDropiWebhook,
  mapDropiStatus,
  DROPI_SIGNATURE_HEADER,
} from '@/lib/integrations/dropi'
import { FinanceRepository } from '@/lib/repositories/finance-repository'
import { VALID_TRANSITIONS } from '@/lib/api/schemas/order'
import { createNotification } from '@/lib/notifications/service'
import { sendOrderStatusUpdateEmail } from '@/lib/email'

// ── POST /api/dropi/webhooks/tracking ──────────────────
// Dropi notifica cambios de estado de envíos. Payload típico:
// {
//   external_id: "VC-CO-20260420-0001",   // Order.number
//   tracking_code: "ABC123",
//   status: "in_transit" | "delivered" | "returned" | ...,
//   carrier: "Servientrega",
//   events: [...]
// }
//
// Orden de verificación:
// 1. HMAC-SHA256 del raw body con DROPI_WEBHOOK_SECRET
// 2. Buscar orden por externalRef o tracking_code o external_id
// 3. Mapear estado Dropi → OrderStatus y validar transición
// 4. Actualizar + efectos financieros si corresponde

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const signature = req.headers.get(DROPI_SIGNATURE_HEADER) || req.headers.get('X-Dropi-Signature')

  // Body RAW antes de parsear — la firma se calcula sobre el texto original.
  const rawBody = await req.text()

  if (!verifyDropiWebhook(rawBody, signature)) {
    console.warn('[dropi/webhook] firma inválida o secreto no configurado')
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: {
    external_id?: string
    tracking_code?: string
    status?: string
    carrier?: string
    events?: Array<{ at: string; status: string; description?: string }>
  }

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  const externalId = payload.external_id
  const trackingCode = payload.tracking_code

  if (!externalId && !trackingCode) {
    console.warn('[dropi/webhook] payload sin external_id ni tracking_code')
    return NextResponse.json({ received: true, ignored: 'no_identifier' })
  }

  // Buscar orden: primero por number (external_id), luego por trackingCode.
  const order = externalId
    ? await prisma.order.findUnique({ where: { number: externalId } })
    : trackingCode
      ? await prisma.order.findFirst({ where: { trackingCode } })
      : null

  if (!order) {
    console.warn('[dropi/webhook] orden no encontrada', { externalId, trackingCode })
    // Responder 200 para que Dropi no reintente infinito — la orden ya no existe.
    return NextResponse.json({ received: true, ignored: 'order_not_found' })
  }

  const newStatus = mapDropiStatus(payload.status)

  // Si el estado no mapea a algo que nos interese, solo actualizamos tracking.
  if (!newStatus) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingCode: trackingCode ?? order.trackingCode,
        carrier: payload.carrier ?? order.carrier,
      },
    })
    return NextResponse.json({ received: true, updated: 'tracking_only' })
  }

  // Ya está en ese estado — idempotencia.
  if (order.status === newStatus) {
    return NextResponse.json({ received: true, unchanged: true })
  }

  // Validar transición permitida.
  const allowed = VALID_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(newStatus)) {
    console.warn('[dropi/webhook] transición inválida', {
      order: order.number,
      from: order.status,
      to: newStatus,
    })
    return NextResponse.json({
      received: true,
      ignored: 'invalid_transition',
      from: order.status,
      to: newStatus,
    })
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      trackingCode: trackingCode ?? order.trackingCode,
      carrier: payload.carrier ?? order.carrier,
    },
  })

  // Efectos financieros (mismo comportamiento que PATCH manual)
  try {
    if (newStatus === 'DELIVERED') {
      await FinanceRepository.recordOrderDelivery(order.id)
    } else if (newStatus === 'RETURNED') {
      await FinanceRepository.recordOrderReturn(order.id)
    } else if (newStatus === 'CANCELLED') {
      await FinanceRepository.recordOrderCancellation(order.id)
    }
  } catch (err) {
    console.error('[dropi/webhook] fallo al registrar finanza', {
      order: order.number,
      err: err instanceof Error ? err.message : err,
    })
    // No fallamos el webhook — el estado ya quedó guardado.
  }

  // Notificación in-app + email al dueño del pedido (fire-and-forget)
  if (order.userId && ['DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(newStatus)) {
    const title = {
      DISPATCHED: `Pedido ${order.number} despachado`,
      DELIVERED: `Pedido ${order.number} entregado`,
      CANCELLED: `Pedido ${order.number} cancelado`,
      RETURNED: `Pedido ${order.number} devuelto`,
    }[newStatus as 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED']

    createNotification({
      userId: order.userId,
      type: 'ORDER_STATUS',
      title,
      body: trackingCode ? `Guía: ${trackingCode}` : undefined,
      link: '/pedidos',
      meta: { orderId: order.id, orderNumber: order.number, status: newStatus, source: 'dropi' },
    }).catch(() => {})
  }

  if (order.customerEmail && ['DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(newStatus)) {
    sendOrderStatusUpdateEmail(order.customerEmail, {
      orderNumber: order.number,
      customerName: order.customerName,
      status: newStatus as 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED',
      trackingCode: trackingCode ?? order.trackingCode,
      carrier: payload.carrier ?? order.carrier,
      total: order.total,
      country: order.country,
    }).catch(() => {})
  }

  return NextResponse.json({ received: true, from: order.status, to: newStatus })
}
