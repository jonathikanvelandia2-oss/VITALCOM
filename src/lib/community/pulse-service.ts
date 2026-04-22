// V35 — Community Pulse service (CEO-level aggregation)
// ═══════════════════════════════════════════════════════════
// Agrega datos de WeeklyInsight + UserHealthScore para dar al CEO
// una vista panorámica: distribución, top movers, at-risk, cobertura.
//
// Reutiliza la data agregada de WeeklyInsight (V34) — no recomputa snapshots
// por usuario; eso es costoso y ya está en la BD.

import { prisma } from '@/lib/db/prisma'
import { captureException } from '@/lib/observability'
import {
  computeSegmentDistribution,
  computeTopMovers,
  computeAtRiskList,
  computeCoverage,
  type SegmentDistribution,
  type Mover,
  type AtRiskUser,
  type CoverageResult,
} from './pulse-helpers'
import { UserHealthSegment, UserRole } from '@prisma/client'

export interface CommunityPulse {
  asOf: Date
  weekStart: Date
  weekEnd: Date
  // Totales
  totalActive: number
  totalInsightsThisWeek: number
  // Distribución
  segmentDistribution: SegmentDistribution[]
  // Movers
  topUp: Mover[]
  topDown: Mover[]
  // Retención
  atRisk: AtRiskUser[]
  // Cobertura
  coverage: CoverageResult
  // Agregado revenue (curioso para CEO: total de la comunidad)
  totalRevenueThisWeek: number
}

function getThisWeekStart(): Date {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayOfWeek = d.getUTCDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - daysFromMonday)
  start.setUTCHours(0, 0, 0, 0)
  return start
}

function getThisWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart)
  end.setUTCDate(weekStart.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)
  return end
}

export async function getCommunityPulse(): Promise<CommunityPulse> {
  const weekStart = getThisWeekStart()
  const weekEnd = getThisWeekEnd(weekStart)

  try {
    // Paraleliza todas las queries agregadas
    const [
      segmentCounts,
      activeCount,
      insightsThisWeek,
      allInsights,
      healthScores,
    ] = await Promise.all([
      // Distribución por segment (solo users activos + role VITALCOMMER)
      prisma.userHealthScore.groupBy({
        by: ['segment'],
        where: {
          user: {
            active: true,
            role: { in: [UserRole.COMMUNITY, UserRole.DROPSHIPPER] },
          },
        },
        _count: { _all: true },
      }),

      // Total de users candidatos (ACTIVE/AT_RISK/CHURNED)
      prisma.userHealthScore.count({
        where: {
          segment: {
            in: [UserHealthSegment.ACTIVE, UserHealthSegment.AT_RISK, UserHealthSegment.CHURNED],
          },
          user: {
            active: true,
            role: { in: [UserRole.COMMUNITY, UserRole.DROPSHIPPER] },
          },
        },
      }),

      // Insights generados esta semana
      prisma.weeklyInsight.count({
        where: { weekStart },
      }),

      // Insights detallados de esta semana para top movers
      prisma.weeklyInsight.findMany({
        where: { weekStart },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { revenueDeltaPct: 'desc' },
      }),

      // Health scores con datos para at-risk
      prisma.userHealthScore.findMany({
        where: {
          segment: {
            in: [UserHealthSegment.AT_RISK, UserHealthSegment.CHURNED],
          },
          user: {
            active: true,
            role: { in: [UserRole.COMMUNITY, UserRole.DROPSHIPPER] },
          },
        },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { computedAt: 'desc' },
        take: 100, // cap — no cargar miles
      }),
    ])

    // Construir input para top movers
    const moverInputs = allInsights.map(i => ({
      userId: i.userId,
      userName: i.user.name,
      revenueDeltaPct: i.revenueDeltaPct,
      revenue: i.revenue,
      segment: i.segment,
    }))

    // Input para at-risk (join con revenue desde el insight más reciente si existe)
    const insightByUser = new Map(allInsights.map(i => [i.userId, i]))
    const atRiskInputs = healthScores.map(h => ({
      userId: h.userId,
      userName: h.user.name,
      healthScore: h.score,
      previousSegment: h.previousSegment,
      segment: h.segment,
      revenue: insightByUser.get(h.userId)?.revenue ?? 0,
      lastRetentionTriggerAt: h.lastRetentionTriggerAt,
    }))

    const { up, down } = computeTopMovers(moverInputs, 5)
    const atRisk = computeAtRiskList(atRiskInputs, { limit: 10 })
    const coverage = computeCoverage({
      activeUsers: activeCount,
      insightsGenerated: insightsThisWeek,
    })

    const totalRevenueThisWeek = allInsights.reduce((sum, i) => sum + i.revenue, 0)

    return {
      asOf: new Date(),
      weekStart,
      weekEnd,
      totalActive: activeCount,
      totalInsightsThisWeek: insightsThisWeek,
      segmentDistribution: computeSegmentDistribution(
        segmentCounts.map(s => ({ segment: s.segment, count: s._count._all })),
      ),
      topUp: up,
      topDown: down,
      atRisk,
      coverage,
      totalRevenueThisWeek,
    }
  } catch (err) {
    captureException(err, { route: 'community.pulse' })
    throw err
  }
}
