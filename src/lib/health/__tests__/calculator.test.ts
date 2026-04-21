// V32 — tests del calculator de Health Score (función pura)
import { describe, it, expect } from 'vitest'
import {
  computeHealthScore,
  classifySegment,
  scoreLoginRecency,
  scoreCommunity,
  scoreOrders,
  scoreStore,
  scoreLearning,
  scoreGoals,
  scorePoints,
  type HealthInputs,
} from '../calculator'

const now = new Date('2026-04-21T12:00:00Z')

function baseInputs(overrides: Partial<HealthInputs> = {}): HealthInputs {
  return {
    userCreatedAt: new Date('2026-01-01T00:00:00Z'), // > 7 días atrás
    lastActivityAt: new Date('2026-04-20T00:00:00Z'),
    ordersLast30d: 0,
    postsLast30d: 0,
    commentsLast30d: 0,
    courseLessonsCompletedLast30d: 0,
    hasConnectedShopifyStore: false,
    hasGoalWithProgress: false,
    totalPoints: 0,
    now,
    ...overrides,
  }
}

describe('scoreLoginRecency', () => {
  it('20 si dentro de 7 días', () => {
    const last = new Date(now.getTime() - 3 * 86_400_000)
    expect(scoreLoginRecency(last, now)).toBe(20)
  })

  it('12 si 8-14 días', () => {
    const last = new Date(now.getTime() - 10 * 86_400_000)
    expect(scoreLoginRecency(last, now)).toBe(12)
  })

  it('6 si 15-30 días', () => {
    const last = new Date(now.getTime() - 20 * 86_400_000)
    expect(scoreLoginRecency(last, now)).toBe(6)
  })

  it('0 si más de 30 días', () => {
    const last = new Date(now.getTime() - 45 * 86_400_000)
    expect(scoreLoginRecency(last, now)).toBe(0)
  })

  it('0 si null', () => {
    expect(scoreLoginRecency(null, now)).toBe(0)
  })
})

describe('scoreCommunity', () => {
  it('0 sin actividad', () => {
    expect(scoreCommunity(0, 0)).toBe(0)
  })

  it('suma posts y comments con pesos', () => {
    expect(scoreCommunity(1, 1)).toBe(7) // 5 + 2
    expect(scoreCommunity(2, 0)).toBe(10)
    expect(scoreCommunity(0, 4)).toBe(8)
  })

  it('cap en 15', () => {
    expect(scoreCommunity(10, 10)).toBe(15)
    expect(scoreCommunity(3, 1)).toBe(15) // 15 + 2 → 15
  })
})

describe('scoreOrders', () => {
  it('0 sin pedidos', () => {
    expect(scoreOrders(0)).toBe(0)
  })

  it('10 con 1-2 pedidos', () => {
    expect(scoreOrders(1)).toBe(10)
    expect(scoreOrders(2)).toBe(10)
  })

  it('18 con 3-9 pedidos', () => {
    expect(scoreOrders(3)).toBe(18)
    expect(scoreOrders(9)).toBe(18)
  })

  it('25 con 10+ pedidos', () => {
    expect(scoreOrders(10)).toBe(25)
    expect(scoreOrders(50)).toBe(25)
  })
})

describe('scoreStore', () => {
  it('10 si conectada, 0 si no', () => {
    expect(scoreStore(true)).toBe(10)
    expect(scoreStore(false)).toBe(0)
  })
})

describe('scoreLearning', () => {
  it('lineal con cap 10', () => {
    expect(scoreLearning(0)).toBe(0)
    expect(scoreLearning(1)).toBe(3)
    expect(scoreLearning(3)).toBe(9)
    expect(scoreLearning(4)).toBe(10) // cap
    expect(scoreLearning(100)).toBe(10)
  })
})

describe('scoreGoals', () => {
  it('10 si meta con progreso', () => {
    expect(scoreGoals(true)).toBe(10)
    expect(scoreGoals(false)).toBe(0)
  })
})

describe('scorePoints', () => {
  it('escalado lineal hasta 500', () => {
    expect(scorePoints(0)).toBe(0)
    expect(scorePoints(250)).toBe(5)
    expect(scorePoints(500)).toBe(10)
    expect(scorePoints(10_000)).toBe(10)
  })
})

describe('classifySegment', () => {
  it('ACTIVE si >= 60', () => {
    expect(classifySegment(60)).toBe('ACTIVE')
    expect(classifySegment(100)).toBe('ACTIVE')
  })

  it('AT_RISK entre 30 y 59', () => {
    expect(classifySegment(30)).toBe('AT_RISK')
    expect(classifySegment(59)).toBe('AT_RISK')
  })

  it('CHURNED si < 30', () => {
    expect(classifySegment(0)).toBe('CHURNED')
    expect(classifySegment(29)).toBe('CHURNED')
  })
})

describe('computeHealthScore — casos completos', () => {
  it('NEW si usuario joven (<7 días)', () => {
    const r = computeHealthScore(baseInputs({
      userCreatedAt: new Date(now.getTime() - 3 * 86_400_000),
    }))
    expect(r.segment).toBe('NEW')
    expect(r.score).toBe(0)
  })

  it('CHURNED si todo en cero y sin login reciente', () => {
    const r = computeHealthScore(baseInputs({ lastActivityAt: null }))
    expect(r.segment).toBe('CHURNED')
    expect(r.score).toBe(0)
  })

  it('ACTIVE con dropshipper saludable', () => {
    const r = computeHealthScore(baseInputs({
      ordersLast30d: 15, // 25
      hasConnectedShopifyStore: true, // 10
      postsLast30d: 2, commentsLast30d: 3, // min(15, 10+6) = 15
      courseLessonsCompletedLast30d: 4, // 10
      hasGoalWithProgress: true, // 10
      totalPoints: 500, // 10
    }))
    expect(r.score).toBe(100)
    expect(r.segment).toBe('ACTIVE')
  })

  it('score exactamente 60 es ACTIVE (threshold)', () => {
    const r = computeHealthScore(baseInputs({
      ordersLast30d: 3, // 18
      lastActivityAt: new Date(now.getTime() - 1 * 86_400_000), // 20
      hasConnectedShopifyStore: true, // 10
      postsLast30d: 2, // 10 (5*2)
      totalPoints: 100, // 2
    }))
    expect(r.score).toBe(60)
    expect(r.segment).toBe('ACTIVE')
  })

  it('breakdown suma exactamente al score', () => {
    const r = computeHealthScore(baseInputs({
      ordersLast30d: 2,
      hasConnectedShopifyStore: true,
      totalPoints: 250,
    }))
    const sum =
      r.breakdown.loginRecency
      + r.breakdown.community
      + r.breakdown.orders
      + r.breakdown.store
      + r.breakdown.learning
      + r.breakdown.goals
      + r.breakdown.points
    expect(sum).toBe(r.score)
  })

  it('reasons mencionan los factores más bajos primero', () => {
    const r = computeHealthScore(baseInputs())
    expect(r.reasons.length).toBeGreaterThan(0)
    expect(r.reasons[0]).toContain('ventas')
  })

  it('reasons positivas si todo está bien', () => {
    const r = computeHealthScore(baseInputs({
      ordersLast30d: 10,
      lastActivityAt: new Date(now.getTime() - 1 * 86_400_000),
      hasConnectedShopifyStore: true,
      postsLast30d: 1, commentsLast30d: 2,
      courseLessonsCompletedLast30d: 2,
      hasGoalWithProgress: true,
      totalPoints: 300,
    }))
    expect(r.reasons[0]).toContain('saludable')
  })

  it('reasons se limitan a 4', () => {
    const r = computeHealthScore(baseInputs())
    expect(r.reasons.length).toBeLessThanOrEqual(4)
  })
})
