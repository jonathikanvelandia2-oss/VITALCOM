import { prisma } from '@/lib/db/prisma'

// ── Sync de acciones críticas IA → Notifications bell ───
// V20 — Convierte recomendaciones con prioridad >=85 en notificaciones
// push para que el dropshipper se entere sin entrar al Command Center.
// Dedup por (userId, type, meta.actionId) en las últimas 24h.

const CRITICAL_THRESHOLD = 85
const DEDUP_WINDOW_HOURS = 24

type CriticalItem = {
  actionId: string    // e.g. "mb_<recid>" o "so_<recid>" o "fin_<slug>"
  title: string
  body: string
  link: string
  priority: number
  source: 'MEDIA_BUYER' | 'STORE_OPTIMIZER' | 'FINANCE_ALERT'
}

export async function syncCriticalToNotifications(userId: string): Promise<{
  created: number
  total: number
}> {
  const critical: CriticalItem[] = []

  // MediaBuyer críticos
  const mbRecs = await prisma.campaignRecommendation.findMany({
    where: { userId, status: 'PENDING', priority: { gte: CRITICAL_THRESHOLD } },
    orderBy: { priority: 'desc' },
    take: 5,
  })
  for (const r of mbRecs) {
    critical.push({
      actionId: `mb_${r.id}`,
      title: `⚡ ${r.title}`,
      body: r.reasoning.slice(0, 160) + (r.reasoning.length > 160 ? '…' : ''),
      link: '/mediabuyer',
      priority: r.priority,
      source: 'MEDIA_BUYER',
    })
  }

  // OptimizadorTienda críticos
  const soRecs = await prisma.storeOptimization.findMany({
    where: { userId, status: 'PENDING', priority: { gte: CRITICAL_THRESHOLD } },
    orderBy: { priority: 'desc' },
    take: 5,
  })
  for (const r of soRecs) {
    critical.push({
      actionId: `so_${r.id}`,
      title: `🌿 ${r.title}`,
      body: r.reasoning.slice(0, 160) + (r.reasoning.length > 160 ? '…' : ''),
      link: '/optimizador',
      priority: r.priority,
      source: 'STORE_OPTIMIZER',
    })
  }

  // Alertas de finanzas inline (mismo algoritmo que Command Center GET)
  const from30 = new Date(Date.now() - 30 * 86400000)
  const [revenueAgg, adSpendAgg, cogsAgg, otherExpenseAgg, pendingOrders] =
    await Promise.all([
      prisma.order.aggregate({
        where: {
          userId,
          status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
          createdAt: { gte: from30 },
        },
        _sum: { total: true },
      }),
      prisma.adSpendEntry.aggregate({
        where: { account: { userId, active: true }, date: { gte: from30 } },
        _sum: { spend: true },
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
    ])

  const totalRevenue = revenueAgg._sum.total ?? 0
  const totalAdSpend = adSpendAgg._sum.spend ?? 0
  const totalCogs = cogsAgg._sum.amount ?? 0
  const totalOther = otherExpenseAgg._sum.amount ?? 0
  const netProfit = totalRevenue - totalAdSpend - totalCogs - totalOther

  if (totalRevenue > 100000 && netProfit < 0) {
    critical.push({
      actionId: 'fin_negative_pnl',
      title: '🚨 Tu P&G está en negativo',
      body: `Facturaste $${Math.round(totalRevenue).toLocaleString('es-CO')} en 30d pero la utilidad neta es -$${Math.abs(Math.round(netProfit)).toLocaleString('es-CO')}. Revisa y actúa ya.`,
      link: '/mi-pyg',
      priority: 100,
      source: 'FINANCE_ALERT',
    })
  }

  if (pendingOrders >= 5) {
    critical.push({
      actionId: 'fin_pending_orders',
      title: `📦 ${pendingOrders} pedidos sin procesar`,
      body: `Tienes pedidos acumulados en estado PENDING/CONFIRMED. Cada día sin procesar aumenta el riesgo de cancelación.`,
      link: '/pedidos',
      priority: 88,
      source: 'FINANCE_ALERT',
    })
  }

  if (critical.length === 0) return { created: 0, total: 0 }

  // Dedup: busca notificaciones AI_ACTION recientes con mismo actionId
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 3600 * 1000)
  const existing = await prisma.notification.findMany({
    where: {
      userId,
      type: 'AI_ACTION',
      createdAt: { gte: cutoff },
    },
    select: { meta: true },
  })
  const seen = new Set<string>()
  for (const n of existing) {
    const m = n.meta as { actionId?: string } | null
    if (m?.actionId) seen.add(m.actionId)
  }

  const toCreate = critical.filter((c) => !seen.has(c.actionId))

  if (toCreate.length > 0) {
    await prisma.notification.createMany({
      data: toCreate.map((c) => ({
        userId,
        type: 'AI_ACTION',
        title: c.title,
        body: c.body,
        link: c.link,
        meta: {
          actionId: c.actionId,
          priority: c.priority,
          source: c.source,
        },
      })),
    })
  }

  return { created: toCreate.length, total: critical.length }
}
