import { prisma } from '@/lib/db/prisma'

// ── Helpers de Benchmarks Comunidad (V24) ───────────────
// Calcula percentiles anónimos de la comunidad VITALCOMMERS
// (últimos 30 días). Incluye al usuario para decirle dónde está
// ubicado vs el resto. FOMO saludable + motivación.
//
// Privacidad: SOLO agregados numéricos. Jamás devuelve datos
// personales de otros usuarios.

export type PercentileRank = 'top_10' | 'top_25' | 'top_50' | 'below_50'

export type MetricBenchmark = {
  userValue: number | null
  percentileRank: PercentileRank | null
  percentileIndex: number | null        // 0-100, mayor = mejor
  communityMedian: number
  communityTop10: number                 // valor del percentil 90
  communityMean: number
  sampleSize: number
}

export type BenchmarksPayload = {
  revenue30d: MetricBenchmark
  orders30d: MetricBenchmark
  marginPct30d: MetricBenchmark
  roas30d: MetricBenchmark
}

/** Percentil básico sin libs — devuelve valor en posición p (0-1) de un array ordenado ASC */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length))
  return sorted[idx]
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, n) => s + n, 0) / arr.length
}

/** Dónde cae el userValue en la distribución — retorna rank + índice 0-100 */
function rankOf(userValue: number | null, sorted: number[]): {
  rank: PercentileRank | null
  index: number | null
} {
  if (userValue == null || sorted.length < 3) return { rank: null, index: null }
  let below = 0
  for (const v of sorted) {
    if (v < userValue) below++
    else break
  }
  const pct = (below / sorted.length) * 100
  let rank: PercentileRank = 'below_50'
  if (pct >= 90) rank = 'top_10'
  else if (pct >= 75) rank = 'top_25'
  else if (pct >= 50) rank = 'top_50'
  return { rank, index: Math.round(pct) }
}

export async function computeBenchmarks(userId: string): Promise<BenchmarksPayload> {
  const from30 = new Date(Date.now() - 30 * 86400000)

  // Agrega métricas por usuario, último 30d
  // Revenue + orders desde Order
  const orders = await prisma.order.groupBy({
    by: ['userId'],
    where: {
      userId: { not: null },
      status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
      createdAt: { gte: from30 },
    },
    _sum: { total: true },
    _count: true,
  })

  // Ad spend agregado por user (para ROAS)
  const spend = await prisma.adSpendEntry.groupBy({
    by: ['accountId'],
    where: { date: { gte: from30 } },
    _sum: { spend: true },
  })
  const accounts = await prisma.adAccount.findMany({
    where: { id: { in: spend.map((s) => s.accountId) } },
    select: { id: true, userId: true },
  })
  const accountToUser = new Map(accounts.map((a) => [a.id, a.userId]))
  const spendByUser = new Map<string, number>()
  for (const s of spend) {
    const uid = accountToUser.get(s.accountId)
    if (!uid) continue
    spendByUser.set(uid, (spendByUser.get(uid) ?? 0) + (s._sum.spend ?? 0))
  }

  // Finance para calcular margin
  const expenses = await prisma.financeEntry.groupBy({
    by: ['userId'],
    where: {
      type: 'EGRESO',
      category: { in: ['COSTO_PRODUCTO', 'ENVIO', 'COMISION_PLATAFORMA', 'EMPAQUE', 'OPERATIVO'] },
      date: { gte: from30 },
    },
    _sum: { amount: true },
  })
  const expensesByUser = new Map(
    expenses.map((e) => [e.userId, e._sum.amount ?? 0]),
  )

  // Arrays para percentiles
  const revenueArr: number[] = []
  const ordersArr: number[] = []
  const marginArr: number[] = []
  const roasArr: number[] = []

  // Valores del usuario en query
  let userRevenue: number | null = null
  let userOrders: number | null = null
  let userMargin: number | null = null
  let userRoas: number | null = null

  for (const o of orders) {
    if (!o.userId) continue
    const revenue = o._sum.total ?? 0
    const orderCount = o._count
    const spendU = spendByUser.get(o.userId) ?? 0
    const expenseU = expensesByUser.get(o.userId) ?? 0
    const profit = revenue - spendU - expenseU
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    const roas = spendU > 0 ? revenue / spendU : 0

    if (revenue > 0) revenueArr.push(revenue)
    if (orderCount > 0) ordersArr.push(orderCount)
    if (revenue > 0) marginArr.push(margin)
    if (spendU > 1000) roasArr.push(roas)   // solo usuarios con gasto real

    if (o.userId === userId) {
      userRevenue = revenue
      userOrders = orderCount
      userMargin = margin
      userRoas = spendU > 0 ? roas : null
    }
  }

  function build(userValue: number | null, arr: number[]): MetricBenchmark {
    const sorted = [...arr].sort((a, b) => a - b)
    const { rank, index } = rankOf(userValue, sorted)
    return {
      userValue,
      percentileRank: rank,
      percentileIndex: index,
      communityMedian: percentile(sorted, 0.5),
      communityTop10: percentile(sorted, 0.9),
      communityMean: mean(arr),
      sampleSize: arr.length,
    }
  }

  return {
    revenue30d: build(userRevenue, revenueArr),
    orders30d: build(userOrders, ordersArr),
    marginPct30d: build(userMargin, marginArr),
    roas30d: build(userRoas, roasArr),
  }
}
