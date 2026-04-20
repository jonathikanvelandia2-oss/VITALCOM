import type { Country, OrderStatus } from '@prisma/client'

// ── Mappers Dropi ↔ Vitalcom ───────────────────────────
// Dropi usa códigos de país distintos y estados propios.
// Centralizamos la traducción aquí para que el cliente y los webhooks
// hablen el mismo idioma.

// Dropi acepta ISO-2 para CO/EC/CL, y "GT" para Guatemala.
// Si en el futuro agregan más países, se extiende esta tabla.
const COUNTRY_TO_DROPI: Record<Country, string> = {
  CO: 'CO',
  EC: 'EC',
  GT: 'GT',
  CL: 'CL',
}

export function countryToDropi(country: Country): string {
  return COUNTRY_TO_DROPI[country]
}

// Estados que envía Dropi por webhook. Mapeados a nuestro OrderStatus.
// "unknown" se ignora (no actualizamos estado).
const DROPI_STATUS_MAP: Record<string, OrderStatus | null> = {
  created: 'PROCESSING',
  processing: 'PROCESSING',
  in_warehouse: 'PROCESSING',
  picked_up: 'DISPATCHED',
  in_transit: 'DISPATCHED',
  out_for_delivery: 'DISPATCHED',
  delivered: 'DELIVERED',
  returned: 'RETURNED',
  return_in_transit: 'RETURNED',
  cancelled: 'CANCELLED',
  failed_delivery: 'RETURNED',
}

export function mapDropiStatus(status: string | undefined | null): OrderStatus | null {
  if (!status) return null
  const normalized = status.toLowerCase().trim().replace(/\s+/g, '_')
  return DROPI_STATUS_MAP[normalized] ?? null
}

// Payload Dropi para crear un envío.
// Estructura aproximada basada en patrones REST comunes.
// Si la API real difiere, solo cambia este mapper.
export type DropiShipmentPayload = {
  external_id: string       // Order.number de Vitalcom (idempotencia)
  country: string
  customer: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  items: Array<{
    sku: string
    name: string
    quantity: number
    price: number
  }>
  totals: {
    subtotal: number
    shipping: number
    total: number
  }
  notes?: string
}

export type OrderForDropi = {
  number: string
  country: Country
  customerName: string
  customerEmail: string
  customerPhone: string | null
  customerAddress: string | null
  subtotal: number
  shipping: number
  total: number
  notes: string | null
  items: Array<{
    quantity: number
    unitPrice: number
    product: { sku: string; name: string }
  }>
}

export function buildShipmentPayload(order: OrderForDropi): DropiShipmentPayload {
  return {
    external_id: order.number,
    country: countryToDropi(order.country),
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone || undefined,
      address: order.customerAddress || undefined,
    },
    items: order.items.map((it) => ({
      sku: it.product.sku,
      name: it.product.name,
      quantity: it.quantity,
      price: it.unitPrice,
    })),
    totals: {
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
    },
    notes: order.notes || undefined,
  }
}
