// V26 — P&G Realtime Skill
// ═══════════════════════════════════════════════════════════
// Acceso en tiempo real al P&G del dropshipper para inyectar
// números reales en el prompt de cualquier agente IA. Basado
// 100% en FinanceEntry + AdSpendEntry + Order (schema real).
//
// Expone: getSnapshot(), getPGContext() (bloque markdown para
// prompts), simulate() (what-if).
//
// Incluye break-even ROAS automático — clave para MediaBuyer/
// MentorFinanciero: sabe el ROAS mínimo para no perder dinero.

import { prisma } from '@/lib/db/prisma'
import { FinanceCategory, FinanceType, OrderStatus } from '@prisma/client'

export interface PGSnapshot {
  period: { from: Date; to: Date; days: number }
  // ingresos
  revenueGross: number
  orderCount: number
  avgTicket: number
  // costos (desde FinanceEntry)
  cogs: number
  adsSpend: number
  shippingCost: number
  gatewayFees: number
  packagingCost: number
  operationalCost: number
  otherCosts: number
  // utilidades
  grossMargin: number
  grossMarginPct: number
  netProfit: number
  netMarginPct: number
  // métricas derivadas
  cac: number
  roas: number
  breakEvenRoas: number
  // alertas automáticas
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical'
    code: string
    message: string
  }>
}

// Estados considerados "venta cerrada" para revenue real
const REVENUE_STATUSES: OrderStatus[] = ['DELIVERED']

export async function getSnapshot(params: {
  userId: string
  from?: Date
  to?: Date
}): Promise<PGSnapshot> {
  const from = params.from ?? new Date(Date.now() - 30 * 86400_000)
  const to = params.to ?? new Date()
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400_000))

  // Queries paralelas — todas sobre schema real
  const [orderStats, adSpend, financeEgresos, financeIngresos] = await Promise.all([
    prisma.order.aggregate({
      where: {
        userId: params.userId,
        createdAt: { gte: from, lte: to },
        status: { in: REVENUE_STATUSES },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.adSpendEntry.aggregate({
      where: {
        account: { userId: params.userId },
        date: { gte: from, lte: to },
      },
      _sum: { spend: true, conversions: true },
    }),
    prisma.financeEntry.groupBy({
      by: ['category'],
      where: {
        userId: params.userId,
        date: { gte: from, lte: to },
        type: FinanceType.EGRESO,
      },
      _sum: { amount: true },
    }),
    prisma.financeEntry.aggregate({
      where: {
        userId: params.userId,
        date: { gte: from, lte: to },
        type: FinanceType.INGRESO,
      },
      _sum: { amount: true },
    }),
  ])

  const orderCount = orderStats._count._all
  const revenueFromOrders = orderStats._sum.total ?? 0
  const revenueFromFinance = financeIngresos._sum.amount ?? 0
  // Preferimos el max — FinanceEntry puede incluir ingresos manuales no en Order
  const revenueGross = Math.max(revenueFromOrders, revenueFromFinance)
  const avgTicket = orderCount > 0 ? revenueGross / orderCount : 0

  // Desglose de egresos por categoría
  const egresoMap = new Map<FinanceCategory, number>()
  for (const row of financeEgresos) {
    egresoMap.set(row.category, row._sum.amount ?? 0)
  }
  const cogs = egresoMap.get(FinanceCategory.COSTO_PRODUCTO) ?? 0
  const shippingCost = egresoMap.get(FinanceCategory.ENVIO) ?? 0
  const packagingCost = egresoMap.get(FinanceCategory.EMPAQUE) ?? 0
  const operationalCost = egresoMap.get(FinanceCategory.OPERATIVO) ?? 0
  const gatewayFees = egresoMap.get(FinanceCategory.COMISION_PLATAFORMA) ?? revenueGross * 0.04
  const otherCosts = (egresoMap.get(FinanceCategory.OTRO) ?? 0) + (egresoMap.get(FinanceCategory.IMPUESTO) ?? 0)

  // AdsSpend real desde AdSpendEntry (más preciso que FinanceEntry/PUBLICIDAD)
  const adsSpendFromEntries = adSpend._sum.spend ?? 0
  const adsSpendFromFinance = egresoMap.get(FinanceCategory.PUBLICIDAD) ?? 0
  const adsSpend = Math.max(adsSpendFromEntries, adsSpendFromFinance)

  const grossMargin = revenueGross - cogs
  const grossMarginPct = revenueGross > 0 ? (grossMargin / revenueGross) * 100 : 0

  const totalCosts = cogs + adsSpend + shippingCost + gatewayFees + packagingCost + operationalCost + otherCosts
  const netProfit = revenueGross - totalCosts
  const netMarginPct = revenueGross > 0 ? (netProfit / revenueGross) * 100 : 0

  const cac = orderCount > 0 ? adsSpend / orderCount : 0
  const roas = adsSpend > 0 ? revenueGross / adsSpend : 0

  // Break-even ROAS = ROAS mínimo para empatar después de costos no-ads
  const nonAdCostsPct = revenueGross > 0
    ? (cogs + shippingCost + gatewayFees + packagingCost + operationalCost + otherCosts) / revenueGross
    : 0.5
  const breakEvenRoas = nonAdCostsPct < 1 ? 1 / (1 - nonAdCostsPct) : 99

  // Alertas automáticas
  const alerts: PGSnapshot['alerts'] = []
  if (revenueGross > 0 && netProfit < 0) {
    alerts.push({
      severity: 'critical',
      code: 'NEGATIVE_PROFIT',
      message: `Estás perdiendo $${Math.abs(netProfit).toLocaleString('es-CO', { maximumFractionDigits: 0 })} en ${days} días. Revisa costos y precios.`,
    })
  }
  if (adsSpend > 0 && roas > 0 && roas < breakEvenRoas) {
    alerts.push({
      severity: 'warning',
      code: 'ROAS_BELOW_BREAKEVEN',
      message: `ROAS ${roas.toFixed(2)}x está bajo el break-even ${breakEvenRoas.toFixed(2)}x. Tus ads están quemando utilidad.`,
    })
  }
  if (revenueGross > 0 && netMarginPct > 0 && netMarginPct < 10) {
    alerts.push({
      severity: 'warning',
      code: 'LOW_MARGIN',
      message: `Margen neto ${netMarginPct.toFixed(1)}% — sano es >15%. Revisa pricing o costos.`,
    })
  }
  if (orderCount === 0 && adsSpend > 50_000) {
    alerts.push({
      severity: 'critical',
      code: 'NO_CONVERSIONS',
      message: `Gastaste $${adsSpend.toLocaleString('es-CO', { maximumFractionDigits: 0 })} en ads sin pedidos entregados. Revisa embudo y tracking.`,
    })
  }
  if (revenueGross === 0 && days >= 7) {
    alerts.push({
      severity: 'info',
      code: 'NO_REVENUE',
      message: `Sin ventas registradas en ${days} días. Prioriza activar el primer pedido.`,
    })
  }

  return {
    period: { from, to, days },
    revenueGross,
    orderCount,
    avgTicket,
    cogs,
    adsSpend,
    shippingCost,
    gatewayFees,
    packagingCost,
    operationalCost,
    otherCosts,
    grossMargin,
    grossMarginPct,
    netProfit,
    netMarginPct,
    cac,
    roas,
    breakEvenRoas,
    alerts,
  }
}

// Bloque de contexto para inyectar en el system prompt de cualquier agente
export async function getPGContext(userId: string): Promise<string> {
  const snap = await getSnapshot({ userId }).catch(() => null)
  if (!snap || snap.revenueGross === 0 && snap.adsSpend === 0) {
    return '## Estado financiero\nSin datos financieros registrados aún. Incentiva al usuario a registrar su primer pedido o gasto publicitario.'
  }

  const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 })

  const lines = [
    `## Estado financiero del usuario (últimos ${snap.period.days} días)`,
    `- Revenue bruto: $${fmt(snap.revenueGross)} COP`,
    `- Pedidos entregados: ${snap.orderCount} · Ticket promedio: $${fmt(snap.avgTicket)}`,
    `- COGS: $${fmt(snap.cogs)} · Margen bruto: ${snap.grossMarginPct.toFixed(1)}%`,
    `- Ads spend: $${fmt(snap.adsSpend)} · CAC: $${fmt(snap.cac)} · ROAS actual: ${snap.roas.toFixed(2)}x`,
    `- Utilidad neta: $${fmt(snap.netProfit)} (${snap.netMarginPct.toFixed(1)}%)`,
    `- Break-even ROAS: ${snap.breakEvenRoas.toFixed(2)}x (ROAS mínimo para no perder)`,
  ]

  if (snap.alerts.length > 0) {
    lines.push('\n### Alertas activas')
    for (const a of snap.alerts) {
      lines.push(`- [${a.severity.toUpperCase()}] ${a.message}`)
    }
  }

  return lines.join('\n')
}

// Simulador what-if — útil para MentorFinanciero/MediaBuyer
export async function simulate(params: {
  userId: string
  deltaAdsSpend?: number
  deltaPricePct?: number
  deltaVolumePct?: number
}): Promise<{ before: PGSnapshot; after: PGSnapshot; deltaNetProfit: number }> {
  const before = await getSnapshot({ userId: params.userId })
  const after: PGSnapshot = JSON.parse(JSON.stringify(before))
  after.period.from = new Date(before.period.from)
  after.period.to = new Date(before.period.to)

  if (params.deltaAdsSpend) {
    after.adsSpend = Math.max(0, after.adsSpend + params.deltaAdsSpend)
    // Escala con penalty 0.85 por fatiga
    const extraRevenue = params.deltaAdsSpend * before.roas * 0.85
    after.revenueGross = Math.max(0, after.revenueGross + extraRevenue)
    if (before.avgTicket > 0) {
      after.orderCount = Math.max(0, Math.floor(after.revenueGross / before.avgTicket))
    }
  }
  if (params.deltaPricePct) {
    const priceMultiplier = 1 + params.deltaPricePct / 100
    // Elasticidad -1.2: 10% más caro → 12% menos volumen
    const volumeMultiplier = Math.max(0, 1 - (params.deltaPricePct * 1.2) / 100)
    after.revenueGross = before.revenueGross * priceMultiplier * volumeMultiplier
    after.orderCount = Math.floor(before.orderCount * volumeMultiplier)
  }
  if (params.deltaVolumePct) {
    const vm = Math.max(0, 1 + params.deltaVolumePct / 100)
    after.revenueGross = before.revenueGross * vm
    after.orderCount = Math.floor(before.orderCount * vm)
    after.cogs = before.cogs * vm
  }

  const totalAfter = after.cogs + after.adsSpend + after.shippingCost + after.gatewayFees
                   + after.packagingCost + after.operationalCost + after.otherCosts
  after.netProfit = after.revenueGross - totalAfter
  after.netMarginPct = after.revenueGross > 0 ? (after.netProfit / after.revenueGross) * 100 : 0
  after.roas = after.adsSpend > 0 ? after.revenueGross / after.adsSpend : 0

  return {
    before,
    after,
    deltaNetProfit: after.netProfit - before.netProfit,
  }
}
