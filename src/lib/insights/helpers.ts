// V34 — Weekly Insights helpers puros
// ═══════════════════════════════════════════════════════════
// Computa ventanas semanales, deltas, narrativa y recomendaciones
// SIN tocar BD ni LLM. Testeable en aislamiento.
//
// Convención: semanas lunes→domingo (ISO 8601), en UTC para
// determinismo cross-timezone. La UI ajusta al timezone local.

import type { UserHealthSegment } from '@prisma/client'

// ─── Rangos de tiempo ──────────────────────────────────────

export interface WeekBounds {
  start: Date // Lunes 00:00:00.000 UTC
  end: Date   // Domingo 23:59:59.999 UTC
}

/**
 * Devuelve los límites de la semana que contiene `date`, en UTC.
 * Semana ISO: lunes=inicio. Domingo=fin.
 */
export function getWeekBounds(date: Date): WeekBounds {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  // getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat
  // Queremos que lunes sea día 0 de la semana
  const dayOfWeek = d.getUTCDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - daysFromMonday)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Devuelve los límites de la semana PREVIA a `weekStart`.
 */
export function getPreviousWeekBounds(weekStart: Date): WeekBounds {
  const prevEnd = new Date(weekStart)
  prevEnd.setUTCMilliseconds(-1)
  return getWeekBounds(prevEnd)
}

// ─── Cálculos ─────────────────────────────────────────────

/**
 * Delta porcentual current vs previous.
 * - Si previous=0 y current>0 → 100 (crecimiento desde cero)
 * - Si previous=0 y current=0 → 0 (sin cambio)
 * - Si previous>0 → ((current-previous)/previous)*100
 * Redondea a 1 decimal.
 */
export function deltaPercent(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0
  if (previous === 0) return current > 0 ? 100 : -100
  const raw = ((current - previous) / previous) * 100
  return Math.round(raw * 10) / 10
}

// ─── Narrativa ────────────────────────────────────────────

export interface HeadlineInput {
  revenueDeltaPct: number
  orderCount: number
  orderCountPrev: number
  healthDelta: number
  segment: UserHealthSegment | null
}

/**
 * Genera el titular principal del reporte semanal. Prioriza
 * lo más relevante: cambio drástico de revenue > salto de health
 * > cambio de pedidos > estabilidad.
 */
export function generateHeadline(input: HeadlineInput): string {
  const { revenueDeltaPct, orderCount, orderCountPrev, healthDelta, segment } = input

  // Primera semana real (sin datos previos ni actuales) — caso común de users nuevos
  if (orderCount === 0 && orderCountPrev === 0) {
    return segment === 'NEW'
      ? 'Aún no tienes ventas esta semana. Activa tu primera campaña y el sistema te trackea.'
      : 'Semana sin ventas registradas. Revisemos qué pasó y qué activar.'
  }

  // Cambio drástico positivo
  if (revenueDeltaPct >= 50) {
    return `¡Subiste ${Math.round(revenueDeltaPct)}% vs la semana pasada! Momentum clave, escala lo que funciona.`
  }

  // Cambio drástico negativo
  if (revenueDeltaPct <= -30) {
    return `Bajaste ${Math.round(Math.abs(revenueDeltaPct))}% vs la semana pasada. Revisa ads + stock antes de que empeore.`
  }

  // Salto de health score positivo
  if (healthDelta >= 10) {
    return `Tu salud de negocio subió ${healthDelta} puntos. Estás construyendo consistencia.`
  }

  // Caída de health score
  if (healthDelta <= -10) {
    return `Tu salud de negocio cayó ${Math.abs(healthDelta)} puntos. Hay fricciones a destrabar.`
  }

  // Mejora moderada
  if (revenueDeltaPct > 5) {
    return `Crecimiento de ${revenueDeltaPct.toFixed(1)}% esta semana. Vamos bien.`
  }

  // Baja moderada
  if (revenueDeltaPct < -5) {
    return `Revenue bajó ${Math.abs(revenueDeltaPct).toFixed(1)}%. Ajustes chicos suman.`
  }

  // Estabilidad
  return 'Semana estable. Es el momento de optimizar eficiencia antes de escalar.'
}

// ─── Highlights (bullets de métricas clave) ──────────────

export interface Highlight {
  label: string
  value: string
  trend: 'up' | 'down' | 'flat' | 'none'
}

export interface HighlightsInput {
  revenue: number
  revenueDeltaPct: number
  orderCount: number
  orderCountPrev: number
  netProfit: number
  roas: number
  breakEvenRoas: number
  topProductName: string | null
}

export function generateHighlights(input: HighlightsInput): Highlight[] {
  const out: Highlight[] = []

  // Revenue (siempre se muestra)
  out.push({
    label: 'Revenue',
    value: formatMoney(input.revenue),
    trend: trendFromDelta(input.revenueDeltaPct),
  })

  // Pedidos
  if (input.orderCount > 0 || input.orderCountPrev > 0) {
    const orderDelta = deltaPercent(input.orderCount, input.orderCountPrev)
    out.push({
      label: 'Pedidos',
      value: String(input.orderCount),
      trend: trendFromDelta(orderDelta),
    })
  }

  // Utilidad neta (con icono de signo)
  if (input.orderCount > 0) {
    out.push({
      label: 'Utilidad',
      value: formatMoney(input.netProfit),
      trend: input.netProfit > 0 ? 'up' : input.netProfit < 0 ? 'down' : 'flat',
    })
  }

  // ROAS vs break-even (clave para decidir si escalar o pausar)
  if (input.roas > 0 && input.breakEvenRoas > 0) {
    const healthy = input.roas >= input.breakEvenRoas
    out.push({
      label: 'ROAS',
      value: `${input.roas.toFixed(2)}x (BE ${input.breakEvenRoas.toFixed(2)}x)`,
      trend: healthy ? 'up' : 'down',
    })
  }

  // Top producto
  if (input.topProductName) {
    out.push({
      label: 'Top producto',
      value: input.topProductName,
      trend: 'none',
    })
  }

  return out
}

function trendFromDelta(delta: number): 'up' | 'down' | 'flat' {
  if (delta > 2) return 'up'
  if (delta < -2) return 'down'
  return 'flat'
}

function formatMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return value.toFixed(0)
}

// ─── Benchmarking (percentile en un set anónimo) ───────────

/**
 * Calcula el percentile 0-100 de `value` dentro del array `peers`.
 * Definición estándar: % de peers <= value.
 *
 * - Si `peers` vacío → null (no hay benchmark confiable)
 * - Si value <= min → 0
 * - Si value >= max → 100
 * - Empates: cuentan al valor del usuario
 *
 * Diseñado para responder "¿en qué lugar estás dentro de tu tier?"
 * con semántica intuitiva (100 = top performer, 0 = último).
 */
export function computePercentile(value: number, peers: number[]): number | null {
  if (peers.length === 0) return null
  let belowOrEqual = 0
  for (const p of peers) {
    if (p <= value) belowOrEqual++
  }
  return Math.round((belowOrEqual / peers.length) * 100)
}

/**
 * Promedio aritmético (con guard por vacío). Devuelve 0 para arrays vacíos
 * para simplificar sumas descendentes, pero el caller debe chequear length.
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0
  let sum = 0
  for (const v of values) sum += v
  return sum / values.length
}

/**
 * ¿El tamaño del grupo peer es suficiente para mostrar benchmark?
 * Threshold: >=5 miembros para que el percentile no sea manipulable
 * ni identificable individualmente (privacy).
 */
export const MIN_PEERS_FOR_BENCHMARK = 5

export function hasEnoughPeers(peerCount: number): boolean {
  return peerCount >= MIN_PEERS_FOR_BENCHMARK
}

// ─── Recomendaciones accionables ──────────────────────────

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Recommendation {
  priority: RecommendationPriority
  title: string
  action: string
  href?: string
}

export interface RecommendationsInput {
  revenueDeltaPct: number
  roas: number
  breakEvenRoas: number
  netProfit: number
  orderCount: number
  healthScore: number
  healthDelta: number
  activeAlerts: number
  hasShopify: boolean
}

/**
 * Devuelve las 3 mejores recomendaciones accionables basadas en datos reales.
 * Prioridad: critical > high > medium > low. Máximo 3 bullets.
 */
export function generateRecommendations(input: RecommendationsInput): Recommendation[] {
  const all: Recommendation[] = []

  // Crítico: ROAS debajo del break-even = estás perdiendo dinero por cada venta
  if (input.roas > 0 && input.breakEvenRoas > 0 && input.roas < input.breakEvenRoas * 0.9) {
    all.push({
      priority: 'critical',
      title: 'ROAS bajo el break-even',
      action: 'Pausa las campañas con ROAS < BE y reasigna presupuesto al top performer.',
      href: '/publicidad',
    })
  }

  // Crítico: utilidad negativa
  if (input.orderCount >= 3 && input.netProfit < 0) {
    all.push({
      priority: 'critical',
      title: 'Estás operando en pérdida',
      action: 'Revisa márgenes o sube precios antes de seguir invirtiendo en ads.',
      href: '/finanzas',
    })
  }

  // High: caída brusca de revenue
  if (input.revenueDeltaPct <= -30) {
    all.push({
      priority: 'high',
      title: 'Caída de ventas vs semana pasada',
      action: 'Revisa ads pausadas, stock agotado y reviews negativas de la semana.',
      href: '/admin',
    })
  }

  // High: Health Score cae
  if (input.healthDelta <= -10) {
    all.push({
      priority: 'high',
      title: 'Tu Health Score bajó',
      action: 'Revisa qué factor cayó: actividad, ventas, soporte o producto.',
      href: '/rendimiento',
    })
  }

  // High: alertas activas acumuladas
  if (input.activeAlerts >= 3) {
    all.push({
      priority: 'high',
      title: `${input.activeAlerts} alertas sin atender`,
      action: 'Resuelve las alertas pendientes para desbloquear el algoritmo proactivo.',
      href: '/alertas',
    })
  }

  // Medium: ROAS alto y estable → escalar
  if (
    input.roas > 0
    && input.breakEvenRoas > 0
    && input.roas >= input.breakEvenRoas * 1.5
    && input.revenueDeltaPct >= 0
  ) {
    all.push({
      priority: 'medium',
      title: 'ROAS sano — hay espacio para escalar',
      action: 'Sube presupuesto 20% al ad set ganador. No dupliques, incrementa gradual.',
      href: '/publicidad',
    })
  }

  // Medium: no conectó Shopify
  if (!input.hasShopify) {
    all.push({
      priority: 'medium',
      title: 'Conecta tu tienda Shopify',
      action: 'Sin Shopify, las recomendaciones del OptimizadorTienda no pueden correr.',
      href: '/mi-tienda',
    })
  }

  // Medium: semana sin ventas para user con health decente
  if (input.orderCount === 0 && input.healthScore >= 40) {
    all.push({
      priority: 'medium',
      title: 'Semana sin ventas',
      action: 'Revisa si pausaste ads sin querer o si hay problema técnico en checkout.',
      href: '/admin',
    })
  }

  // Low: buen momento, no hay red flags
  if (all.length === 0) {
    all.push({
      priority: 'low',
      title: 'Todo bajo control',
      action: 'Buen momento para probar un producto nuevo del catálogo o un ángulo creativo.',
      href: '/catalogo',
    })
  }

  // Ordenar por prioridad y tomar top 3
  const order: Record<RecommendationPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  all.sort((a, b) => order[a.priority] - order[b.priority])
  return all.slice(0, 3)
}
