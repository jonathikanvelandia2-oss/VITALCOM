// ── Motor de cálculo de pricing — Calculadora + Simulador ──
// Basado en las fórmulas de Optimux + extensiones Vitalcom.
// Toda la lógica pura (sin UI) para poder usarse en API routes también.

import type { CountryPricingConfig, GatewayFee } from './constants'

// ── Tipos de entrada ────────────────────────────────────

/** Entrada para la calculadora simple (precio + margen) */
export type SimpleCalcInput = {
  basePrice: number
  marginPercent: number
  shippingCost: number
  gateway: GatewayFee
  taxRate: number
}

/** Entrada para el simulador completo (estilo Optimux) */
export type SimulatorInput = {
  /** Precio de venta al cliente final */
  salePrice: number
  /** Costo unitario del producto (precio base Vitalcom) */
  productCost: number
  /** Pedidos facturados en el período */
  invoicedOrders: number
  /** Tasa de despacho (%) — pedidos que realmente se envían */
  dispatchRate: number
  /** Tasa de devolución (%) — pedidos despachados que vuelven */
  returnRate: number
  /** Costo promedio de flete por pedido */
  freightCost: number
  /** Costo administrativo por pedido */
  adminCost: number
  /** CPA estimado — costo de adquisición por pedido facturado */
  cpaCost: number
  /** Porcentaje de publicidad sobre precio (alternativa a CPA) */
  adPercent: number
  /** Comisión de pasarela */
  gateway: GatewayFee
  /** Tasa de impuesto */
  taxRate: number
  /** Utilidad esperada (%) — para comparación */
  expectedMargin: number
}

// ── Tipos de resultado ──────────────────────────────────

export type SimpleCalcResult = {
  marginValue: number
  subtotal: number
  tax: number
  gatewayFee: number
  shipping: number
  finalPrice: number
  profit: number
  profitPercent: number
}

export type SimulatorOrdersResult = {
  invoiced: { orders: number; value: number }
  dispatched: { orders: number; value: number }
  returned: { orders: number; value: number }
  delivered: { orders: number; value: number }
}

export type SimulatorCostsResult = {
  ticketAvg: number
  productCost: number
  freightCost: number
  adSpend: number
  adminCost: number
  gatewayFee: number
  taxCost: number
  totalCosts: number
}

export type SimulatorResult = {
  orders: SimulatorOrdersResult
  costs: SimulatorCostsResult
  /** Ganancia neta del período */
  profit: number
  /** Utilidad neta (%) sobre facturado */
  profitPercent: number
  /** Ganancia por pedido entregado */
  profitPerOrder: number
  /** ROI (retorno sobre inversión publicitaria) */
  roas: number
  /** Comparación con la utilidad esperada */
  meetsExpectation: boolean
  /** Sugerencias si la utilidad es baja */
  suggestions: string[]
}

// ── Calculadora simple ──────────────────────────────────

export function calculateSimple(input: SimpleCalcInput): SimpleCalcResult {
  const { basePrice, marginPercent, shippingCost, gateway, taxRate } = input

  const marginValue = basePrice * (marginPercent / 100)
  const subtotal = basePrice + marginValue
  const tax = subtotal * taxRate
  const gatewayFee = subtotal * gateway.rate + gateway.fixed
  const finalPrice = subtotal + tax + shippingCost
  const profit = marginValue - gatewayFee

  return {
    marginValue: Math.round(marginValue),
    subtotal: Math.round(subtotal),
    tax: Math.round(tax),
    gatewayFee: Math.round(gatewayFee),
    shipping: shippingCost,
    finalPrice: Math.round(finalPrice),
    profit: Math.round(profit),
    profitPercent: finalPrice > 0 ? Math.round((profit / finalPrice) * 10000) / 100 : 0,
  }
}

// ── Simulador completo (fórmulas Optimux) ───────────────

export function calculateSimulator(input: SimulatorInput): SimulatorResult {
  const {
    salePrice, productCost, invoicedOrders,
    dispatchRate, returnRate,
    freightCost, adminCost, cpaCost, adPercent,
    gateway, taxRate, expectedMargin,
  } = input

  // 1. Pedidos y valores
  const invoicedValue = invoicedOrders * salePrice
  const dispatchedOrders = Math.round(invoicedOrders * (dispatchRate / 100))
  const dispatchedValue = dispatchedOrders * salePrice
  const returnedOrders = Math.round(dispatchedOrders * (returnRate / 100))
  const returnedValue = returnedOrders * salePrice
  const deliveredOrders = dispatchedOrders - returnedOrders
  const deliveredValue = deliveredOrders * salePrice

  // 2. Costos
  const ticketAvg = salePrice
  const totalProductCost = deliveredOrders * productCost
  const totalFreight = deliveredOrders * freightCost

  // Gasto publicitario: usar CPA si > 0, sino usar % sobre facturado
  const totalAdSpend = cpaCost > 0
    ? invoicedOrders * cpaCost
    : invoicedValue * (adPercent / 100)

  const totalAdmin = invoicedOrders * adminCost

  // Comisión de pasarela sobre entregados (solo se cobra lo que se cobra)
  const totalGateway = deliveredOrders * (salePrice * gateway.rate + gateway.fixed)

  // Impuestos sobre los ingresos netos
  const totalTax = deliveredValue * taxRate

  const totalCosts = totalProductCost + totalFreight + totalAdSpend + totalAdmin + totalGateway + totalTax

  // 3. Ganancias
  const profit = deliveredValue - totalCosts
  const profitPercent = invoicedValue > 0
    ? Math.round((profit / invoicedValue) * 10000) / 100
    : 0
  const profitPerOrder = deliveredOrders > 0
    ? Math.round(profit / deliveredOrders)
    : 0
  const roas = totalAdSpend > 0
    ? Math.round((deliveredValue / totalAdSpend) * 100) / 100
    : 0

  const meetsExpectation = profitPercent >= expectedMargin

  // 4. Sugerencias inteligentes
  const suggestions: string[] = []

  if (profit < 0) {
    suggestions.push('Tu operación tiene pérdida neta. Revisa los costos más altos.')
  }

  if (!meetsExpectation && profit > 0) {
    suggestions.push(`Tu utilidad (${profitPercent}%) está por debajo de tu meta (${expectedMargin}%).`)
  }

  // Identificar el costo más alto
  const costBreakdown = [
    { name: 'producto', value: totalProductCost },
    { name: 'flete', value: totalFreight },
    { name: 'publicidad', value: totalAdSpend },
    { name: 'administrativos', value: totalAdmin },
    { name: 'pasarela de pago', value: totalGateway },
    { name: 'impuestos', value: totalTax },
  ].sort((a, b) => b.value - a.value)

  if (profitPercent < expectedMargin && costBreakdown[0]) {
    suggestions.push(
      `Tu mayor costo es ${costBreakdown[0].name}. Considera negociar o reducirlo.`
    )
  }

  if (returnRate > 20) {
    suggestions.push('Tu tasa de devolución es alta (>20%). Revisa la calidad del producto o la expectativa del cliente.')
  }

  if (dispatchRate < 70) {
    suggestions.push('Tu tasa de despacho es baja (<70%). Esto indica muchos pedidos que no se concretan.')
  }

  if (roas > 0 && roas < 2) {
    suggestions.push('Tu ROAS es bajo (<2x). Cada peso en publicidad genera menos de 2 pesos en ventas.')
  }

  return {
    orders: {
      invoiced: { orders: invoicedOrders, value: Math.round(invoicedValue) },
      dispatched: { orders: dispatchedOrders, value: Math.round(dispatchedValue) },
      returned: { orders: returnedOrders, value: Math.round(returnedValue) },
      delivered: { orders: deliveredOrders, value: Math.round(deliveredValue) },
    },
    costs: {
      ticketAvg: Math.round(ticketAvg),
      productCost: Math.round(totalProductCost),
      freightCost: Math.round(totalFreight),
      adSpend: Math.round(totalAdSpend),
      adminCost: Math.round(totalAdmin),
      gatewayFee: Math.round(totalGateway),
      taxCost: Math.round(totalTax),
      totalCosts: Math.round(totalCosts),
    },
    profit: Math.round(profit),
    profitPercent,
    profitPerOrder,
    roas,
    meetsExpectation,
    suggestions,
  }
}
