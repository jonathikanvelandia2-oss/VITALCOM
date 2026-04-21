// V32 — Health Score calculator del VITALCOMMER
// ═══════════════════════════════════════════════════════════
// Score 0-100 compuesto por 7 factores. Factores separados por
// concerns para que cada uno sea testeable y sustituible sin
// romper el resto. El scoring NO tiene dependencias de BD —
// solo recibe inputs numéricos/booleanos ya precalculados.
//
// Segmentación por umbrales:
//   NEW     — usuario creado hace < 7 días (skip scoring)
//   ACTIVE  — score >= 60
//   AT_RISK — score 30..59
//   CHURNED — score < 30

import { UserHealthSegment } from '@prisma/client'

// ─── Inputs puros ──────────────────────────────────────────
export interface HealthInputs {
  // Fechas
  userCreatedAt: Date
  lastActivityAt: Date | null // último post/comment/order — lo que haya más reciente

  // Contadores de los últimos 30 días
  ordersLast30d: number
  postsLast30d: number
  commentsLast30d: number
  courseLessonsCompletedLast30d: number

  // Estado
  hasConnectedShopifyStore: boolean
  hasGoalWithProgress: boolean // tiene meta activa con progreso > 0
  totalPoints: number // gamification.points del User

  // "Now" inyectable para tests
  now?: Date
}

export interface HealthBreakdown {
  loginRecency: number
  community: number
  orders: number
  store: number
  learning: number
  goals: number
  points: number
}

export interface HealthResult {
  score: number // 0..100
  segment: UserHealthSegment
  breakdown: HealthBreakdown
  reasons: string[] // lo más relevante a mostrar al usuario
}

// ─── Constantes ────────────────────────────────────────────
const NEW_USER_WINDOW_DAYS = 7
const ACTIVE_THRESHOLD = 60
const AT_RISK_THRESHOLD = 30

// Máximos por factor — deben sumar 100
const MAX = {
  loginRecency: 20,
  community: 15,
  orders: 25,
  store: 10,
  learning: 10,
  goals: 10,
  points: 10,
} as const

// ─── Sub-scorers (puros) ───────────────────────────────────
export function scoreLoginRecency(lastActivityAt: Date | null, now: Date): number {
  if (!lastActivityAt) return 0
  const days = (now.getTime() - lastActivityAt.getTime()) / 86_400_000
  if (days <= 7) return MAX.loginRecency
  if (days <= 14) return Math.round(MAX.loginRecency * 0.6)
  if (days <= 30) return Math.round(MAX.loginRecency * 0.3)
  return 0
}

export function scoreCommunity(posts: number, comments: number): number {
  // Posts valen 5, comments 2, cap en MAX.community
  const raw = posts * 5 + comments * 2
  return Math.min(MAX.community, raw)
}

export function scoreOrders(ordersLast30d: number): number {
  // Sin pedidos → 0. 1-2 → 10. 3-9 → 18. 10+ → full 25.
  if (ordersLast30d === 0) return 0
  if (ordersLast30d < 3) return 10
  if (ordersLast30d < 10) return 18
  return MAX.orders
}

export function scoreStore(hasConnectedStore: boolean): number {
  return hasConnectedStore ? MAX.store : 0
}

export function scoreLearning(courseLessonsLast30d: number): number {
  // Cada lección = 3 pts, cap en MAX.learning
  return Math.min(MAX.learning, courseLessonsLast30d * 3)
}

export function scoreGoals(hasGoalWithProgress: boolean): number {
  return hasGoalWithProgress ? MAX.goals : 0
}

export function scorePoints(totalPoints: number): number {
  // 500+ pts → full, escalado lineal debajo
  return Math.min(MAX.points, Math.round((totalPoints / 500) * MAX.points))
}

// ─── Orquestador puro ──────────────────────────────────────
export function computeHealthScore(inputs: HealthInputs): HealthResult {
  const now = inputs.now ?? new Date()

  // NEW — usuario joven, no se evalúa
  const ageDays = (now.getTime() - inputs.userCreatedAt.getTime()) / 86_400_000
  if (ageDays < NEW_USER_WINDOW_DAYS) {
    return {
      score: 0,
      segment: UserHealthSegment.NEW,
      breakdown: emptyBreakdown(),
      reasons: ['Usuario nuevo — se evaluará al cumplir 7 días.'],
    }
  }

  const breakdown: HealthBreakdown = {
    loginRecency: scoreLoginRecency(inputs.lastActivityAt, now),
    community: scoreCommunity(inputs.postsLast30d, inputs.commentsLast30d),
    orders: scoreOrders(inputs.ordersLast30d),
    store: scoreStore(inputs.hasConnectedShopifyStore),
    learning: scoreLearning(inputs.courseLessonsCompletedLast30d),
    goals: scoreGoals(inputs.hasGoalWithProgress),
    points: scorePoints(inputs.totalPoints),
  }

  const score =
    breakdown.loginRecency
    + breakdown.community
    + breakdown.orders
    + breakdown.store
    + breakdown.learning
    + breakdown.goals
    + breakdown.points

  const segment = classifySegment(score)
  const reasons = buildReasons(breakdown, inputs)

  return { score, segment, breakdown, reasons }
}

export function classifySegment(score: number): UserHealthSegment {
  if (score >= ACTIVE_THRESHOLD) return UserHealthSegment.ACTIVE
  if (score >= AT_RISK_THRESHOLD) return UserHealthSegment.AT_RISK
  return UserHealthSegment.CHURNED
}

function emptyBreakdown(): HealthBreakdown {
  return {
    loginRecency: 0,
    community: 0,
    orders: 0,
    store: 0,
    learning: 0,
    goals: 0,
    points: 0,
  }
}

function buildReasons(b: HealthBreakdown, inputs: HealthInputs): string[] {
  const reasons: string[] = []

  // Lo peor primero (para guiar al usuario)
  if (b.orders === 0) reasons.push('Sin ventas en los últimos 30 días — prioridad #1.')
  if (b.loginRecency === 0) reasons.push('No te vemos hace más de un mes — vuelve al dashboard.')
  if (!inputs.hasConnectedShopifyStore) reasons.push('Conecta tu tienda Shopify para sincronizar pedidos.')
  if (b.community < 5) reasons.push('Participa en la comunidad (posts/comentarios) para ganar puntos.')
  if (!inputs.hasGoalWithProgress) reasons.push('Define una meta en /metas para medir tu avance.')
  if (b.learning < 3) reasons.push('Completa una lección esta semana para mantener el ritmo.')

  // Si todo va bien, algo positivo
  if (reasons.length === 0) {
    reasons.push('Tu cuenta está saludable — sigue así.')
  }

  return reasons.slice(0, 4)
}
