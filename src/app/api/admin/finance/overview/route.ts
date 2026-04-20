import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'

// ── GET /api/admin/finance/overview ────────────────────
// P&L consolidado de la empresa Vitalcom (no del dropshipper individual).
// Agrega desde Order + OrderItem + Product para dar visión CEO.
//
// Query: ?days=30 (default)
// Output:
//   kpis: { revenue, cogs, shipping, grossProfit, margin, orders }
//   revenueByDay: time series 30d
//   revenueByCountry: CO/EC/GT/CL
//   topProducts: productos con más revenue
//   revenueBySource: DIRECT / COMMUNITY / DROPSHIPPER

export const GET = withErrorHandler(async (req: Request) => {
  await requireRole('MANAGER_AREA') // solo liderazgo ve finanzas consolidadas

  const url = new URL(req.url)
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30'), 7), 365)
  const since = new Date()
  since.setDate(since.getDate() - days)
  const prevSince = new Date()
  prevSince.setDate(prevSince.getDate() - days * 2)

  // Todas las órdenes del periodo actual (NO canceladas)
  const [currentOrders, prevOrders, prevRevenue] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, precioCosto: true },
            },
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: prevSince, lt: since },
        status: { notIn: ['CANCELLED'] },
      },
      _sum: { total: true, shipping: true, subtotal: true },
      _count: true,
    }),
    // noop placeholder para mantener shape
    Promise.resolve(null),
  ])
  void prevRevenue

  // ── KPIs agregados ──
  let revenue = 0
  let shipping = 0
  let cogs = 0

  const byCountry: Record<string, { revenue: number; orders: number }> = {}
  const bySource: Record<string, { revenue: number; orders: number }> = {}
  const productRevenue: Record<string, { name: string; sku: string; revenue: number; units: number; cogs: number }> = {}

  // Ventas por día (todos los días del rango, aunque sean 0)
  const dailyMap = new Map<string, { revenue: number; cogs: number; orders: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dailyMap.set(d.toISOString().split('T')[0], { revenue: 0, cogs: 0, orders: 0 })
  }

  for (const order of currentOrders) {
    revenue += order.total
    shipping += order.shipping

    // País
    byCountry[order.country] ??= { revenue: 0, orders: 0 }
    byCountry[order.country].revenue += order.total
    byCountry[order.country].orders += 1

    // Source
    bySource[order.source] ??= { revenue: 0, orders: 0 }
    bySource[order.source].revenue += order.total
    bySource[order.source].orders += 1

    // COGS + top productos
    let orderCogs = 0
    for (const item of order.items) {
      const cost = item.product.precioCosto ?? 0
      const itemCogs = cost * item.quantity
      orderCogs += itemCogs
      cogs += itemCogs

      const pid = item.product.id
      productRevenue[pid] ??= {
        name: item.product.name,
        sku: item.product.sku,
        revenue: 0,
        units: 0,
        cogs: 0,
      }
      productRevenue[pid].revenue += item.total
      productRevenue[pid].units += item.quantity
      productRevenue[pid].cogs += itemCogs
    }

    const dateKey = order.createdAt.toISOString().split('T')[0]
    const bucket = dailyMap.get(dateKey)
    if (bucket) {
      bucket.revenue += order.total
      bucket.cogs += orderCogs
      bucket.orders += 1
    }
  }

  const grossProfit = revenue - cogs - shipping
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

  const prevRev = prevOrders._sum.total ?? 0
  const revenueDelta = prevRev > 0 ? ((revenue - prevRev) / prevRev) * 100 : 0

  const revenueByDay = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date,
    revenue: v.revenue,
    profit: v.revenue - v.cogs, // aproximado sin envío
    orders: v.orders,
  }))

  const revenueByCountry = Object.entries(byCountry)
    .map(([country, v]) => ({ country, ...v, share: revenue > 0 ? (v.revenue / revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  const revenueBySource = Object.entries(bySource)
    .map(([source, v]) => ({ source, ...v, share: revenue > 0 ? (v.revenue / revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  const topProducts = Object.values(productRevenue)
    .map((p) => ({
      ...p,
      profit: p.revenue - p.cogs,
      margin: p.revenue > 0 ? ((p.revenue - p.cogs) / p.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return apiSuccess({
    period: { days, since: since.toISOString() },
    kpis: {
      revenue,
      cogs,
      shipping,
      grossProfit,
      margin: Math.round(margin * 10) / 10,
      orders: currentOrders.length,
      avgTicket: currentOrders.length > 0 ? Math.round(revenue / currentOrders.length) : 0,
      revenueDelta: Math.round(revenueDelta * 10) / 10,
      revenueUp: revenueDelta >= 0,
      ordersDelta: currentOrders.length - (prevOrders._count ?? 0),
    },
    revenueByDay,
    revenueByCountry,
    revenueBySource,
    topProducts,
  })
})
