import { prisma } from '@/lib/db/prisma'
import type { FinanceCategory, FinanceType } from '@prisma/client'

// ── Servicio de cálculo P&L del dropshipper ──────────────
// Agrega FinanceEntry por periodo y categoría para construir
// un estado de resultados dinámico.

export type Period = '7d' | '30d' | '90d' | 'month' | 'year'

export type PnLBreakdown = {
  category: FinanceCategory
  type: FinanceType
  total: number
  count: number
  label: string
}

export type PnLSummary = {
  period: Period
  from: Date
  to: Date

  // Core numbers
  ingresoBruto: number       // Ventas totales
  costoProducto: number      // COGS
  costoEnvio: number         // Shipping
  gastoPublicidad: number    // Ads
  otrosEgresos: number       // Resto
  devoluciones: number       // Returns

  gananciaBruta: number      // ingreso - COGS
  gananciaNeta: number       // gananciaBruta - todos los egresos

  // Ratios
  margenBruto: number        // % sobre ingreso
  margenNeto: number         // % sobre ingreso
  roi: number                // ganancia / inversión total (sin ventas)

  // Desglose completo
  breakdown: PnLBreakdown[]

  // Señales
  ordersCount: number
  ticketPromedio: number
  currency: string
}

const CATEGORY_LABELS: Record<FinanceCategory, string> = {
  VENTA: 'Ventas',
  COSTO_PRODUCTO: 'Costo de producto',
  ENVIO: 'Envío',
  PUBLICIDAD: 'Publicidad',
  COMISION_PLATAFORMA: 'Comisiones',
  DEVOLUCION: 'Devoluciones',
  EMPAQUE: 'Empaque',
  OPERATIVO: 'Operativo',
  IMPUESTO: 'Impuestos',
  OTRO: 'Otro',
}

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now)

  if (period === '7d') {
    const from = new Date(now)
    from.setDate(from.getDate() - 7)
    return { from, to }
  }
  if (period === '30d') {
    const from = new Date(now)
    from.setDate(from.getDate() - 30)
    return { from, to }
  }
  if (period === '90d') {
    const from = new Date(now)
    from.setDate(from.getDate() - 90)
    return { from, to }
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from, to }
  }
  if (period === 'year') {
    const from = new Date(now.getFullYear(), 0, 1)
    return { from, to }
  }
  const from = new Date(now)
  from.setDate(from.getDate() - 30)
  return { from, to }
}

/** Calcula el P&L del usuario para un periodo. */
export async function calculatePnL(userId: string, period: Period = '30d'): Promise<PnLSummary> {
  const { from, to } = getPeriodRange(period)

  // Agregación por categoría + tipo
  const grouped = await prisma.financeEntry.groupBy({
    by: ['type', 'category'],
    where: {
      userId,
      date: { gte: from, lte: to },
    },
    _sum: { amount: true },
    _count: true,
  })

  const breakdown: PnLBreakdown[] = grouped.map((g) => ({
    category: g.category,
    type: g.type,
    total: g._sum.amount ?? 0,
    count: g._count,
    label: CATEGORY_LABELS[g.category],
  }))

  const sumByCat = (cat: FinanceCategory, type?: FinanceType): number => {
    const match = breakdown.find(
      (b) => b.category === cat && (!type || b.type === type),
    )
    return match?.total ?? 0
  }

  const ingresoBruto = sumByCat('VENTA', 'INGRESO')
  const costoProducto = sumByCat('COSTO_PRODUCTO', 'EGRESO')
  const costoEnvio = sumByCat('ENVIO', 'EGRESO')
  const gastoPublicidad = sumByCat('PUBLICIDAD', 'EGRESO')
  const devoluciones = sumByCat('DEVOLUCION', 'EGRESO')

  const otrosEgresos =
    sumByCat('COMISION_PLATAFORMA', 'EGRESO') +
    sumByCat('EMPAQUE', 'EGRESO') +
    sumByCat('OPERATIVO', 'EGRESO') +
    sumByCat('IMPUESTO', 'EGRESO') +
    sumByCat('OTRO', 'EGRESO')

  const gananciaBruta = ingresoBruto - costoProducto
  const totalEgresos = costoProducto + costoEnvio + gastoPublicidad + otrosEgresos + devoluciones
  const gananciaNeta = ingresoBruto - totalEgresos

  const margenBruto = ingresoBruto > 0 ? (gananciaBruta / ingresoBruto) * 100 : 0
  const margenNeto = ingresoBruto > 0 ? (gananciaNeta / ingresoBruto) * 100 : 0
  const inversion = totalEgresos
  const roi = inversion > 0 ? (gananciaNeta / inversion) * 100 : 0

  // Métricas adicionales: órdenes + ticket
  const ordersCount = await prisma.order.count({
    where: {
      userId,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: from, lte: to },
    },
  })
  const ticketPromedio = ordersCount > 0 ? ingresoBruto / ordersCount : 0

  return {
    period,
    from,
    to,
    ingresoBruto,
    costoProducto,
    costoEnvio,
    gastoPublicidad,
    otrosEgresos,
    devoluciones,
    gananciaBruta,
    gananciaNeta,
    margenBruto: Math.round(margenBruto * 100) / 100,
    margenNeto: Math.round(margenNeto * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    breakdown,
    ordersCount,
    ticketPromedio: Math.round(ticketPromedio),
    currency: 'COP',
  }
}

/** Time series para gráficos — ingresos y egresos por día. */
export async function getPnLTimeseries(userId: string, days = 30) {
  const from = new Date()
  from.setDate(from.getDate() - days)

  const entries = await prisma.financeEntry.findMany({
    where: {
      userId,
      date: { gte: from },
    },
    select: { date: true, type: true, amount: true },
  })

  // Agregar por día
  const byDay = new Map<string, { ingreso: number; egreso: number }>()
  for (const e of entries) {
    const key = e.date.toISOString().slice(0, 10)
    const bucket = byDay.get(key) ?? { ingreso: 0, egreso: 0 }
    if (e.type === 'INGRESO') bucket.ingreso += e.amount
    else bucket.egreso += e.amount
    byDay.set(key, bucket)
  }

  // Generar array ordenado con todos los días (incluso sin datos)
  const result: Array<{ date: string; ingreso: number; egreso: number; neto: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const bucket = byDay.get(key) ?? { ingreso: 0, egreso: 0 }
    result.push({
      date: key,
      ingreso: bucket.ingreso,
      egreso: bucket.egreso,
      neto: bucket.ingreso - bucket.egreso,
    })
  }
  return result
}

/** Rentabilidad por producto — qué productos dejan más ganancia neta al dropshipper. */
export async function getProfitabilityByProduct(userId: string, period: Period = '30d', limit = 10) {
  const { from, to } = getPeriodRange(period)

  // Órdenes del usuario en periodo (no canceladas)
  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: from, lte: to },
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, precioCosto: true, precioComunidad: true },
          },
        },
      },
    },
  })

  // Agrupar por producto
  const byProduct = new Map<
    string,
    {
      productId: string
      name: string
      sku: string
      unitsSold: number
      revenue: number
      cost: number
      profit: number
      margin: number
    }
  >()

  for (const order of orders) {
    for (const item of order.items) {
      const p = item.product
      const costPerUnit = p.precioCosto ?? 0
      const bucket = byProduct.get(p.id) ?? {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unitsSold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      }
      bucket.unitsSold += item.quantity
      bucket.revenue += item.total
      bucket.cost += costPerUnit * item.quantity
      bucket.profit = bucket.revenue - bucket.cost
      bucket.margin = bucket.revenue > 0 ? (bucket.profit / bucket.revenue) * 100 : 0
      byProduct.set(p.id, bucket)
    }
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit)
    .map((p) => ({
      ...p,
      margin: Math.round(p.margin * 100) / 100,
    }))
}
