import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'

// ── GET /api/admin/marketing/overview ──────────────────
// Métricas de adquisición + engagement.
// Fuentes de datos: User (nuevos), Order (por source), Post/Comment (engagement),
// PricingCalculation + ShopifyStore (intent de conversión).
//
// Query: ?days=30

export const GET = withErrorHandler(async (req: Request) => {
  await requireRole('MANAGER_AREA')

  const url = new URL(req.url)
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30'), 7), 365)
  const since = new Date()
  since.setDate(since.getDate() - days)
  const prevSince = new Date()
  prevSince.setDate(prevSince.getDate() - days * 2)

  const [
    newUsers,
    prevNewUsers,
    newDropshippers,
    totalCommunity,
    verifiedStores,
    totalStores,
    postsCount,
    commentsCount,
    ordersBySource,
    prevOrdersBySource,
    topPosts,
    newUsersByDay,
  ] = await Promise.all([
    // Usuarios nuevos del periodo (todos)
    prisma.user.count({
      where: { createdAt: { gte: since }, active: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: prevSince, lt: since }, active: true },
    }),
    // Nuevos dropshippers (activaron tienda)
    prisma.user.count({
      where: {
        createdAt: { gte: since },
        active: true,
        role: 'DROPSHIPPER',
      },
    }),
    prisma.user.count({
      where: { active: true, role: { in: ['COMMUNITY', 'DROPSHIPPER'] } },
    }),
    // Tiendas Shopify conectadas (conversion a seller activo)
    prisma.shopifyStore.count({
      where: { status: 'active', createdAt: { gte: since } },
    }),
    prisma.shopifyStore.count(),
    // Engagement comunidad
    prisma.post.count({ where: { createdAt: { gte: since } } }),
    prisma.comment.count({ where: { createdAt: { gte: since } } }),
    // Conversión por source
    prisma.order.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: since },
        status: { notIn: ['CANCELLED'] },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: prevSince, lt: since },
        status: { notIn: ['CANCELLED'] },
      },
      _sum: { total: true },
      _count: true,
    }),
    // Top posts por engagement
    prisma.post.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { likes: 'desc' },
      take: 5,
      include: {
        author: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    }),
    // Nuevos usuarios por día (time series)
    prisma.user.findMany({
      where: { createdAt: { gte: since }, active: true },
      select: { createdAt: true, role: true },
    }),
  ])

  // Time series nuevos usuarios
  const dailyMap = new Map<string, { community: number; dropshipper: number; staff: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dailyMap.set(d.toISOString().split('T')[0], { community: 0, dropshipper: 0, staff: 0 })
  }
  for (const u of newUsersByDay) {
    const key = u.createdAt.toISOString().split('T')[0]
    const bucket = dailyMap.get(key)
    if (!bucket) continue
    if (u.role === 'COMMUNITY') bucket.community += 1
    else if (u.role === 'DROPSHIPPER') bucket.dropshipper += 1
    else bucket.staff += 1
  }
  const signupsByDay = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v }))

  // Conversión por source: revenue + orders + ticket promedio
  const sourceMap: Record<string, { current: { revenue: number; count: number }; prev: { revenue: number; count: number } }> = {}
  for (const row of ordersBySource) {
    sourceMap[row.source] ??= { current: { revenue: 0, count: 0 }, prev: { revenue: 0, count: 0 } }
    sourceMap[row.source].current = {
      revenue: row._sum.total ?? 0,
      count: row._count,
    }
  }
  for (const row of prevOrdersBySource) {
    sourceMap[row.source] ??= { current: { revenue: 0, count: 0 }, prev: { revenue: 0, count: 0 } }
    sourceMap[row.source].prev = {
      revenue: row._sum.total ?? 0,
      count: row._count,
    }
  }

  const conversionBySource = Object.entries(sourceMap).map(([source, v]) => {
    const prevRev = v.prev.revenue
    const delta = prevRev > 0 ? ((v.current.revenue - prevRev) / prevRev) * 100 : 0
    return {
      source,
      revenue: v.current.revenue,
      orders: v.current.count,
      avgTicket: v.current.count > 0 ? Math.round(v.current.revenue / v.current.count) : 0,
      deltaVsPrev: Math.round(delta * 10) / 10,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const usersDelta = prevNewUsers > 0 ? ((newUsers - prevNewUsers) / prevNewUsers) * 100 : 0

  return apiSuccess({
    period: { days, since: since.toISOString() },
    kpis: {
      newUsers,
      newUsersDelta: Math.round(usersDelta * 10) / 10,
      newUsersUp: usersDelta >= 0,
      newDropshippers,
      totalCommunity,
      verifiedStores,
      totalStores,
      postsCount,
      commentsCount,
      engagementRatio: totalCommunity > 0
        ? Math.round(((postsCount + commentsCount) / totalCommunity) * 100) / 100
        : 0,
    },
    signupsByDay,
    conversionBySource,
    topPosts: topPosts.map((p) => ({
      id: p.id,
      title: p.title || (p.body.slice(0, 80) + (p.body.length > 80 ? '…' : '')),
      author: p.author.name ?? 'Anónimo',
      likes: p.likes,
      comments: p._count.comments,
      createdAt: p.createdAt,
    })),
  })
})
