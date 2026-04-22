// V35 — Helpers puros para Community Pulse
// ═══════════════════════════════════════════════════════════
// Computa distribución, top movers, lista at-risk a partir de datos
// agregados. Sin Prisma, testeable en aislamiento.

import type { UserHealthSegment } from '@prisma/client'

// ─── Distribución por segment ──────────────────────────────

export interface SegmentDistribution {
  segment: UserHealthSegment
  count: number
  percentage: number
}

export interface SegmentCountsInput {
  segment: UserHealthSegment
  count: number
}

/**
 * Convierte un array de {segment, count} en distribución normalizada
 * con porcentajes (redondeados a 1 decimal, sumando 100).
 *
 * Si total = 0, retorna array vacío (no hay users, no hay distribución).
 */
export function computeSegmentDistribution(
  counts: SegmentCountsInput[],
): SegmentDistribution[] {
  const total = counts.reduce((sum, c) => sum + c.count, 0)
  if (total === 0) return []
  return counts.map(c => ({
    segment: c.segment,
    count: c.count,
    percentage: Math.round((c.count / total) * 1000) / 10,
  }))
}

// ─── Top movers (mayor cambio semana vs semana) ──────────

export interface MoverInput {
  userId: string
  userName: string | null
  revenueDeltaPct: number
  revenue: number
  segment: UserHealthSegment | null
}

export interface Mover {
  userId: string
  userName: string
  revenueDeltaPct: number
  revenue: number
  segment: UserHealthSegment | null
  direction: 'up' | 'down'
}

/**
 * Top N movers (positivos o negativos). Prioriza magnitud del delta.
 * Excluye revenue=0 y revenueDeltaPct irrelevantes (|delta|<5%).
 */
export function computeTopMovers(
  inputs: MoverInput[],
  limit = 10,
): { up: Mover[]; down: Mover[] } {
  const filtered = inputs.filter(
    i => i.revenue > 0 && Math.abs(i.revenueDeltaPct) >= 5,
  )

  const mapToMover = (i: MoverInput, direction: 'up' | 'down'): Mover => ({
    userId: i.userId,
    userName: i.userName ?? 'Sin nombre',
    revenueDeltaPct: i.revenueDeltaPct,
    revenue: i.revenue,
    segment: i.segment,
    direction,
  })

  const up = filtered
    .filter(i => i.revenueDeltaPct > 0)
    .sort((a, b) => b.revenueDeltaPct - a.revenueDeltaPct)
    .slice(0, limit)
    .map(i => mapToMover(i, 'up'))

  const down = filtered
    .filter(i => i.revenueDeltaPct < 0)
    .sort((a, b) => a.revenueDeltaPct - b.revenueDeltaPct)
    .slice(0, limit)
    .map(i => mapToMover(i, 'down'))

  return { up, down }
}

// ─── At-risk para retención ──────────────────────────────

export interface AtRiskInput {
  userId: string
  userName: string | null
  healthScore: number
  previousSegment: UserHealthSegment | null
  segment: UserHealthSegment | null
  revenue: number
  lastRetentionTriggerAt: Date | null
}

export interface AtRiskUser {
  userId: string
  userName: string
  healthScore: number
  segment: UserHealthSegment | null
  revenue: number
  // Prioridad para intervención humana: reason + weight
  reason: string
  weight: number
}

/**
 * Identifica users que necesitan intervención ordenados por prioridad.
 * Prioridad alta: recién cayeron ACTIVE → AT_RISK sin intervención reciente.
 * Prioridad media: AT_RISK con revenue > 0 (tienen negocio pero flaquean).
 * Prioridad baja: CHURNED que aún no se les disparó flow.
 */
export function computeAtRiskList(
  inputs: AtRiskInput[],
  options?: { daysSinceLastTrigger?: number; limit?: number },
): AtRiskUser[] {
  const daysSinceLastTrigger = options?.daysSinceLastTrigger ?? 7
  const limit = options?.limit ?? 20
  const now = Date.now()
  const triggerCooldownMs = daysSinceLastTrigger * 86400_000

  const results: AtRiskUser[] = []

  for (const u of inputs) {
    // Solo AT_RISK o CHURNED
    if (u.segment !== 'AT_RISK' && u.segment !== 'CHURNED') continue

    const recentlyTriggered =
      u.lastRetentionTriggerAt !== null
      && now - u.lastRetentionTriggerAt.getTime() < triggerCooldownMs

    let weight = 0
    let reason = ''

    if (u.segment === 'AT_RISK') {
      if (u.previousSegment === 'ACTIVE') {
        weight = 10 // Recién cayó
        reason = 'Cayó de ACTIVE esta semana'
      } else if (u.revenue > 0) {
        weight = 7 // Tiene negocio pero al borde
        reason = 'En riesgo con revenue activo'
      } else {
        weight = 5
        reason = 'En riesgo sin revenue'
      }
    } else if (u.segment === 'CHURNED') {
      if (!recentlyTriggered) {
        weight = 4 // Hay que intentar
        reason = 'Churned · sin intervención reciente'
      } else {
        weight = 1 // Ya se intentó
        reason = 'Churned · intervención reciente'
      }
    }

    if (recentlyTriggered && u.segment === 'AT_RISK') {
      // Aún AT_RISK después de intervención — baja prioridad
      weight = Math.max(1, weight - 5)
      reason = `${reason} · intervenido hace poco`
    }

    results.push({
      userId: u.userId,
      userName: u.userName ?? 'Sin nombre',
      healthScore: u.healthScore,
      segment: u.segment,
      revenue: u.revenue,
      reason,
      weight,
    })
  }

  return results
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
}

// ─── Cobertura: % de users que generaron insight esta semana ─

export interface CoverageInput {
  activeUsers: number       // users candidatos (ACTIVE/AT_RISK/CHURNED)
  insightsGenerated: number // insights únicos de esta semana
}

export interface CoverageResult {
  coverage: number // 0-100
  missing: number  // users sin insight
  label: 'bajo' | 'medio' | 'alto' | 'excelente'
}

export function computeCoverage(input: CoverageInput): CoverageResult {
  if (input.activeUsers === 0) {
    return { coverage: 0, missing: 0, label: 'bajo' }
  }
  const raw = (input.insightsGenerated / input.activeUsers) * 100
  const coverage = Math.min(100, Math.round(raw))
  const missing = Math.max(0, input.activeUsers - input.insightsGenerated)

  const label =
    coverage >= 90 ? 'excelente' :
    coverage >= 70 ? 'alto' :
    coverage >= 40 ? 'medio' : 'bajo'

  return { coverage, missing, label }
}
