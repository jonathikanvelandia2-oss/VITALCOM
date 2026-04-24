// V37 — Helpers puros de fulfillment.
// Transiciones de estado, URLs de tracking por transportadora LATAM,
// estimación de días de entrega, validación de RBAC, normalización de
// guías. Todo determinista, testeable, sin I/O.

export type OrderStatusLite =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'

export type FulfillmentModeLite = 'MANUAL' | 'DROPI' | 'EFFI' | 'SHOPIFY_NATIVE'

export type CountryLite = 'CO' | 'EC' | 'GT' | 'CL'

// ── Transiciones de estado ────────────────────────────
// Misma tabla que VALID_TRANSITIONS en order.ts, expuesta como función
// tipada para usar desde cualquier capa.

export const ORDER_TRANSITIONS: Record<OrderStatusLite, OrderStatusLite[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
}

export function canTransitionTo(from: OrderStatusLite, to: OrderStatusLite): boolean {
  const allowed = ORDER_TRANSITIONS[from] ?? []
  return allowed.includes(to)
}

export function nextStatusesFor(from: OrderStatusLite): OrderStatusLite[] {
  return [...(ORDER_TRANSITIONS[from] ?? [])]
}

export function isTerminalStatus(status: OrderStatusLite): boolean {
  return ORDER_TRANSITIONS[status].length === 0
}

// ── Tracking URLs por transportadora ──────────────────
// LATAM: las principales transportadoras que Vitalcom usará manualmente.
// Lista cerrada — agregar con PR cuando se abra un país nuevo.

export type CarrierInfo = {
  key: string
  label: string
  country: CountryLite
  trackingUrlTemplate: string // usa {{code}} como placeholder
  website: string
}

export const CARRIERS: readonly CarrierInfo[] = [
  // Colombia
  { key: 'servientrega-co', label: 'Servientrega', country: 'CO', trackingUrlTemplate: 'https://www.servientrega.com/wps/portal/rastreo-envio?guia={{code}}', website: 'https://www.servientrega.com' },
  { key: 'coordinadora-co', label: 'Coordinadora', country: 'CO', trackingUrlTemplate: 'https://coordinadora.com/rastreo-de-envios/rastreo-de-guia/?guia={{code}}', website: 'https://coordinadora.com' },
  { key: 'interrapidisimo-co', label: 'Interrapidísimo', country: 'CO', trackingUrlTemplate: 'https://www.interrapidisimo.com/sigue-tu-envio/?guia={{code}}', website: 'https://www.interrapidisimo.com' },
  { key: 'envia-co', label: 'Envía', country: 'CO', trackingUrlTemplate: 'https://www.envia.co/rastrear-envio?guia={{code}}', website: 'https://www.envia.co' },
  { key: 'deprisa-co', label: 'Deprisa', country: 'CO', trackingUrlTemplate: 'https://www.deprisa.com/rastreo/{{code}}', website: 'https://www.deprisa.com' },

  // Ecuador
  { key: 'servientrega-ec', label: 'Servientrega EC', country: 'EC', trackingUrlTemplate: 'https://www.servientrega.com.ec/Tracking/?guia={{code}}', website: 'https://www.servientrega.com.ec' },
  { key: 'laarcourier-ec', label: 'Laar Courier', country: 'EC', trackingUrlTemplate: 'https://www.laarcourier.com/rastreo?guia={{code}}', website: 'https://www.laarcourier.com' },
  { key: 'tramaco-ec', label: 'Tramaco', country: 'EC', trackingUrlTemplate: 'https://www.tramaco.com.ec/rastreo?guia={{code}}', website: 'https://www.tramaco.com.ec' },

  // Guatemala
  { key: 'forza-gt', label: 'Forza Delivery', country: 'GT', trackingUrlTemplate: 'https://www.forzadelivery.com/track?guia={{code}}', website: 'https://www.forzadelivery.com' },
  { key: 'guatex-gt', label: 'Guatex', country: 'GT', trackingUrlTemplate: 'https://www.guatex.com.gt/tracking?guia={{code}}', website: 'https://www.guatex.com.gt' },
  { key: 'cargo-expreso-gt', label: 'Cargo Expreso', country: 'GT', trackingUrlTemplate: 'https://cargoexpreso.com/tracking?guia={{code}}', website: 'https://cargoexpreso.com' },

  // Chile
  { key: 'starken-cl', label: 'Starken', country: 'CL', trackingUrlTemplate: 'https://www.starken.cl/seguimiento?guia={{code}}', website: 'https://www.starken.cl' },
  { key: 'chilexpress-cl', label: 'Chilexpress', country: 'CL', trackingUrlTemplate: 'https://www.chilexpress.cl/seguimiento?guia={{code}}', website: 'https://www.chilexpress.cl' },
  { key: 'correos-cl', label: 'Correos Chile', country: 'CL', trackingUrlTemplate: 'https://www.correos.cl/seguimiento/{{code}}', website: 'https://www.correos.cl' },
]

export function getCarriersForCountry(country: CountryLite): CarrierInfo[] {
  return CARRIERS.filter((c) => c.country === country)
}

export function findCarrier(key: string): CarrierInfo | null {
  return CARRIERS.find((c) => c.key === key) ?? null
}

export function buildTrackingUrl(carrierKey: string | null | undefined, code: string | null | undefined): string | null {
  if (!carrierKey || !code) return null
  const carrier = findCarrier(carrierKey)
  if (!carrier) return null
  const safeCode = encodeURIComponent(code.trim())
  return carrier.trackingUrlTemplate.replace('{{code}}', safeCode)
}

// ── Estimación de entrega ─────────────────────────────
// Basado en experiencia promedio LATAM. Se usa para setear expectativas
// al dropshipper ("tu pedido llega aprox. en X días").

const DELIVERY_DAYS_BY_COUNTRY: Record<CountryLite, { min: number; max: number }> = {
  CO: { min: 2, max: 5 },
  EC: { min: 3, max: 7 },
  GT: { min: 3, max: 6 },
  CL: { min: 4, max: 8 },
}

export function estimateDeliveryWindow(country: CountryLite): { min: number; max: number } {
  return DELIVERY_DAYS_BY_COUNTRY[country]
}

export function estimateDeliveryDate(country: CountryLite, fromDate: Date = new Date()): {
  minDate: Date
  maxDate: Date
} {
  const { min, max } = estimateDeliveryWindow(country)
  const minDate = new Date(fromDate)
  minDate.setDate(minDate.getDate() + min)
  const maxDate = new Date(fromDate)
  maxDate.setDate(maxDate.getDate() + max)
  return { minDate, maxDate }
}

// ── Normalización de guía ─────────────────────────────
// Los staffers a veces pegan la guía con espacios, guiones, o prefijos.
// Normalizar a UPPERCASE + trim + solo alfanumérico/guion.

export function normalizeTrackingCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
}

// ── RBAC helper ───────────────────────────────────────
// Modo MANUAL requiere staff (LOGISTICA o superior).
// Modos DROPI/EFFI requieren ADMIN o superior (por la carga a sistemas
// externos con costo asociado).

const STAFF_ROLES = new Set(['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'])
const ADMIN_ROLES = new Set(['SUPERADMIN', 'ADMIN'])

export function canFulfillManually(role: string): boolean {
  return STAFF_ROLES.has(role)
}

export function canFulfillWithProvider(role: string): boolean {
  return ADMIN_ROLES.has(role)
}

// ── Resumen de fulfillment ────────────────────────────
// Estructura que el UI pinta para decidir qué acciones ofrecer.

export type FulfillmentSnapshot = {
  status: OrderStatusLite
  mode: FulfillmentModeLite
  trackingCode: string | null
  trackingUrl: string | null
  carrierLabel: string | null
  fulfilledAt: string | null
  estimatedMinDate: string | null
  estimatedMaxDate: string | null
  nextActions: OrderStatusLite[]
  isTerminal: boolean
}

export function buildFulfillmentSnapshot(input: {
  status: OrderStatusLite
  mode: FulfillmentModeLite
  country: CountryLite
  trackingCode: string | null
  carrier: string | null
  fulfilledAt: Date | null
}): FulfillmentSnapshot {
  const carrier = input.carrier ? findCarrier(input.carrier) : null
  const nextActions = nextStatusesFor(input.status)
  const estimate = input.fulfilledAt
    ? estimateDeliveryDate(input.country, input.fulfilledAt)
    : null

  return {
    status: input.status,
    mode: input.mode,
    trackingCode: input.trackingCode,
    trackingUrl: buildTrackingUrl(input.carrier, input.trackingCode),
    carrierLabel: carrier?.label ?? input.carrier ?? null,
    fulfilledAt: input.fulfilledAt ? input.fulfilledAt.toISOString() : null,
    estimatedMinDate: estimate ? estimate.minDate.toISOString() : null,
    estimatedMaxDate: estimate ? estimate.maxDate.toISOString() : null,
    nextActions,
    isTerminal: isTerminalStatus(input.status),
  }
}
