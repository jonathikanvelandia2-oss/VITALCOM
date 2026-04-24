// V39 — Tests helpers de inbox operativo.
// Validan SLA, priorización, filtros por rol, stats agregadas.

import { describe, it, expect } from 'vitest'
import {
  computeSlaStatus,
  hoursUntilSlaBreach,
  computeUrgencyScore,
  sortByUrgency,
  getDefaultAreaFilterFor,
  canAccessThread,
  computeInboxStats,
  formatSlaStatus,
  formatPriorityForUi,
  SLA_HOURS_BY_PRIORITY,
  type ThreadLite,
  type PriorityLite,
} from '../helpers'

function makeThread(overrides: Partial<ThreadLite> = {}): ThreadLite {
  const base: ThreadLite = {
    id: 't1',
    area: 'COMERCIAL',
    priority: 'normal',
    resolved: false,
    assignedToId: null,
    firstResponseAt: null,
    resolvedAt: null,
    createdAt: new Date('2026-04-23T10:00:00Z'),
    updatedAt: new Date('2026-04-23T10:00:00Z'),
  }
  return { ...base, ...overrides }
}

// ── SLA status ────────────────────────────────────────
describe('computeSlaStatus', () => {
  const now = new Date('2026-04-23T12:00:00Z')

  it('met cuando ya hay firstResponseAt', () => {
    const t = makeThread({
      createdAt: new Date('2026-04-20T10:00:00Z'),
      firstResponseAt: new Date('2026-04-20T11:00:00Z'),
    })
    expect(computeSlaStatus(t.priority, t.createdAt, t.firstResponseAt, now)).toBe('met')
  })

  it('on_track cuando es reciente y dentro del SLA', () => {
    const created = new Date(now.getTime() - 30 * 60 * 1000) // 30 min antes
    expect(computeSlaStatus('normal', created, null, now)).toBe('on_track')
  })

  it('at_risk al superar 75% del SLA sin respuesta', () => {
    // normal = 24h. 75% = 18h
    const created = new Date(now.getTime() - 20 * 60 * 60 * 1000) // 20h antes
    expect(computeSlaStatus('normal', created, null, now)).toBe('at_risk')
  })

  it('breached al superar 100% del SLA sin respuesta', () => {
    // urgent = 1h. 2h antes = breached
    const created = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    expect(computeSlaStatus('urgent', created, null, now)).toBe('breached')
  })

  it('low priority tiene 72h de SLA', () => {
    expect(SLA_HOURS_BY_PRIORITY.low).toBe(72)
  })
})

describe('hoursUntilSlaBreach', () => {
  const now = new Date('2026-04-23T12:00:00Z')

  it('positivo si aún no vence', () => {
    const created = new Date(now.getTime() - 30 * 60 * 1000) // 30 min
    const h = hoursUntilSlaBreach('urgent', created, now) // urgent = 1h
    expect(h).toBeGreaterThan(0)
    expect(h).toBeLessThan(1)
  })

  it('negativo si ya venció', () => {
    const created = new Date(now.getTime() - 5 * 60 * 60 * 1000) // 5h
    expect(hoursUntilSlaBreach('urgent', created, now)).toBeLessThan(0)
  })
})

// ── Urgency score ─────────────────────────────────────
describe('computeUrgencyScore', () => {
  const now = new Date('2026-04-23T12:00:00Z')

  it('resolved tiene score 0', () => {
    const t = makeThread({ resolved: true, priority: 'urgent' })
    expect(computeUrgencyScore(t, now)).toBe(0)
  })

  it('urgent pesa más que normal con misma edad', () => {
    const createdAt = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const urgent = makeThread({ priority: 'urgent', createdAt })
    const normal = makeThread({ priority: 'normal', createdAt })
    expect(computeUrgencyScore(urgent, now)).toBeGreaterThan(computeUrgencyScore(normal, now))
  })

  it('hilo más viejo tiene score mayor con misma prioridad', () => {
    const recent = makeThread({ createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) })
    const old = makeThread({ createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000) })
    expect(computeUrgencyScore(old, now)).toBeGreaterThan(computeUrgencyScore(recent, now))
  })
})

describe('sortByUrgency', () => {
  const now = new Date('2026-04-23T12:00:00Z')

  it('ordena urgentes primero', () => {
    const threads = [
      makeThread({ id: 'a', priority: 'low' }),
      makeThread({ id: 'b', priority: 'urgent' }),
      makeThread({ id: 'c', priority: 'normal' }),
    ]
    const sorted = sortByUrgency(threads, now)
    expect(sorted[0].id).toBe('b')
  })

  it('entre misma prioridad, el más viejo primero', () => {
    const threads = [
      makeThread({ id: 'a', priority: 'high', createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) }),
      makeThread({ id: 'b', priority: 'high', createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000) }),
    ]
    const sorted = sortByUrgency(threads, now)
    expect(sorted[0].id).toBe('b')
  })

  it('no muta el array original', () => {
    const threads = [makeThread({ id: '1', priority: 'low' }), makeThread({ id: '2', priority: 'urgent' })]
    const snap = threads.map((t) => t.id)
    sortByUrgency(threads, now)
    expect(threads.map((t) => t.id)).toEqual(snap)
  })
})

// ── Filtros por rol ───────────────────────────────────
describe('getDefaultAreaFilterFor', () => {
  it('SUPERADMIN ve todo (null)', () => {
    expect(getDefaultAreaFilterFor({ id: 'u1', role: 'SUPERADMIN', area: null })).toBeNull()
  })
  it('ADMIN ve todo (null)', () => {
    expect(getDefaultAreaFilterFor({ id: 'u1', role: 'ADMIN', area: 'MARKETING' })).toBeNull()
  })
  it('MANAGER_AREA ve su área por defecto', () => {
    expect(getDefaultAreaFilterFor({ id: 'u1', role: 'MANAGER_AREA', area: 'LOGISTICA' })).toBe('LOGISTICA')
  })
  it('EMPLOYEE sin área → null', () => {
    expect(getDefaultAreaFilterFor({ id: 'u1', role: 'EMPLOYEE', area: null })).toBeNull()
  })
})

describe('canAccessThread', () => {
  const thread = makeThread({ area: 'COMERCIAL', assignedToId: 'u1' })

  it('SUPERADMIN accede a todo', () => {
    expect(canAccessThread({ id: 'u99', role: 'SUPERADMIN', area: null }, thread)).toBe(true)
  })
  it('MANAGER_AREA accede a hilos de su área', () => {
    expect(canAccessThread({ id: 'u2', role: 'MANAGER_AREA', area: 'COMERCIAL' }, thread)).toBe(true)
  })
  it('MANAGER_AREA de otra área no accede', () => {
    expect(canAccessThread({ id: 'u2', role: 'MANAGER_AREA', area: 'LOGISTICA' }, thread)).toBe(false)
  })
  it('EMPLOYEE accede si es el asignado', () => {
    expect(canAccessThread({ id: 'u1', role: 'EMPLOYEE', area: 'LOGISTICA' }, thread)).toBe(true)
  })
  it('COMMUNITY no accede al admin inbox', () => {
    expect(canAccessThread({ id: 'uX', role: 'COMMUNITY', area: null }, thread)).toBe(false)
  })
})

// ── Stats agregadas ───────────────────────────────────
describe('computeInboxStats', () => {
  const now = new Date('2026-04-23T12:00:00Z')

  it('cuenta open vs resolved', () => {
    const threads = [
      makeThread({ id: 'a', resolved: true, resolvedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) }),
      makeThread({ id: 'b', resolved: false }),
      makeThread({ id: 'c', resolved: false }),
    ]
    const stats = computeInboxStats(threads, now)
    expect(stats.total).toBe(3)
    expect(stats.open).toBe(2)
    expect(stats.resolved).toBe(1)
  })

  it('byPriority distribuye correctamente', () => {
    const threads = [
      makeThread({ priority: 'urgent' }),
      makeThread({ priority: 'urgent' }),
      makeThread({ priority: 'high' }),
      makeThread({ priority: 'normal' }),
    ]
    const stats = computeInboxStats(threads, now)
    expect(stats.byPriority.urgent).toBe(2)
    expect(stats.byPriority.high).toBe(1)
    expect(stats.byPriority.low).toBe(0)
  })

  it('avgResolutionHours calcula tiempo promedio', () => {
    const threads = [
      makeThread({
        resolved: true,
        createdAt: new Date('2026-04-23T10:00:00Z'),
        resolvedAt: new Date('2026-04-23T12:00:00Z'),
      }),
      makeThread({
        resolved: true,
        createdAt: new Date('2026-04-23T10:00:00Z'),
        resolvedAt: new Date('2026-04-23T14:00:00Z'),
      }),
    ]
    const stats = computeInboxStats(threads, now)
    expect(stats.avgResolutionHours).toBe(3) // (2h + 4h) / 2
  })

  it('oldestOpenHours reporta antigüedad del open más viejo', () => {
    const threads = [
      makeThread({ resolved: false, createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) }),
      makeThread({ resolved: false, createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000) }),
    ]
    const stats = computeInboxStats(threads, now)
    expect(stats.oldestOpenHours).toBe(48)
  })

  it('sla.complianceRate excluye resueltos y refleja solo open', () => {
    const threads = [
      makeThread({ priority: 'urgent', createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) }), // breached (urgent SLA=1h)
      makeThread({ priority: 'low', createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000) }), // on_track (low SLA=72h)
    ]
    const stats = computeInboxStats(threads, now)
    expect(stats.sla.breached).toBe(1)
    expect(stats.sla.onTrack).toBe(1)
    expect(stats.sla.complianceRate).toBe(50) // 1 de 2 compliant
  })

  it('byAssignment cuenta asignados vs sin asignar (solo open)', () => {
    const threads = [
      makeThread({ resolved: false, assignedToId: 'u1' }),
      makeThread({ resolved: false, assignedToId: null }),
      makeThread({ resolved: false, assignedToId: null }),
      makeThread({ resolved: true, assignedToId: 'u1' }), // no cuenta (resuelto)
    ]
    const stats = computeInboxStats(threads, now)
    expect(stats.byAssignment.assigned).toBe(1)
    expect(stats.byAssignment.unassigned).toBe(2)
  })

  it('arrays vacíos', () => {
    const stats = computeInboxStats([], now)
    expect(stats.total).toBe(0)
    expect(stats.avgResolutionHours).toBeNull()
    expect(stats.oldestOpenHours).toBeNull()
    expect(stats.sla.complianceRate).toBe(100)
  })
})

// ── Formatters ────────────────────────────────────────
describe('formatSlaStatus', () => {
  it('met → success', () => {
    expect(formatSlaStatus('met').tone).toBe('success')
  })
  it('breached → error', () => {
    expect(formatSlaStatus('breached').tone).toBe('error')
  })
  it('at_risk → warning', () => {
    expect(formatSlaStatus('at_risk').tone).toBe('warning')
  })
})

describe('formatPriorityForUi', () => {
  it('urgent tiene mayor weight', () => {
    expect(formatPriorityForUi('urgent').weight).toBeGreaterThan(formatPriorityForUi('low').weight)
  })
  it('todas las prioridades tienen label español', () => {
    const prios: PriorityLite[] = ['low', 'normal', 'high', 'urgent']
    for (const p of prios) {
      expect(formatPriorityForUi(p).label).toMatch(/^[A-ZÁ][a-záé]+$/)
    }
  })
})
