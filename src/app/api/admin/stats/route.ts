import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole, isAdmin } from '@/lib/auth/session'

// ── GET /api/admin/stats — KPIs del dashboard CEO ───────
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireRole('EMPLOYEE')

  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get('days') || '7')
  const since = new Date()
  since.setDate(since.getDate() - days)
  const prevSince = new Date()
  prevSince.setDate(prevSince.getDate() - days * 2)

  // Ejecutar queries en paralelo
  const [
    totalProducts,
    activeProducts,
    totalUsers,
    communityUsers,
    totalOrders,
    periodOrders,
    prevPeriodOrders,
    recentOrders,
    lowStock,
    totalPosts,
    periodSales,
    prevSales,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { active: true, role: { in: ['COMMUNITY', 'DROPSHIPPER'] } } }),
    prisma.order.count(),
    prisma.order.findMany({ where: { createdAt: { gte: since } } }),
    prisma.order.findMany({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.order.findMany({
      where: {},
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.stock.findMany({
      where: { quantity: { lte: 15 } },
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { quantity: 'asc' },
      take: 5,
    }),
    prisma.post.count({ where: { createdAt: { gte: since } } }),
    // Ventas del periodo
    prisma.order.aggregate({
      where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: prevSince, lt: since }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    }),
  ])

  const currentSalesTotal = periodSales._sum.total ?? 0
  const prevSalesTotal = prevSales._sum.total ?? 0
  const salesDelta = prevSalesTotal > 0
    ? Math.round(((currentSalesTotal - prevSalesTotal) / prevSalesTotal) * 100)
    : 0

  const pendingOrders = periodOrders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length
  const prevPending = prevPeriodOrders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length

  // Ventas por día
  const salesByDay: { date: string; total: number; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayOrders = periodOrders.filter(
      (o) => o.createdAt.toISOString().split('T')[0] === dateStr && o.status !== 'CANCELLED'
    )
    salesByDay.push({
      date: dateStr,
      total: dayOrders.reduce((s, o) => s + o.total, 0),
      count: dayOrders.length,
    })
  }

  // Pedidos por estado
  const ordersByStatus: Record<string, number> = {}
  for (const o of periodOrders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
  }

  return apiSuccess({
    kpis: {
      salesToday: currentSalesTotal,
      salesDelta: `${salesDelta >= 0 ? '+' : ''}${salesDelta}%`,
      salesUp: salesDelta >= 0,
      pendingOrders,
      pendingDelta: pendingOrders - prevPending,
      activeProducts,
      totalProducts,
      communityUsers,
      totalUsers,
      totalOrders,
      totalPosts,
    },
    salesByDay,
    ordersByStatus,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      number: o.number,
      customer: o.customerName,
      source: o.source,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
    })),
    lowStock: lowStock.map((s) => ({
      id: s.id,
      sku: s.product.sku,
      name: s.product.name,
      country: s.country,
      quantity: s.quantity,
    })),
  })
})
