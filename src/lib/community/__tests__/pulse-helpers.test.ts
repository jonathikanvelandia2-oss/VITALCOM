// V35 — Tests helpers Community Pulse
// Validan distribución, top movers, at-risk ranking y cobertura.
import { describe, it, expect } from 'vitest'
import {
  computeSegmentDistribution,
  computeTopMovers,
  computeAtRiskList,
  computeCoverage,
  type MoverInput,
  type AtRiskInput,
} from '../pulse-helpers'

describe('computeSegmentDistribution', () => {
  it('array vacío → []', () => {
    expect(computeSegmentDistribution([])).toEqual([])
  })

  it('total=0 → []', () => {
    expect(computeSegmentDistribution([
      { segment: 'ACTIVE' as const, count: 0 },
      { segment: 'AT_RISK' as const, count: 0 },
    ])).toEqual([])
  })

  it('distribución normalizada en % (1 decimal)', () => {
    const dist = computeSegmentDistribution([
      { segment: 'ACTIVE' as const, count: 100 },
      { segment: 'AT_RISK' as const, count: 50 },
      { segment: 'CHURNED' as const, count: 50 },
    ])
    expect(dist.find(d => d.segment === 'ACTIVE')?.percentage).toBe(50)
    expect(dist.find(d => d.segment === 'AT_RISK')?.percentage).toBe(25)
    expect(dist.find(d => d.segment === 'CHURNED')?.percentage).toBe(25)
  })

  it('preserva orden de entrada', () => {
    const dist = computeSegmentDistribution([
      { segment: 'CHURNED' as const, count: 10 },
      { segment: 'ACTIVE' as const, count: 10 },
    ])
    expect(dist[0].segment).toBe('CHURNED')
    expect(dist[1].segment).toBe('ACTIVE')
  })

  it('preserva count original además del %', () => {
    const dist = computeSegmentDistribution([
      { segment: 'ACTIVE' as const, count: 42 },
    ])
    expect(dist[0].count).toBe(42)
    expect(dist[0].percentage).toBe(100)
  })
})

describe('computeTopMovers', () => {
  const sample: MoverInput[] = [
    { userId: 'a', userName: 'Ana', revenueDeltaPct: 80, revenue: 500, segment: 'ACTIVE' },
    { userId: 'b', userName: 'Bruno', revenueDeltaPct: 30, revenue: 300, segment: 'ACTIVE' },
    { userId: 'c', userName: 'Carla', revenueDeltaPct: -45, revenue: 200, segment: 'AT_RISK' },
    { userId: 'd', userName: 'Diego', revenueDeltaPct: -25, revenue: 150, segment: 'AT_RISK' },
    { userId: 'e', userName: 'Elena', revenueDeltaPct: 3, revenue: 100, segment: 'ACTIVE' }, // debajo del umbral
    { userId: 'f', userName: null, revenueDeltaPct: 50, revenue: 0, segment: 'NEW' }, // revenue 0
  ]

  it('up ordenados por magnitud descendente', () => {
    const { up } = computeTopMovers(sample)
    expect(up[0].userId).toBe('a')
    expect(up[1].userId).toBe('b')
  })

  it('down ordenados por magnitud descendente (más negativo primero)', () => {
    const { down } = computeTopMovers(sample)
    expect(down[0].userId).toBe('c')
    expect(down[1].userId).toBe('d')
  })

  it('excluye users con revenue=0', () => {
    const { up } = computeTopMovers(sample)
    expect(up.find(m => m.userId === 'f')).toBeUndefined()
  })

  it('excluye movers con |delta|<5% (ruido)', () => {
    const { up, down } = computeTopMovers(sample)
    const all = [...up, ...down]
    expect(all.find(m => m.userId === 'e')).toBeUndefined()
  })

  it('respeta limit', () => {
    const { up, down } = computeTopMovers(sample, 1)
    expect(up.length).toBe(1)
    expect(down.length).toBe(1)
  })

  it('direction correcto', () => {
    const { up, down } = computeTopMovers(sample)
    expect(up.every(m => m.direction === 'up')).toBe(true)
    expect(down.every(m => m.direction === 'down')).toBe(true)
  })

  it('userName null → "Sin nombre"', () => {
    const { up } = computeTopMovers([
      { userId: 'x', userName: null, revenueDeltaPct: 100, revenue: 500, segment: 'ACTIVE' },
    ])
    expect(up[0].userName).toBe('Sin nombre')
  })
})

describe('computeAtRiskList', () => {
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 86400_000)
  const weekAgo = new Date(now.getTime() - 8 * 86400_000)

  const sample: AtRiskInput[] = [
    {
      userId: 'a', userName: 'Ana',
      healthScore: 45,
      previousSegment: 'ACTIVE', segment: 'AT_RISK',
      revenue: 500,
      lastRetentionTriggerAt: null,
    },
    {
      userId: 'b', userName: 'Bruno',
      healthScore: 40,
      previousSegment: 'AT_RISK', segment: 'AT_RISK',
      revenue: 300,
      lastRetentionTriggerAt: null,
    },
    {
      userId: 'c', userName: 'Carla',
      healthScore: 20,
      previousSegment: 'AT_RISK', segment: 'CHURNED',
      revenue: 0,
      lastRetentionTriggerAt: null,
    },
    {
      userId: 'd', userName: 'Diego',
      healthScore: 15,
      previousSegment: 'CHURNED', segment: 'CHURNED',
      revenue: 0,
      lastRetentionTriggerAt: dayAgo,
    },
    {
      userId: 'e', userName: 'Elena',
      healthScore: 80,
      previousSegment: 'ACTIVE', segment: 'ACTIVE',
      revenue: 800,
      lastRetentionTriggerAt: null,
    },
  ]

  it('excluye users ACTIVE', () => {
    const result = computeAtRiskList(sample)
    expect(result.find(u => u.userId === 'e')).toBeUndefined()
  })

  it('incluye AT_RISK y CHURNED', () => {
    const result = computeAtRiskList(sample)
    const ids = result.map(u => u.userId)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
    expect(ids).toContain('c')
    expect(ids).toContain('d')
  })

  it('prioriza "recién cayó de ACTIVE" más alto', () => {
    const result = computeAtRiskList(sample)
    expect(result[0].userId).toBe('a') // Ana cayó ACTIVE→AT_RISK
  })

  it('CHURNED con intervención reciente → más bajo ranking', () => {
    const result = computeAtRiskList(sample)
    const diego = result.find(u => u.userId === 'd')!
    const carla = result.find(u => u.userId === 'c')!
    expect(carla.weight).toBeGreaterThan(diego.weight)
  })

  it('cada entrada tiene reason human-readable', () => {
    const result = computeAtRiskList(sample)
    for (const u of result) {
      expect(u.reason.length).toBeGreaterThan(0)
    }
  })

  it('respeta limit', () => {
    const result = computeAtRiskList(sample, { limit: 2 })
    expect(result.length).toBe(2)
  })

  it('cooldown configurable — trigger reciente reduce weight', () => {
    // Diego: triggered hace 1 día
    // Con cooldown 30d → considerado reciente → weight bajo (=1)
    const resWithCooldown = computeAtRiskList(sample, { daysSinceLastTrigger: 30 })
    const diegoWith = resWithCooldown.find(u => u.userId === 'd')!
    expect(diegoWith.weight).toBe(1)

    // Con cooldown 0d → NO reciente (triggered hace 1 día > 0d) → weight mayor
    const sample2: AtRiskInput[] = [{
      ...sample[3], lastRetentionTriggerAt: weekAgo,
    }]
    const resNoRecent = computeAtRiskList(sample2, { daysSinceLastTrigger: 7 })
    expect(resNoRecent[0].weight).toBeGreaterThan(1)
  })
})

describe('computeCoverage', () => {
  it('activeUsers=0 → coverage 0, label bajo', () => {
    const r = computeCoverage({ activeUsers: 0, insightsGenerated: 0 })
    expect(r.coverage).toBe(0)
    expect(r.label).toBe('bajo')
  })

  it('todos cubiertos → 100, excelente', () => {
    const r = computeCoverage({ activeUsers: 100, insightsGenerated: 100 })
    expect(r.coverage).toBe(100)
    expect(r.label).toBe('excelente')
  })

  it('90% → excelente', () => {
    const r = computeCoverage({ activeUsers: 100, insightsGenerated: 90 })
    expect(r.label).toBe('excelente')
  })

  it('75% → alto', () => {
    const r = computeCoverage({ activeUsers: 100, insightsGenerated: 75 })
    expect(r.label).toBe('alto')
  })

  it('50% → medio', () => {
    const r = computeCoverage({ activeUsers: 100, insightsGenerated: 50 })
    expect(r.label).toBe('medio')
  })

  it('<40% → bajo', () => {
    const r = computeCoverage({ activeUsers: 100, insightsGenerated: 10 })
    expect(r.label).toBe('bajo')
  })

  it('missing = activeUsers - insightsGenerated', () => {
    const r = computeCoverage({ activeUsers: 100, insightsGenerated: 77 })
    expect(r.missing).toBe(23)
  })

  it('coverage cap 100 (nunca >100 aunque insights > active por bug)', () => {
    const r = computeCoverage({ activeUsers: 10, insightsGenerated: 15 })
    expect(r.coverage).toBe(100)
    expect(r.missing).toBe(0)
  })
})
