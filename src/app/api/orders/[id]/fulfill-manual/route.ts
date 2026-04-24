// V37 — POST /api/orders/[id]/fulfill-manual
// Staff de logística marca el pedido como despachado manualmente con
// transportadora + guía + costo real. Transacción atómica: actualiza
// pedido + escribe log de auditoría.

import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { guardRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { canFulfillManually, findCarrier } from '@/lib/fulfillment/helpers'
import { fulfillManually } from '@/lib/fulfillment/service'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const schema = z.object({
  carrierKey: z.string().min(3).max(60),
  trackingCode: z.string().min(3).max(100),
  manualCost: z.number().nonnegative().optional(),
  labelUrl: z.string().url().max(500).optional(),
  note: z.string().max(500).optional(),
})

export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  if (!canFulfillManually(session.role)) {
    return apiError('Solo staff puede despachar manualmente', 403, 'FORBIDDEN')
  }

  const blocked = guardRateLimit(`manual-fulfill:${session.id}`, RATE_LIMITS.api)
  if (blocked) return blocked

  const body = await req.json().catch(() => ({}))
  const data = schema.parse(body)

  // Valida que el carrier exista en nuestro catálogo para evitar que se
  // pierda el tracking URL. Carriers no-catálogo deben ir por otro flujo.
  const carrier = findCarrier(data.carrierKey)
  if (!carrier) {
    return apiError(
      `Transportadora "${data.carrierKey}" no está en el catálogo. Pide al admin que la agregue.`,
      400,
      'UNKNOWN_CARRIER',
    )
  }

  try {
    const updated = await fulfillManually({
      orderId: id,
      actorId: session.id,
      carrierKey: data.carrierKey,
      trackingCode: data.trackingCode,
      manualCost: data.manualCost,
      labelUrl: data.labelUrl,
      note: data.note,
    })
    return apiSuccess({
      order: updated,
      carrier: { key: carrier.key, label: carrier.label },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'NOT_FOUND') return apiError('Pedido no encontrado', 404, 'NOT_FOUND')
    if (msg.startsWith('INVALID_TRANSITION')) {
      return apiError(`Transición inválida: ${msg.replace('INVALID_TRANSITION:', '')}`, 400, 'INVALID_TRANSITION')
    }
    if (msg === 'INVALID_TRACKING_CODE') {
      return apiError('Guía inválida tras normalización', 400, 'INVALID_TRACKING_CODE')
    }
    throw err
  }
})
