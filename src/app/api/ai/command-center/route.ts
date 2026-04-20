import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/ai/command-center ───────────────────────────
// Feed unificado de acciones IA — agrega recomendaciones de:
//  - MediaBuyer (CampaignRecommendation)
//  - OptimizadorTienda (StoreOptimization)
//  - CreativoMaker (AdCreative favoritos no usados)
// + KPIs globales: P&G 30d, ROAS, salud financiera, inventario.

type UnifiedAction = {
  id: string
  source: 'MEDIA_BUYER' | 'STORE_OPTIMIZER' | 'CREATIVE_MAKER' | 'FINANCE_ALERT'
  sourceLabel: string
  sourceIcon: string
  link: string
  type: string
  title: string
  reasoning: string
  actionLabel: string
  priority: number       // 0-100
  confidence: number     // 0-1
  createdAt: string
  productName?: string | null
  productImage?: string | null
  metrics?: Record<string, number | null>
}

export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  const userId = session.id

  // Expira vencidas en paralelo
  await Promise.all([
    prisma.campaignRecommendation.updateMany({
      where: { userId, status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    }),
    prisma.storeOptimization.updateMany({
      where: { userId, status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    }),
  ])

  const from30 = new Date(Date.now() - 30 * 86400000)

  const [
    mediaBuyerRecs,
    storeOpts,
    unusedCreatives,
    revenueAgg,
    adSpendAgg,
    cogsAgg,
    otherExpenseAgg,
    pendingOrders,
    lowStockCount,
    productsCount,
    shopifyCount,
  ] = await Promise.all([
    prisma.campaignRecommendation.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        campaign: { select: { name: true } },
        account: { select: { platform: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.storeOptimization.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        product: { select: { name: true, images: true, sku: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    }),
    // Creativos favoritos nunca lanzados: oportunidad latente
    prisma.adCreative.findMany({
      where: { userId, isFavorite: true, timesUsed: 0, status: 'READY' },
      include: { product: { select: { name: true, images: true } } },
      orderBy: { score: 'desc' },
      take: 5,
    }),
    prisma.order.aggregate({
      where: {
        userId,
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: from30 },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.adSpendEntry.aggregate({
      where: {
        account: { userId, active: true },
        date: { gte: from30 },
      },
      _sum: { spend: true, conversions: true },
    }),
    prisma.financeEntry.aggregate({
      where: {
        userId,
        type: 'EGRESO',
        category: 'COSTO_PRODUCTO',
        date: { gte: from30 },
      },
      _sum: { amount: true },
    }),
    prisma.financeEntry.aggregate({
      where: {
        userId,
        type: 'EGRESO',
        category: { in: ['ENVIO', 'COMISION_PLATAFORMA', 'EMPAQUE', 'OPERATIVO'] },
        date: { gte: from30 },
      },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: { userId, status: { in: ['PENDING', 'CONFIRMED'] } },
    }),
    prisma.stock.count({
      where: { country: 'CO', quantity: { lt: 10 } },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.shopifyStore.count({ where: { userId, status: 'connected' } }),
  ])

  const actions: UnifiedAction[] = []

  // MediaBuyer → unified
  for (const r of mediaBuyerRecs) {
    actions.push({
      id: `mb_${r.id}`,
      source: 'MEDIA_BUYER',
      sourceLabel: 'MediaBuyer IA',
      sourceIcon: 'Brain',
      link: '/mediabuyer',
      type: r.type,
      title: r.title,
      reasoning: r.reasoning,
      actionLabel: r.actionLabel,
      priority: r.priority,
      confidence: r.confidence ?? 0.7,
      createdAt: r.createdAt.toISOString(),
      productName: r.campaign?.name ?? null,
      metrics: {
        roas: r.roas,
        spend: r.spend,
        revenue: r.revenue,
      },
    })
  }

  // OptimizadorTienda → unified
  for (const r of storeOpts) {
    actions.push({
      id: `so_${r.id}`,
      source: 'STORE_OPTIMIZER',
      sourceLabel: 'OptimizadorTienda',
      sourceIcon: 'Store',
      link: '/optimizador',
      type: r.type,
      title: r.title,
      reasoning: r.reasoning,
      actionLabel: r.actionLabel,
      priority: r.priority,
      confidence: r.confidence ?? 0.7,
      createdAt: r.createdAt.toISOString(),
      productName: r.product?.name ?? null,
      productImage: r.product?.images?.[0] ?? null,
      metrics: {
        salesLast30: r.salesLast30,
        marginPct: r.marginPct,
        stockLevel: r.stockLevel,
      },
    })
  }

  // CreativoMaker → creativos favoritos sin usar = oportunidad
  for (const c of unusedCreatives) {
    actions.push({
      id: `cm_${c.id}`,
      source: 'CREATIVE_MAKER',
      sourceLabel: 'CreativoMaker',
      sourceIcon: 'Wand2',
      link: `/creativo`,
      type: `CREATIVE_${c.angle}`,
      title: `Lanza el creativo "${c.headline}"`,
      reasoning: `Tienes marcado como favorito pero nunca se lanzó. Score ${c.score}/100 en ángulo ${c.angle}. ${c.reasoning ?? ''}`.trim(),
      actionLabel: 'Lanzar creativo',
      priority: 55 + Math.min(25, Math.max(0, c.score - 70)),
      confidence: c.score / 100,
      createdAt: c.createdAt.toISOString(),
      productName: c.product?.name ?? null,
      productImage: c.imageUrl ?? c.product?.images?.[0] ?? null,
    })
  }

  // Alertas financieras generadas inline
  const totalRevenue = revenueAgg._sum.total ?? 0
  const totalAdSpend = adSpendAgg._sum.spend ?? 0
  const totalCogs = cogsAgg._sum.amount ?? 0
  const totalOther = otherExpenseAgg._sum.amount ?? 0
  const netProfit = totalRevenue - totalAdSpend - totalCogs - totalOther
  const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0

  // Alerta: P&G en rojo
  if (totalRevenue > 100000 && netProfit < 0) {
    actions.push({
      id: 'fin_negative_pnl',
      source: 'FINANCE_ALERT',
      sourceLabel: 'Finanzas',
      sourceIcon: 'AlertTriangle',
      link: '/mi-pyg',
      type: 'NEGATIVE_PNL',
      title: 'Tu P&G está en negativo — acción urgente',
      reasoning: `En los últimos 30 días facturaste $${Math.round(totalRevenue).toLocaleString('es-CO')} pero gastaste más de lo ganado. Utilidad neta: -$${Math.abs(Math.round(netProfit)).toLocaleString('es-CO')}. Revisa el detalle en P&G y pausa campañas con ROAS bajo desde MediaBuyer.`,
      actionLabel: 'Ver P&G',
      priority: 100,
      confidence: 1,
      createdAt: new Date().toISOString(),
    })
  }

  // Alerta: Pedidos acumulados sin procesar
  if (pendingOrders >= 5) {
    actions.push({
      id: 'fin_pending_orders',
      source: 'FINANCE_ALERT',
      sourceLabel: 'Operación',
      sourceIcon: 'Package',
      link: '/pedidos',
      type: 'PENDING_ORDERS',
      title: `${pendingOrders} pedidos sin procesar`,
      reasoning: `Tienes ${pendingOrders} pedidos en estado PENDING o CONFIRMED esperando ser despachados. Cada día sin procesar aumenta el riesgo de cancelación y RNR. Procesa ya desde el módulo de Pedidos.`,
      actionLabel: 'Procesar pedidos',
      priority: 88,
      confidence: 1,
      createdAt: new Date().toISOString(),
    })
  }

  // Alerta: Sin tienda Shopify conectada pero hay ventas
  if (shopifyCount === 0 && totalRevenue > 0) {
    actions.push({
      id: 'fin_no_shopify',
      source: 'FINANCE_ALERT',
      sourceLabel: 'Integración',
      sourceIcon: 'Store',
      link: '/mi-tienda',
      type: 'CONNECT_SHOPIFY',
      title: 'Conecta tu Shopify para sincronizar ventas',
      reasoning: `Facturaste $${Math.round(totalRevenue).toLocaleString('es-CO')} en 30 días pero tu tienda Shopify no está conectada. Conectarla permite auto-sync de productos, P&G automático y el OptimizadorTienda te da recomendaciones más precisas.`,
      actionLabel: 'Conectar tienda',
      priority: 70,
      confidence: 1,
      createdAt: new Date().toISOString(),
    })
  }

  // Ordenar por prioridad
  actions.sort((a, b) => b.priority - a.priority || b.confidence - a.confidence)

  // Agrupar por severidad para la UI
  const critical = actions.filter((a) => a.priority >= 85)
  const high = actions.filter((a) => a.priority >= 60 && a.priority < 85)
  const medium = actions.filter((a) => a.priority >= 40 && a.priority < 60)
  const low = actions.filter((a) => a.priority < 40)

  // Estadísticas por fuente
  const bySource = {
    MEDIA_BUYER: actions.filter((a) => a.source === 'MEDIA_BUYER').length,
    STORE_OPTIMIZER: actions.filter((a) => a.source === 'STORE_OPTIMIZER').length,
    CREATIVE_MAKER: actions.filter((a) => a.source === 'CREATIVE_MAKER').length,
    FINANCE_ALERT: actions.filter((a) => a.source === 'FINANCE_ALERT').length,
  }

  return apiSuccess({
    actions: actions.slice(0, 40),
    groups: {
      critical: critical.slice(0, 10),
      high: high.slice(0, 10),
      medium: medium.slice(0, 10),
      low: low.slice(0, 10),
    },
    bySource,
    totalPending: actions.length,
    kpis: {
      revenue30d: totalRevenue,
      adSpend30d: totalAdSpend,
      netProfit30d: netProfit,
      netMarginPct,
      roas,
      orders30d: revenueAgg._count ?? 0,
      conversions30d: adSpendAgg._sum.conversions ?? 0,
      pendingOrders,
      lowStockCount,
      productsAvailable: productsCount,
      shopifyConnected: shopifyCount,
    },
  })
})
