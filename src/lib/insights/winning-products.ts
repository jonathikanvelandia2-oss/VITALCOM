import { prisma } from '@/lib/db/prisma'
import type { Period } from '@/lib/finance/pnl-service'

// ── Productos ganadores de la comunidad ──────────────────
// Agrega ventas REALES de TODOS los dropshippers en un periodo
// para identificar qué SKUs Vitalcom están dejando más dinero.
// Data-driven: no opinión, sólo números.

export type WinningProduct = {
  productId: string
  sku: string
  name: string
  image: string | null
  category: string | null

  // Volumen
  unitsSold: number
  ordersCount: number
  dropshippersCount: number

  // Dinero (agregado comunidad)
  totalRevenue: number
  avgSellingPrice: number

  // Rentabilidad sugerida (basada en precioCosto y precioComunidad)
  suggestedMargin: number   // % margen si vende al precioComunidad
  precioCosto: number | null
  precioComunidad: number

  // Tendencia: órdenes últimos 7d vs promedio del periodo
  trendPct: number          // >0 = subiendo, <0 = bajando
  isTrending: boolean       // trendPct > 20

  // Score final (0-100) para ordenar
  score: number
}

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now)
  if (period === '7d') {
    const from = new Date(now); from.setDate(from.getDate() - 7); return { from, to }
  }
  if (period === '30d') {
    const from = new Date(now); from.setDate(from.getDate() - 30); return { from, to }
  }
  if (period === '90d') {
    const from = new Date(now); from.setDate(from.getDate() - 90); return { from, to }
  }
  if (period === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to }
  }
  if (period === 'year') {
    return { from: new Date(now.getFullYear(), 0, 1), to }
  }
  const from = new Date(now); from.setDate(from.getDate() - 30); return { from, to }
}

/**
 * Top N productos ganadores en la comunidad — datos reales de ventas.
 * Solo cuenta órdenes NO canceladas ni devueltas.
 */
export async function getWinningProducts(
  period: Period = '30d',
  limit = 10,
): Promise<WinningProduct[]> {
  const { from, to } = getPeriodRange(period)

  // Órdenes agregadas en el periodo (de TODA la comunidad)
  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'RETURNED'] },
      createdAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          total: true,
          unitPrice: true,
          product: {
            select: {
              id: true, sku: true, name: true, images: true, category: true,
              precioCosto: true, precioComunidad: true, active: true,
            },
          },
        },
      },
    },
  })

  // Umbral de 7 días para calcular trend
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const totalDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)))

  type Bucket = {
    product: (typeof orders)[number]['items'][number]['product']
    unitsSold: number
    totalRevenue: number
    orderIds: Set<string>
    userIds: Set<string>
    unitsLast7d: number
  }
  const byProduct = new Map<string, Bucket>()

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.product.active) continue
      const id = item.product.id
      const bucket = byProduct.get(id) ?? {
        product: item.product,
        unitsSold: 0,
        totalRevenue: 0,
        orderIds: new Set<string>(),
        userIds: new Set<string>(),
        unitsLast7d: 0,
      }
      bucket.unitsSold += item.quantity
      bucket.totalRevenue += item.total
      bucket.orderIds.add(order.id)
      if (order.userId) bucket.userIds.add(order.userId)
      if (order.createdAt >= sevenDaysAgo) bucket.unitsLast7d += item.quantity
      byProduct.set(id, bucket)
    }
  }

  // Transformar a WinningProduct con score
  const products: WinningProduct[] = Array.from(byProduct.values()).map((b) => {
    const p = b.product
    const avgSellingPrice = b.unitsSold > 0 ? b.totalRevenue / b.unitsSold : 0
    const suggestedMargin = p.precioCosto && p.precioComunidad > 0
      ? ((p.precioComunidad - p.precioCosto) / p.precioComunidad) * 100
      : 0

    // Trend: ventas últimos 7d vs promedio del periodo
    const expectedLast7d = (b.unitsSold / totalDays) * 7
    const trendPct = expectedLast7d > 0
      ? ((b.unitsLast7d - expectedLast7d) / expectedLast7d) * 100
      : 0

    // Score ponderado (0-100):
    // - volumen (40%) — unitsSold normalizado
    // - adopción (30%) — # dropshippers que lo venden
    // - margen (20%) — suggestedMargin
    // - trend (10%) — bonus si está subiendo
    // Normalizaciones relativas al top del lote (se aplican después)
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      image: p.images[0] ?? null,
      category: p.category,
      unitsSold: b.unitsSold,
      ordersCount: b.orderIds.size,
      dropshippersCount: b.userIds.size,
      totalRevenue: Math.round(b.totalRevenue),
      avgSellingPrice: Math.round(avgSellingPrice),
      suggestedMargin: Math.round(suggestedMargin * 10) / 10,
      precioCosto: p.precioCosto,
      precioComunidad: p.precioComunidad,
      trendPct: Math.round(trendPct * 10) / 10,
      isTrending: trendPct > 20,
      score: 0,
    }
  })

  // Calcular score relativo
  const maxUnits = Math.max(1, ...products.map((p) => p.unitsSold))
  const maxDrops = Math.max(1, ...products.map((p) => p.dropshippersCount))

  for (const p of products) {
    const volScore = (p.unitsSold / maxUnits) * 40
    const adopScore = (p.dropshippersCount / maxDrops) * 30
    const marginScore = Math.max(0, Math.min(1, p.suggestedMargin / 60)) * 20
    const trendBonus = Math.max(0, Math.min(1, p.trendPct / 100)) * 10
    p.score = Math.round(volScore + adopScore + marginScore + trendBonus)
  }

  return products
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Stats globales de la comunidad — usado como contexto secundario
 * (p. ej. para VITA y dashboards).
 */
export async function getCommunityStats(period: Period = '30d') {
  const { from, to } = getPeriodRange(period)

  const [orderStats, activeDropshippers] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: { notIn: ['CANCELLED', 'RETURNED'] },
        createdAt: { gte: from, lte: to },
      },
      _count: true,
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'RETURNED'] },
        createdAt: { gte: from, lte: to },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ])

  return {
    period,
    from,
    to,
    totalOrders: orderStats._count,
    totalRevenue: Math.round(orderStats._sum.total ?? 0),
    activeDropshippers: activeDropshippers.length,
    avgTicket: orderStats._count > 0 ? Math.round((orderStats._sum.total ?? 0) / orderStats._count) : 0,
  }
}
