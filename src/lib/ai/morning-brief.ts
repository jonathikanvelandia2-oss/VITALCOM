import { prisma } from '@/lib/db/prisma'
import { getCurrentMonthProgress } from '@/lib/goals/helpers'

// ── Morning Brief generator (V25) ───────────────────────
// Genera el brief diario del dropshipper: top 3 acciones críticas,
// KPI delta vs ayer, estado de meta, frase motivacional.
// Se usa tanto por el bot diario 8AM como por el endpoint on-demand.

const MOTIVATIONAL = [
  'Cada día que aplicas una acción IA, la comunidad crece contigo.',
  'El mejor momento para actuar fue ayer. El segundo mejor es ahora.',
  'No vendes productos, construyes un negocio que vive sin ti.',
  'La disciplina diaria vence al talento irregular.',
  'Vitalcom crece cuando tú creces. Somos proveedor, plataforma y aliado.',
  'Un pedido más hoy es una historia diferente mañana.',
  'Revisa el Command Center 5 min cada mañana — es tu ventaja injusta.',
]

export type BriefAction = {
  actionId: string
  source: 'MEDIA_BUYER' | 'STORE_OPTIMIZER' | 'FINANCE_ALERT' | 'CREATIVE_MAKER'
  title: string
  reasoning: string
  priority: number
  link: string
  actionLabel: string
}

export type MorningBrief = {
  date: string                   // ISO date yyyy-mm-dd
  greeting: string               // "Buenos días, {name}"
  topActions: BriefAction[]      // top 3 críticas del día
  kpiDelta: {
    revenueToday: number
    revenueYesterday: number
    revenueDeltaPct: number | null
    ordersToday: number
    ordersYesterday: number
    adSpendToday: number
    // 7d comparativa
    revenue7d: number
    revenue7dPrev: number
    revenue7dDeltaPct: number | null
  }
  goal: {
    hasGoal: boolean
    progressPct: number
    isOnTrack: boolean
    projectedRevenue: number
    targetRevenue: number
    daysRemaining: number
    message: string
  }
  motivational: string           // Frase del día
  summary: string                // 1-2 líneas generada por las heurísticas
}

function pickMotivational(seed: number): string {
  return MOTIVATIONAL[seed % MOTIVATIONAL.length]
}

function dayBoundaries(offset: number = 0) {
  const now = new Date()
  const start = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset,
  ))
  const end = new Date(start.getTime() + 86400000)
  return { start, end }
}

function pctDelta(now: number, prev: number): number | null {
  if (prev === 0) return now > 0 ? 100 : null
  return Math.round(((now - prev) / prev) * 100)
}

export async function generateMorningBrief(userId: string): Promise<MorningBrief> {
  const today = dayBoundaries(0)
  const yesterday = dayBoundaries(-1)
  const start7d = new Date(Date.now() - 7 * 86400000)
  const start14d = new Date(Date.now() - 14 * 86400000)
  const start7dPrev = new Date(Date.now() - 14 * 86400000)
  const end7dPrev = new Date(Date.now() - 7 * 86400000)

  const [
    user,
    mbCritical,
    soCritical,
    unusedCreatives,
    revToday,
    revYesterday,
    adSpendToday,
    rev7d,
    rev7dPrev,
    pendingOrders,
    goalProgress,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.campaignRecommendation.findMany({
      where: { userId, status: 'PENDING', priority: { gte: 70 } },
      orderBy: { priority: 'desc' },
      take: 3,
    }),
    prisma.storeOptimization.findMany({
      where: { userId, status: 'PENDING', priority: { gte: 70 } },
      orderBy: { priority: 'desc' },
      take: 3,
      include: { product: { select: { name: true } } },
    }),
    prisma.adCreative.findMany({
      where: { userId, isFavorite: true, timesUsed: 0, status: 'READY' },
      orderBy: { score: 'desc' },
      take: 2,
    }),
    prisma.order.aggregate({
      where: {
        userId,
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: today.start, lt: today.end },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        userId,
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: yesterday.start, lt: yesterday.end },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.adSpendEntry.aggregate({
      where: { account: { userId, active: true }, date: { gte: today.start, lt: today.end } },
      _sum: { spend: true },
    }),
    prisma.order.aggregate({
      where: {
        userId,
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: start7d },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        userId,
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: start7dPrev, lt: end7dPrev },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { userId, status: { in: ['PENDING', 'CONFIRMED'] } },
    }),
    getCurrentMonthProgress(userId),
  ])

  // Top 3 acciones — mezcla las fuentes por priority
  type Candidate = BriefAction & { _priority: number }
  const candidates: Candidate[] = []

  for (const r of mbCritical) {
    candidates.push({
      actionId: `mb_${r.id}`,
      source: 'MEDIA_BUYER',
      title: r.title,
      reasoning: r.reasoning.slice(0, 220),
      priority: r.priority,
      link: '/mediabuyer',
      actionLabel: r.actionLabel,
      _priority: r.priority,
    })
  }
  for (const r of soCritical) {
    candidates.push({
      actionId: `so_${r.id}`,
      source: 'STORE_OPTIMIZER',
      title: r.title,
      reasoning: r.reasoning.slice(0, 220),
      priority: r.priority,
      link: '/optimizador',
      actionLabel: r.actionLabel,
      _priority: r.priority,
    })
  }
  for (const c of unusedCreatives) {
    candidates.push({
      actionId: `cm_${c.id}`,
      source: 'CREATIVE_MAKER',
      title: `Lanza el creativo "${c.headline}"`,
      reasoning: `Marcado como favorito pero nunca se lanzó. Score ${c.score}/100 en ángulo ${c.angle}.`,
      priority: 55 + Math.min(25, Math.max(0, c.score - 70)),
      link: '/creativo',
      actionLabel: 'Lanzar creativo',
      _priority: 55 + Math.min(25, Math.max(0, c.score - 70)),
    })
  }

  // Alerta pedidos pendientes
  if (pendingOrders >= 5) {
    candidates.push({
      actionId: 'fin_pending_orders',
      source: 'FINANCE_ALERT',
      title: `${pendingOrders} pedidos sin procesar`,
      reasoning: 'Procesarlos ya reduce cancelaciones y mejora el % de despacho.',
      priority: 88,
      link: '/pedidos',
      actionLabel: 'Procesar pedidos',
      _priority: 88,
    })
  }

  candidates.sort((a, b) => b._priority - a._priority)
  const topActions = candidates.slice(0, 3).map(({ _priority, ...rest }) => rest)

  // KPI deltas
  const revenueToday = revToday._sum.total ?? 0
  const revenueYesterday = revYesterday._sum.total ?? 0
  const ordersToday = revToday._count ?? 0
  const ordersYesterday = revYesterday._count ?? 0
  const revenue7d = rev7d._sum.total ?? 0
  const revenue7dPrev = rev7dPrev._sum.total ?? 0

  // Goal message
  let goalMessage = ''
  if (!goalProgress.goal) {
    goalMessage = 'Aún no has definido tu meta de ' + new Date().toLocaleDateString('es-CO', { month: 'long' }) + '. Define una para priorizar acciones.'
  } else if (goalProgress.progressPct.revenue >= 100) {
    goalMessage = '🎉 ¡Meta alcanzada! Sigue ese ritmo en los días restantes.'
  } else if (goalProgress.isOnTrack) {
    goalMessage = `Vas en ritmo. ${goalProgress.progressPct.revenue}% al día ${Math.round(goalProgress.daysElapsed)} de ${goalProgress.daysInMonth}.`
  } else {
    const need = goalProgress.needsPerDayIncrease ?? 0
    goalMessage = need > 0
      ? `Necesitas +$${Math.round(need).toLocaleString('es-CO')}/día adicional para llegar a meta.`
      : `Ajustemos el ritmo — vas ${goalProgress.progressPct.revenue}% al día ${Math.round(goalProgress.daysElapsed)}.`
  }

  // Summary line
  const deltaPct7d = pctDelta(revenue7d, revenue7dPrev)
  const summaryBits: string[] = []
  if (deltaPct7d !== null && deltaPct7d >= 10) summaryBits.push(`📈 Revenue 7d +${deltaPct7d}% vs semana pasada`)
  else if (deltaPct7d !== null && deltaPct7d <= -10) summaryBits.push(`📉 Revenue 7d ${deltaPct7d}% vs semana pasada`)
  if (topActions.length > 0) summaryBits.push(`${topActions.length} acciones IA esperando`)
  if (pendingOrders >= 3) summaryBits.push(`${pendingOrders} pedidos por procesar`)
  const summary = summaryBits.length > 0 ? summaryBits.join(' · ') : 'Día tranquilo — ideal para revisar métricas y planificar la semana.'

  // Motivational — determinístico por día para que no cambie al refrescar
  const daySeed = Math.floor(Date.now() / 86400000)
  const motivational = pickMotivational(daySeed)

  const firstName = (user?.name ?? 'VITALCOMMER').split(' ')[0]

  return {
    date: today.start.toISOString().slice(0, 10),
    greeting: `Buenos días, ${firstName}`,
    topActions,
    kpiDelta: {
      revenueToday,
      revenueYesterday,
      revenueDeltaPct: pctDelta(revenueToday, revenueYesterday),
      ordersToday,
      ordersYesterday,
      adSpendToday: adSpendToday._sum.spend ?? 0,
      revenue7d,
      revenue7dPrev,
      revenue7dDeltaPct: deltaPct7d,
    },
    goal: {
      hasGoal: goalProgress.goal !== null,
      progressPct: goalProgress.progressPct.revenue,
      isOnTrack: goalProgress.isOnTrack,
      projectedRevenue: goalProgress.projected.revenue,
      targetRevenue: goalProgress.goal?.targetRevenue ?? 0,
      daysRemaining: Math.round(goalProgress.daysRemaining),
      message: goalMessage,
    },
    motivational,
    summary,
  }
}
