import { buildShipmentPayload, type OrderForDropi, type DropiShipmentPayload } from './mapper'

// ── Cliente Dropi — fulfillment multi-país ─────────────
// Autenticación por API key en header Authorization: Bearer <key>.
// Si DROPI_API_KEY no está configurado, isConfigured() retorna false y
// la app sigue funcionando en modo manual (el admin mete el tracking a mano).

const DEFAULT_BASE_URL = 'https://api.dropi.co'

export function isDropiConfigured(): boolean {
  return !!process.env.DROPI_API_KEY
}

function getBaseUrl(): string {
  return process.env.DROPI_API_URL || DEFAULT_BASE_URL
}

// ── Tipos de respuesta (mínimos, lo que consumimos) ────

export type DropiShipmentResponse = {
  id: string | number
  tracking_code: string
  carrier?: string
  status?: string
  label_url?: string
  estimated_delivery?: string
}

export type DropiTrackingResponse = {
  tracking_code: string
  status: string
  carrier?: string
  events?: Array<{
    at: string
    status: string
    description?: string
  }>
}

// ── Request helper con timeout + retry limitado ────────

async function dropiFetch<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const apiKey = process.env.DROPI_API_KEY
  if (!apiKey) throw new Error('DROPI_NOT_CONFIGURED')

  const url = `${getBaseUrl()}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })

    if (res.status === 429) {
      throw new Error('DROPI_RATE_LIMITED')
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`DROPI_${method}_FAILED: ${res.status} ${text.slice(0, 200)}`)
    }

    if (res.status === 204) return {} as T
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('DROPI_TIMEOUT')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// ── API pública ────────────────────────────────────────

/**
 * Crea un envío en Dropi a partir de una orden Vitalcom.
 * Usa external_id = order.number para idempotencia.
 */
export async function createShipment(order: OrderForDropi): Promise<DropiShipmentResponse> {
  const payload: DropiShipmentPayload = buildShipmentPayload(order)
  const response = await dropiFetch<{ data?: DropiShipmentResponse } & DropiShipmentResponse>(
    'POST',
    '/v1/shipments',
    payload
  )
  // Algunas APIs envuelven en { data: ... }, otras no.
  return (response.data ?? response) as DropiShipmentResponse
}

/**
 * Consulta el estado actual de un envío por tracking code.
 * Útil para sync manual desde el admin.
 */
export async function getTracking(trackingCode: string): Promise<DropiTrackingResponse> {
  const response = await dropiFetch<{ data?: DropiTrackingResponse } & DropiTrackingResponse>(
    'GET',
    `/v1/shipments/tracking/${encodeURIComponent(trackingCode)}`
  )
  return (response.data ?? response) as DropiTrackingResponse
}

/**
 * Cancela un envío (solo si aún no salió del almacén).
 */
export async function cancelShipment(shipmentId: string | number): Promise<void> {
  await dropiFetch('POST', `/v1/shipments/${shipmentId}/cancel`)
}
