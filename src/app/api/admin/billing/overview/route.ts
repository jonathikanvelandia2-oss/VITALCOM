import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/admin/billing/overview ──────────────────────
// Panel de facturación derivado del modelo Order.
// "Factura" = Order visible al admin. No hay modelo Invoice aparte.

export const GET = withErrorHandler(async () => {
  await requireRole('MANAGER_AREA')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [monthOrders, pendingOrders, allTimeAgg, byCountry, recentOrders] = await Promise.all([
    // Órdenes del mes
    prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { total: true, status: true },
    }),
    // Pendientes (no pagadas/despachadas)
    prisma.order.findMany({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
      select: { total: true },
    }),
    // Agregado histórico
    prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: { status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED'] } },
    }),
    // Breakdown por país (último mes)
    prisma.order.groupBy({
      by: ['country'],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { total: true },
      _count: true,
    }),
    // Últimas 20 órdenes
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ])

  const monthCount = monthOrders.length
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const pendingCount = pendingOrders.length
  const pendingValue = pendingOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)

  return apiSuccess({
    kpis: {
      monthCount,
      monthRevenue,
      pendingCount,
      pendingValue,
      allTimeCount: allTimeAgg._count,
      allTimeRevenue: allTimeAgg._sum.total ?? 0,
    },
    byCountry: byCountry.map((c) => ({
      country: c.country,
      count: c._count,
      revenue: c._sum.total ?? 0,
    })),
    recent: recentOrders.map((o) => ({
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      userName: o.user?.name ?? null,
      country: o.country,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    })),
  })
})
