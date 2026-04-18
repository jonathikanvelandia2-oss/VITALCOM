import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { cache, CACHE_TTL, CACHE_TAGS } from '@/lib/cache/memory-cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ── GET /api/orders/stats — KPIs del dropshipper ────────
// Conteos por estado + totales. Staff ve global, dropshipper ve los suyos.
export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  const isStaff = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(session.role)
  const scope = isStaff ? 'global' : session.id

  return apiSuccess(
    await cache.remember(
      `orders:stats:${scope}`,
      async () => {
        const baseWhere = isStaff ? {} : { userId: session.id }

        const [byStatus, revenue, pending, delivered30d] = await Promise.all([
          prisma.order.groupBy({
            by: ['status'],
            where: baseWhere,
            _count: true,
          }),
          prisma.order.aggregate({
            where: { ...baseWhere, status: { notIn: ['CANCELLED', 'RETURNED'] } },
            _sum: { total: true },
            _count: true,
          }),
          prisma.order.count({
            where: { ...baseWhere, status: { in: ['PENDING', 'CONFIRMED'] } },
          }),
          prisma.order.count({
            where: {
              ...baseWhere,
              status: 'DELIVERED',
              updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          }),
        ])

        const byStatusMap = byStatus.reduce<Record<string, number>>((acc, g) => {
          acc[g.status] = g._count
          return acc
        }, {})

        return {
          totalOrders: revenue._count,
          totalRevenue: Math.round(revenue._sum.total ?? 0),
          avgTicket:
            revenue._count > 0 ? Math.round((revenue._sum.total ?? 0) / revenue._count) : 0,
          pendingAction: pending,
          delivered30d,
          byStatus: {
            PENDING: byStatusMap.PENDING ?? 0,
            CONFIRMED: byStatusMap.CONFIRMED ?? 0,
            PROCESSING: byStatusMap.PROCESSING ?? 0,
            DISPATCHED: byStatusMap.DISPATCHED ?? 0,
            DELIVERED: byStatusMap.DELIVERED ?? 0,
            CANCELLED: byStatusMap.CANCELLED ?? 0,
            RETURNED: byStatusMap.RETURNED ?? 0,
          },
        }
      },
      { ttlMs: CACHE_TTL.short, tags: [CACHE_TAGS.orders] },
    ),
  )
})
