import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { createShipment, isDropiConfigured, type OrderForDropi } from '@/lib/integrations/dropi'
import { rateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'

// ── POST /api/orders/[id]/fulfill ──────────────────────
// Dispara el envío a Dropi. Solo staff (logística + superiores).
// Transiciones válidas: PROCESSING → DISPATCHED.
// Si Dropi no está configurado, devuelve 503 y el admin puede seguir
// usando el flujo manual (PATCH /api/orders/[id] con trackingCode).

type Ctx = { params: Promise<{ id: string }> }

const STAFF_ROLES = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE']

export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  if (!STAFF_ROLES.includes(session.role)) {
    return apiError('Solo staff puede despachar pedidos', 403, 'FORBIDDEN')
  }

  const { id } = await ctx!.params

  // Rate limit: 10 despachos por minuto por usuario
  const limit = rateLimit(`dropi-fulfill:${session.id}`, {
    maxRequests: 10,
    windowMs: 60_000,
  })
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: 'Demasiados despachos. Espera 1 minuto.', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  if (!isDropiConfigured()) {
    return apiError(
      'Dropi no está configurado. Usa despacho manual o contacta al administrador.',
      503,
      'DROPI_NOT_CONFIGURED'
    )
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { sku: true, name: true } } },
      },
    },
  })

  if (!order) return apiError('Pedido no encontrado', 404, 'NOT_FOUND')

  // Solo desde PROCESSING puede despacharse.
  if (order.status !== 'PROCESSING') {
    return apiError(
      `El pedido no está listo para despachar (estado actual: ${order.status})`,
      400,
      'INVALID_STATUS'
    )
  }

  // Si ya tiene tracking, no reenviar (idempotencia).
  if (order.trackingCode) {
    return apiSuccess({
      order,
      alreadyDispatched: true,
      message: 'El pedido ya tiene tracking asignado',
    })
  }

  const payload: OrderForDropi = {
    number: order.number,
    country: order.country,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    notes: order.notes,
    items: order.items.map((it) => ({
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      product: { sku: it.product.sku, name: it.product.name },
    })),
  }

  let shipment
  try {
    shipment = await createShipment(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[dropi/fulfill] fallo al crear envío', { orderId: id, err: message })
    return apiError(
      'Dropi rechazó el envío. Revisa los datos del cliente o reintenta.',
      502,
      'DROPI_CREATE_FAILED'
    )
  }

  // Persistir tracking + estado DISPATCHED en una sola transacción.
  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: 'DISPATCHED',
      trackingCode: shipment.tracking_code,
      carrier: shipment.carrier || 'Dropi',
      externalRef: order.externalRef ?? String(shipment.id),
      notes: [
        order.notes,
        `[Dropi] Envío creado #${shipment.id} — ${shipment.tracking_code}`,
      ]
        .filter(Boolean)
        .join('\n'),
    },
    include: {
      items: { include: { product: { select: { id: true, sku: true, name: true } } } },
    },
  })

  return apiSuccess({
    order: updated,
    shipment: {
      id: shipment.id,
      trackingCode: shipment.tracking_code,
      carrier: shipment.carrier || 'Dropi',
      labelUrl: shipment.label_url,
      estimatedDelivery: shipment.estimated_delivery,
    },
  })
})
