import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/shopify/stores/[id]/metrics — Métricas de la tienda ─
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: storeId } = await ctx!.params

  const store = await prisma.shopifyStore.findUnique({ where: { id: storeId } })
  if (!store) throw new Error('NOT_FOUND')
  if (store.userId !== session.id) throw new Error('FORBIDDEN')

  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get('days') || '30')
  const since = new Date()
  since.setDate(since.getDate() - days)

  // Productos sincronizados con datos de ventas
  const syncs = await prisma.productSync.findMany({
    where: { shopifyStoreId: storeId },
    include: { product: { select: { name: true, sku: true, precioComunidad: true } } },
    orderBy: { soldTotal: 'desc' },
  })

  // Pedidos del usuario en el periodo
  const orders = await prisma.order.findMany({
    where: {
      userId: session.id,
      source: 'DROPSHIPPER',
      createdAt: { gte: since },
    },
    include: {
      items: { include: { product: { select: { precioComunidad: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calcular métricas
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const totalCost = orders.reduce((s, o) =>
    s + o.items.reduce((is, i) => is + i.product.precioComunidad * i.quantity, 0), 0
  )
  const totalShipping = orders.reduce((s, o) => s + o.shipping, 0)
  const totalProfit = totalRevenue - totalCost - totalShipping
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  // Conteo por status
  const ordersByStatus: Record<string, number> = {}
  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
  }

  // Top productos
  const topProducts = syncs.slice(0, 5).map((s) => ({
    name: s.product.name,
    sku: s.product.sku,
    sold: s.soldTotal,
    revenue: s.sellingPrice * s.soldTotal,
    profit: (s.sellingPrice - s.product.precioComunidad) * s.soldTotal,
  }))

  // Ingresos por día (últimos N días)
  const revenueByDay: { date: string; revenue: number; orders: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayOrders = orders.filter((o) => o.createdAt.toISOString().split('T')[0] === dateStr)
    if (dayOrders.length > 0 || i < 7) {
      revenueByDay.push({
        date: dateStr,
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      })
    }
  }

  const deliveredCount = ordersByStatus['DELIVERED'] || 0
  const cancelledCount = ordersByStatus['CANCELLED'] || 0
  const returnedCount = ordersByStatus['RETURNED'] || 0

  return apiSuccess({
    period: { days, since: since.toISOString() },
    summary: {
      totalRevenue,
      totalProfit,
      totalOrders,
      avgOrderValue,
      syncedProducts: syncs.length,
      conversionRate: totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0,
      returnRate: totalOrders > 0 ? Math.round(((cancelledCount + returnedCount) / totalOrders) * 100) : 0,
    },
    topProducts,
    ordersByStatus,
    revenueByDay,
  })
})
