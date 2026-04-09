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
      { name: 'Ninguna (contra entrega / Dropi)', rate: 0, fixed: 0 },
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
      { name: 'Ninguna (contra entrega / Dropi)', rate: 0, fixed: 0 },
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
      { name: 'Ninguna (contra entrega / Dropi)', rate: 0, fixed: 0 },
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
      { name: 'Ninguna (contra entrega / Dropi)', rate: 0, fixed: 0 },
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

// ═══════════════════════════════════════════════════════════
// TASAS DE CAMBIO — Base: USD (dólar estadounidense)
// Actualizar mensualmente o integrar API de tasas en el futuro.
// Fuente referencial: Banco de la República (CO), BCE (EC), Banguat (GT), BCCh (CL)
// ═══════════════════════════════════════════════════════════

export type ExchangeRates = {
  /** Fecha de última actualización (YYYY-MM-DD) */
  updatedAt: string
  /** Fuente de las tasas */
  source: string
  /** Tasas: cuántas unidades de moneda local equivalen a 1 USD */
  rates: Record<string, number>
}

export const EXCHANGE_RATES: ExchangeRates = {
  updatedAt: '2026-04-09',
  source: 'Bancos centrales LATAM — tasas referenciales',
  rates: {
    USD: 1,
    COP: 4_150,    // 1 USD = 4.150 COP (Banco de la República)
    GTQ: 7.75,     // 1 USD = 7.75 GTQ (Banguat)
    CLP: 950,      // 1 USD = 950 CLP (Banco Central de Chile)
  },
}

/**
 * Convierte un monto de una moneda a otra.
 * Ejemplo: convertCurrency(100_000, 'COP', 'USD') → 24.10
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  const fromRate = EXCHANGE_RATES.rates[from]
  const toRate = EXCHANGE_RATES.rates[to]
  if (!fromRate || !toRate) return 0

  // Convertir a USD primero, luego a la moneda destino
  const usd = amount / fromRate
  return usd * toRate
}

/**
 * Formatea un monto en una moneda específica con separadores locales.
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    COP: '$', USD: '$', GTQ: 'Q', CLP: '$',
  }
  const sym = symbols[currency] || ''

  // COP y CLP no usan decimales; USD y GTQ sí
  if (currency === 'COP' || currency === 'CLP') {
    return `${sym} ${Math.round(amount).toLocaleString('es-CO')}`
  }
  return `${sym} ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Devuelve la conversión de un monto a TODAS las monedas.
 */
export function convertToAll(amount: number, fromCurrency: string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const currency of Object.keys(EXCHANGE_RATES.rates)) {
    result[currency] = convertCurrency(amount, fromCurrency, currency)
  }
  return result
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

/** Lista de países para el selector */
export const COUNTRY_LIST = Object.values(PRICING_CONFIG)

/** Banderas para el selector */
export const COUNTRY_FLAGS: Record<CountryCode, string> = {
  CO: '🇨🇴',
  EC: '🇪🇨',
  GT: '🇬🇹',
  CL: '🇨🇱',
}
