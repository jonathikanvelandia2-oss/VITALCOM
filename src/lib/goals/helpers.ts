import { prisma } from '@/lib/db/prisma'
import type { UserGoal } from '@prisma/client'

// ── Helpers de Metas Mensuales (V24) ────────────────────
// Calcula progreso actual + proyección end-of-month + status.

export type GoalProgress = {
  goal: UserGoal | null
  current: {
    revenue: number
    orders: number
    marginPct: number | null
  }
  projected: {
    revenue: number
    orders: number
  }
  progressPct: {
    revenue: number
    orders: number | null
  }
  // Contexto temporal del mes
  daysElapsed: number
  daysRemaining: number
  daysInMonth: number
  isOnTrack: boolean
  dailyRateToHit: number | null     // cuánto debe vender por día restante
  needsPerDayIncrease: number | null  // +$ vs ritmo actual
}

function monthBoundaries(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))
  const daysInMonth = (end.getTime() - start.getTime()) / 86400000
  return { start, end, daysInMonth }
}

/** Progreso del mes en curso para el usuario (crea meta vacía si no existe) */
export async function getCurrentMonthProgress(userId: string): Promise<GoalProgress> {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const { start, end, daysInMonth } = monthBoundaries(year, month)

  const [goal, revenueAgg, cogsAgg, adSpendAgg, otherExpenseAgg] = await Promise.all([
    prisma.userGoal.findUnique({
      where: { userId_year_month: { userId, year, month } },
    }),
    prisma.order.aggregate({
      where: {
        userId,
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: start, lt: end },
      },
      _count: true,
      _sum: { total: true },
    }),
    prisma.financeEntry.aggregate({
      where: {
        userId,
        type: 'EGRESO',
        category: 'COSTO_PRODUCTO',
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    prisma.adSpendEntry.aggregate({
      where: {
        account: { userId, active: true },
        date: { gte: start, lt: end },
      },
      _sum: { spend: true },
    }),
    prisma.financeEntry.aggregate({
      where: {
        userId,
        type: 'EGRESO',
        category: { in: ['ENVIO', 'COMISION_PLATAFORMA', 'EMPAQUE', 'OPERATIVO'] },
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
  ])

  const msElapsed = Math.max(0, now.getTime() - start.getTime())
  const daysElapsed = Math.max(0.5, msElapsed / 86400000)   // minimum 0.5 para que no divida por cero
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed)

  const revenue = revenueAgg._sum.total ?? 0
  const orders = revenueAgg._count ?? 0
  const cogs = cogsAgg._sum.amount ?? 0
  const adSpend = adSpendAgg._sum.spend ?? 0
  const otherExpense = otherExpenseAgg._sum.amount ?? 0
  const netProfit = revenue - cogs - adSpend - otherExpense
  const marginPct = revenue > 0 ? (netProfit / revenue) * 100 : null

  // Proyección lineal: ritmo actual × días del mes
  const dailyRevenue = revenue / daysElapsed
  const dailyOrders = orders / daysElapsed
  const projectedRevenue = dailyRevenue * daysInMonth
  const projectedOrders = Math.round(dailyOrders * daysInMonth)

  const targetRevenue = goal?.targetRevenue ?? 0
  const targetOrders = goal?.targetOrders ?? null

  const progressRevenuePct = targetRevenue > 0 ? Math.round((revenue / targetRevenue) * 100) : 0
  const progressOrdersPct = targetOrders && targetOrders > 0
    ? Math.round((orders / targetOrders) * 100)
    : null

  // ¿Está en ritmo? Progreso actual vs % esperado del mes
  const expectedPctAtThisPoint = (daysElapsed / daysInMonth) * 100
  const isOnTrack =
    targetRevenue > 0 ? progressRevenuePct >= expectedPctAtThisPoint * 0.9 : true

  // ¿Cuánto debe vender por día restante para llegar a meta?
  const remaining = Math.max(0, targetRevenue - revenue)
  const dailyRateToHit = daysRemaining > 0 && targetRevenue > 0 ? remaining / daysRemaining : null
  const needsPerDayIncrease =
    dailyRateToHit !== null && dailyRevenue > 0 ? dailyRateToHit - dailyRevenue : null

  return {
    goal,
    current: { revenue, orders, marginPct },
    projected: { revenue: projectedRevenue, orders: projectedOrders },
    progressPct: { revenue: progressRevenuePct, orders: progressOrdersPct },
    daysElapsed: Math.round(daysElapsed * 10) / 10,
    daysRemaining: Math.round(daysRemaining * 10) / 10,
    daysInMonth: Math.round(daysInMonth),
    isOnTrack,
    dailyRateToHit: dailyRateToHit !== null ? Math.round(dailyRateToHit) : null,
    needsPerDayIncrease:
      needsPerDayIncrease !== null ? Math.round(needsPerDayIncrease) : null,
  }
}

/** Upsert de meta para mes en curso */
export async function setGoal(
  userId: string,
  data: { targetRevenue: number; targetOrders?: number; targetMargin?: number; stretchRevenue?: number },
) {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  return prisma.userGoal.upsert({
    where: { userId_year_month: { userId, year, month } },
    create: {
      userId,
      year,
      month,
      targetRevenue: data.targetRevenue,
      targetOrders: data.targetOrders,
      targetMargin: data.targetMargin,
      stretchRevenue: data.stretchRevenue,
    },
    update: {
      targetRevenue: data.targetRevenue,
      targetOrders: data.targetOrders,
      targetMargin: data.targetMargin,
      stretchRevenue: data.stretchRevenue,
    },
  })
}
