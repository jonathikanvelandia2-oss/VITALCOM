// V39 — Helpers puros del inbox operativo.
// SLA tracking, auto-filtro por área, stats agregadas, priorización.
// Todo puro, sin Prisma, trivialmente testeable.

export type PriorityLite = 'low' | 'normal' | 'high' | 'urgent'
export type AreaLite = 'DIRECCION' | 'MARKETING' | 'COMERCIAL' | 'ADMINISTRATIVA' | 'LOGISTICA' | 'CONTABILIDAD'

export type ThreadLite = {
  id: string
  area: AreaLite
  priority: PriorityLite
  resolved: boolean
  assignedToId: string | null
  firstResponseAt: Date | string | null
  resolvedAt: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export type UserLite = {
  id: string
  role: string
  area: AreaLite | null
}

// ── SLA por prioridad (horas) ──────────────────────────
// Tiempos de primera respuesta aceptables. Superado el límite, el hilo
// queda "at-risk"; si se duplica, "breached". Sirven como sugerencia —
// el staff sigue viendo el hilo aunque esté breached.

export const SLA_HOURS_BY_PRIORITY: Record<PriorityLite, number> = {
  urgent: 1, // 1h · asuntos críticos
  high: 4, // 4h · pedidos con tiempo
  normal: 24, // 24h · operación regular
  low: 72, // 3 días · consultas informativas
}

export type SlaStatus = 'met' | 'on_track' | 'at_risk' | 'breached'

export function computeSlaStatus(
  priority: PriorityLite,
  createdAt: Date | string,
  firstResponseAt: Date | string | null,
  now: Date = new Date(),
): SlaStatus {
  // Ya se respondió — SLA met
  if (firstResponseAt) return 'met'

  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const slaMs = SLA_HOURS_BY_PRIORITY[priority] * 60 * 60 * 1000
  const elapsed = now.getTime() - created.getTime()

  if (elapsed >= slaMs) return 'breached'
  if (elapsed >= slaMs * 0.75) return 'at_risk'
  return 'on_track'
}

export function hoursUntilSlaBreach(
  priority: PriorityLite,
  createdAt: Date | string,
  now: Date = new Date(),
): number {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const deadline = created.getTime() + SLA_HOURS_BY_PRIORITY[priority] * 60 * 60 * 1000
  return (deadline - now.getTime()) / (60 * 60 * 1000)
}

// ── Priorización ──────────────────────────────────────
// Score = priority weight × (1 + antigüedad_relativa). Cuanto más viejo y
// más prioritario, mayor el score. Útil para ordenar listas "operativas".

const PRIORITY_WEIGHT: Record<PriorityLite, number> = {
  urgent: 100,
  high: 40,
  normal: 10,
  low: 2,
}

export function computeUrgencyScore(thread: ThreadLite, now: Date = new Date()): number {
  if (thread.resolved) return 0
  const created = typeof thread.createdAt === 'string' ? new Date(thread.createdAt) : thread.createdAt
  const ageHours = (now.getTime() - created.getTime()) / (60 * 60 * 1000)
  const weight = PRIORITY_WEIGHT[thread.priority] ?? 10
  return weight * (1 + ageHours / 24)
}

export function sortByUrgency<T extends ThreadLite>(threads: T[], now: Date = new Date()): T[] {
  return [...threads].sort((a, b) => computeUrgencyScore(b, now) - computeUrgencyScore(a, now))
}

// ── Filtro automático por usuario ─────────────────────
// SUPERADMIN/ADMIN ven todo por defecto (sin filtro de área).
// MANAGER_AREA/EMPLOYEE ven por defecto SU área; pueden cambiar el filtro.
// COMMUNITY/DROPSHIPPER no llegan acá (requiereRole).

export function getDefaultAreaFilterFor(user: UserLite): AreaLite | null {
  if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') return null
  if (user.area) return user.area
  return null
}

export function canAccessThread(user: UserLite, thread: ThreadLite): boolean {
  if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') return true
  if (user.role === 'MANAGER_AREA' || user.role === 'EMPLOYEE') {
    // Ven su área, o los hilos que tengan asignados directamente
    return user.area === thread.area || thread.assignedToId === user.id
  }
  return false
}

// ── Stats operativas ──────────────────────────────────
// Toma un array de hilos y devuelve KPIs útiles para dashboard de staff.

export type InboxStats = {
  total: number
  open: number
  resolved: number
  byPriority: Record<PriorityLite, number>
  byArea: Record<string, number>
  byAssignment: {
    assigned: number
    unassigned: number
  }
  sla: {
    met: number
    onTrack: number
    atRisk: number
    breached: number
    complianceRate: number // 0-100, excluyendo breached
  }
  avgResolutionHours: number | null
  oldestOpenHours: number | null
}

export function computeInboxStats(threads: ThreadLite[], now: Date = new Date()): InboxStats {
  const byPriority: Record<PriorityLite, number> = { low: 0, normal: 0, high: 0, urgent: 0 }
  const byArea: Record<string, number> = {}
  let open = 0
  let resolved = 0
  let assigned = 0
  let unassigned = 0
  const slaCounts = { met: 0, on_track: 0, at_risk: 0, breached: 0 }

  const resolutionHours: number[] = []
  let oldestOpenMs = 0

  for (const t of threads) {
    byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1
    byArea[t.area] = (byArea[t.area] ?? 0) + 1

    if (t.resolved) {
      resolved++
      if (t.resolvedAt) {
        const created = typeof t.createdAt === 'string' ? new Date(t.createdAt) : t.createdAt
        const resolvedDate = typeof t.resolvedAt === 'string' ? new Date(t.resolvedAt) : t.resolvedAt
        const hours = (resolvedDate.getTime() - created.getTime()) / (60 * 60 * 1000)
        if (hours >= 0) resolutionHours.push(hours)
      }
    } else {
      open++
      const created = typeof t.createdAt === 'string' ? new Date(t.createdAt) : t.createdAt
      const ageMs = now.getTime() - created.getTime()
      if (ageMs > oldestOpenMs) oldestOpenMs = ageMs

      if (t.assignedToId) assigned++
      else unassigned++

      const sla = computeSlaStatus(t.priority, t.createdAt, t.firstResponseAt, now)
      slaCounts[sla]++
    }
  }

  const avgResolutionHours =
    resolutionHours.length > 0
      ? Math.round((resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length) * 10) / 10
      : null

  const oldestOpenHours = oldestOpenMs > 0 ? Math.round((oldestOpenMs / (60 * 60 * 1000)) * 10) / 10 : null

  // Compliance = (on_track + at_risk + met) / (open con SLA) — breached no cumple
  const slaTotal = slaCounts.on_track + slaCounts.at_risk + slaCounts.breached
  const compliant = slaCounts.on_track + slaCounts.at_risk
  const complianceRate = slaTotal > 0 ? Math.round((compliant / slaTotal) * 100) : 100

  return {
    total: threads.length,
    open,
    resolved,
    byPriority,
    byArea,
    byAssignment: { assigned, unassigned },
    sla: {
      met: slaCounts.met,
      onTrack: slaCounts.on_track,
      atRisk: slaCounts.at_risk,
      breached: slaCounts.breached,
      complianceRate,
    },
    avgResolutionHours,
    oldestOpenHours,
  }
}

// ── Formatting ───────────────────────────────────────
export function formatSlaStatus(status: SlaStatus): { label: string; tone: 'success' | 'info' | 'warning' | 'error' } {
  switch (status) {
    case 'met':
      return { label: 'SLA cumplido', tone: 'success' }
    case 'on_track':
      return { label: 'En tiempo', tone: 'info' }
    case 'at_risk':
      return { label: 'En riesgo', tone: 'warning' }
    case 'breached':
      return { label: 'Vencido', tone: 'error' }
  }
}

export function formatPriorityForUi(p: PriorityLite): { label: string; weight: number } {
  return {
    label: { low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente' }[p],
    weight: PRIORITY_WEIGHT[p],
  }
}
