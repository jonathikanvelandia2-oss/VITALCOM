// ── Constantes de pricing actualizables ──────────────────
// CENTRALIZADO: Cuando cambie el IVA, comisiones, o costos,
// solo se actualiza ESTE archivo. La calculadora se adapta automáticamente.
// Última revisión: Abril 2026

export type CountryCode = 'CO' | 'EC' | 'GT' | 'CL'

export type GatewayFee = {
  name: string
  /** Comisión porcentual (ej: 0.0299 = 2.99%) */
  rate: number
  /** Comisión fija por transacción en moneda local */
  fixed: number
}

export type CountryPricingConfig = {
  code: CountryCode
  name: string
  currency: string
  currencySymbol: string
  /** Tasa de IVA / impuesto sobre ventas (ej: 0.19 = 19%) */
  taxRate: number
  /** Nombre del impuesto en el país */
  taxName: string
  /** Costo base de envío en moneda local */
  shippingBase: number
  /** Pasarelas de pago con sus comisiones */
  gateways: GatewayFee[]
  /** Flete promedio por pedido (para simulador) */
  avgFreight: number
  /** Costos administrativos promedio por pedido */
  avgAdmin: number
  /** Tasa de despacho promedio del mercado (%) */
  avgDispatchRate: number
  /** Tasa de devolución promedio del mercado (%) */
  avgReturnRate: number
  /** CPA estimado promedio del mercado en moneda local */
  avgCPA: number
  /** Año de última actualización de estas constantes */
  updatedYear: number
}

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN POR PAÍS — actualizar cuando cambien las tasas
// ═══════════════════════════════════════════════════════════

export const PRICING_CONFIG: Record<CountryCode, CountryPricingConfig> = {
  CO: {
    code: 'CO',
    name: 'Colombia',
    currency: 'COP',
    currencySymbol: '$',
    taxRate: 0.19,
    taxName: 'IVA',
    shippingBase: 12_000,
    gateways: [
      { name: 'Wompi', rate: 0.0299, fixed: 700 },
      { name: 'MercadoPago', rate: 0.0349, fixed: 900 },
      { name: 'Nequi/Daviplata', rate: 0.015, fixed: 0 },
      { name: 'PSE', rate: 0.0275, fixed: 500 },
    ],
    avgFreight: 9_000,
    avgAdmin: 2_000,
    avgDispatchRate: 80,
    avgReturnRate: 15,
    avgCPA: 12_000,
    updatedYear: 2026,
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 0.12,
    taxName: 'IVA',
    shippingBase: 4,
    gateways: [
      { name: 'PayPhone', rate: 0.035, fixed: 0.25 },
      { name: 'MercadoPago', rate: 0.0449, fixed: 0.30 },
      { name: 'Datafast', rate: 0.039, fixed: 0.20 },
    ],
    avgFreight: 3.5,
    avgAdmin: 0.75,
    avgDispatchRate: 75,
    avgReturnRate: 12,
    avgCPA: 5,
    updatedYear: 2026,
  },
  GT: {
    code: 'GT',
    name: 'Guatemala',
    currency: 'GTQ',
    currencySymbol: 'Q',
    taxRate: 0.12,
    taxName: 'IVA',
    shippingBase: 35,
    gateways: [
      { name: 'Recurrente', rate: 0.039, fixed: 2 },
      { name: 'Visanet', rate: 0.035, fixed: 1.5 },
      { name: 'Transferencia', rate: 0, fixed: 0 },
    ],
    avgFreight: 25,
    avgAdmin: 5,
    avgDispatchRate: 70,
    avgReturnRate: 10,
    avgCPA: 40,
    updatedYear: 2026,
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    currency: 'CLP',
    currencySymbol: '$',
    taxRate: 0.19,
    taxName: 'IVA',
    shippingBase: 3_500,
    gateways: [
      { name: 'Webpay', rate: 0.0295, fixed: 200 },
      { name: 'MercadoPago', rate: 0.0399, fixed: 350 },
      { name: 'Khipu', rate: 0.012, fixed: 0 },
    ],
    avgFreight: 3_000,
    avgAdmin: 500,
    avgDispatchRate: 78,
    avgReturnRate: 12,
    avgCPA: 3_500,
    updatedYear: 2026,
  },
}

/**
 * Obtiene la config de pricing de un país.
 * Default: Colombia.
 */
export function getPricingConfig(country: CountryCode = 'CO'): CountryPricingConfig {
  return PRICING_CONFIG[country]
}

/**
 * Retorna el año actual para comparar con updatedYear.
 * Si las constantes están desactualizadas, la UI muestra un aviso.
 */
export function isConfigOutdated(country: CountryCode = 'CO'): boolean {
  const currentYear = new Date().getFullYear()
  return PRICING_CONFIG[country].updatedYear < currentYear
}
