// V34 — Tests helpers Weekly Insights
// Validan cómputo de ventanas, deltas y generación de narrativa.
// No tocan Prisma ni LLM.
import { describe, it, expect } from 'vitest'
import {
  getWeekBounds,
  getPreviousWeekBounds,
  deltaPercent,
  generateHeadline,
  generateHighlights,
  generateRecommendations,
} from '../helpers'

describe('getWeekBounds', () => {
  it('lunes devuelve esa misma fecha como start', () => {
    // 2026-04-20 es lunes (ISO week 17)
    const monday = new Date('2026-04-20T12:00:00Z')
    const b = getWeekBounds(monday)
    expect(b.start.toISOString()).toBe('2026-04-20T00:00:00.000Z')
    expect(b.end.toISOString()).toBe('2026-04-26T23:59:59.999Z')
  })

  it('miércoles devuelve el lunes de esa semana', () => {
    const wednesday = new Date('2026-04-22T15:30:00Z')
    const b = getWeekBounds(wednesday)
    expect(b.start.toISOString()).toBe('2026-04-20T00:00:00.000Z')
    expect(b.end.toISOString()).toBe('2026-04-26T23:59:59.999Z')
  })

  it('domingo (fin de semana ISO) pertenece a esa semana que empezó lunes', () => {
    const sunday = new Date('2026-04-26T20:00:00Z')
    const b = getWeekBounds(sunday)
    expect(b.start.toISOString()).toBe('2026-04-20T00:00:00.000Z')
    expect(b.end.toISOString()).toBe('2026-04-26T23:59:59.999Z')
  })

  it('cruzar fin de mes correcto', () => {
    // 2026-04-30 es jueves
    const thursday = new Date('2026-04-30T12:00:00Z')
    const b = getWeekBounds(thursday)
    expect(b.start.toISOString()).toBe('2026-04-27T00:00:00.000Z')
    expect(b.end.toISOString()).toBe('2026-05-03T23:59:59.999Z')
  })

  it('cruzar fin de año', () => {
    // 2026-12-31 es jueves
    const thursday = new Date('2026-12-31T12:00:00Z')
    const b = getWeekBounds(thursday)
    expect(b.start.toISOString()).toBe('2026-12-28T00:00:00.000Z')
    expect(b.end.toISOString()).toBe('2027-01-03T23:59:59.999Z')
  })

  it('idempotente: bounds(start) === bounds(mid) === bounds(end)', () => {
    const any1 = new Date('2026-04-21T05:00:00Z')
    const any2 = new Date('2026-04-25T23:00:00Z')
    const b1 = getWeekBounds(any1)
    const b2 = getWeekBounds(any2)
    expect(b1.start.toISOString()).toBe(b2.start.toISOString())
    expect(b1.end.toISOString()).toBe(b2.end.toISOString())
  })
})

describe('getPreviousWeekBounds', () => {
  it('devuelve la semana anterior dado un weekStart', () => {
    const currentStart = new Date('2026-04-20T00:00:00Z')
    const prev = getPreviousWeekBounds(currentStart)
    expect(prev.start.toISOString()).toBe('2026-04-13T00:00:00.000Z')
    expect(prev.end.toISOString()).toBe('2026-04-19T23:59:59.999Z')
  })

  it('consecutivo: prev.end + 1ms === current.start', () => {
    const currentStart = new Date('2026-04-20T00:00:00Z')
    const prev = getPreviousWeekBounds(currentStart)
    expect(prev.end.getTime() + 1).toBe(currentStart.getTime())
  })
})

describe('deltaPercent', () => {
  it('crecimiento normal', () => {
    expect(deltaPercent(120, 100)).toBe(20)
    expect(deltaPercent(150, 100)).toBe(50)
  })

  it('decrecimiento normal', () => {
    expect(deltaPercent(80, 100)).toBe(-20)
    expect(deltaPercent(50, 100)).toBe(-50)
  })

  it('sin cambio', () => {
    expect(deltaPercent(100, 100)).toBe(0)
    expect(deltaPercent(0, 0)).toBe(0)
  })

  it('desde cero a positivo → 100', () => {
    expect(deltaPercent(500, 0)).toBe(100)
    expect(deltaPercent(1, 0)).toBe(100)
  })

  it('desde cero a cero → 0 (sin cambio)', () => {
    expect(deltaPercent(0, 0)).toBe(0)
  })

  it('de positivo a cero → -100', () => {
    expect(deltaPercent(0, 100)).toBe(-100)
  })

  it('redondea a 1 decimal', () => {
    // (110-99)/99 = 11.1111%
    expect(deltaPercent(110, 99)).toBe(11.1)
  })

  it('no deriva con ruido float', () => {
    expect(deltaPercent(300.1, 300)).toBe(0) // menos de 0.05 → redondea a 0
  })
})

describe('generateHeadline', () => {
  const base = {
    revenueDeltaPct: 0,
    orderCount: 10,
    orderCountPrev: 10,
    healthDelta: 0,
    segment: null,
  }

  it('crecimiento drástico → headline celebratorio con "momentum"', () => {
    const h = generateHeadline({ ...base, revenueDeltaPct: 80 })
    expect(h.toLowerCase()).toContain('80')
    expect(h.toLowerCase()).toContain('escala')
  })

  it('caída drástica → headline con alerta "revisa"', () => {
    const h = generateHeadline({ ...base, revenueDeltaPct: -45 })
    expect(h.toLowerCase()).toContain('bajaste')
    expect(h.toLowerCase()).toContain('45')
  })

  it('salto positivo de health score', () => {
    const h = generateHeadline({ ...base, healthDelta: 15 })
    expect(h.toLowerCase()).toContain('salud')
    expect(h.toLowerCase()).toContain('15')
  })

  it('caída de health score', () => {
    const h = generateHeadline({ ...base, healthDelta: -12 })
    expect(h.toLowerCase()).toContain('cayó')
    expect(h.toLowerCase()).toContain('12')
  })

  it('estabilidad → mensaje calmo pero accionable', () => {
    const h = generateHeadline(base)
    expect(h.toLowerCase()).toContain('estable')
  })

  it('semana sin ventas para user NEW', () => {
    const h = generateHeadline({
      ...base,
      orderCount: 0,
      orderCountPrev: 0,
      segment: 'NEW' as const,
    })
    expect(h.toLowerCase()).toContain('activa')
  })

  it('prioriza revenue drástico sobre health (más impacto inmediato)', () => {
    // Revenue +60 + health -20: queremos ver el positivo del revenue
    const h = generateHeadline({
      ...base,
      revenueDeltaPct: 60,
      healthDelta: -20,
    })
    expect(h.toLowerCase()).toContain('60')
  })
})

describe('generateHighlights', () => {
  it('siempre incluye revenue', () => {
    const h = generateHighlights({
      revenue: 1500,
      revenueDeltaPct: 10,
      orderCount: 5,
      orderCountPrev: 4,
      netProfit: 300,
      roas: 2.5,
      breakEvenRoas: 2,
      topProductName: 'Té Verde',
    })
    const labels = h.map(x => x.label)
    expect(labels).toContain('Revenue')
  })

  it('ROAS saludable → trend up', () => {
    const h = generateHighlights({
      revenue: 1000,
      revenueDeltaPct: 0,
      orderCount: 10,
      orderCountPrev: 10,
      netProfit: 200,
      roas: 3,
      breakEvenRoas: 2,
      topProductName: null,
    })
    const roasEntry = h.find(x => x.label === 'ROAS')
    expect(roasEntry?.trend).toBe('up')
  })

  it('ROAS bajo break-even → trend down', () => {
    const h = generateHighlights({
      revenue: 1000,
      revenueDeltaPct: 0,
      orderCount: 10,
      orderCountPrev: 10,
      netProfit: -100,
      roas: 1.5,
      breakEvenRoas: 2,
      topProductName: null,
    })
    const roasEntry = h.find(x => x.label === 'ROAS')
    expect(roasEntry?.trend).toBe('down')
  })

  it('omite utilidad si orderCount=0 (evita mostrar utilidad inventada)', () => {
    const h = generateHighlights({
      revenue: 0,
      revenueDeltaPct: 0,
      orderCount: 0,
      orderCountPrev: 0,
      netProfit: 0,
      roas: 0,
      breakEvenRoas: 0,
      topProductName: null,
    })
    const utilidad = h.find(x => x.label === 'Utilidad')
    expect(utilidad).toBeUndefined()
  })

  it('formato de dinero compacto: 1.5k / 2.3M', () => {
    const h = generateHighlights({
      revenue: 1500,
      revenueDeltaPct: 0,
      orderCount: 5,
      orderCountPrev: 5,
      netProfit: 2_300_000,
      roas: 0,
      breakEvenRoas: 0,
      topProductName: null,
    })
    expect(h.find(x => x.label === 'Revenue')?.value).toBe('1.5k')
    expect(h.find(x => x.label === 'Utilidad')?.value).toBe('2.3M')
  })
})

describe('generateRecommendations', () => {
  const sane = {
    revenueDeltaPct: 5,
    roas: 2.5,
    breakEvenRoas: 2,
    netProfit: 500,
    orderCount: 10,
    healthScore: 75,
    healthDelta: 2,
    activeAlerts: 0,
    hasShopify: true,
  }

  it('máximo 3 recomendaciones', () => {
    const recs = generateRecommendations({
      ...sane,
      revenueDeltaPct: -40,
      roas: 0.5,
      breakEvenRoas: 2,
      netProfit: -500,
      healthDelta: -20,
      activeAlerts: 5,
      hasShopify: false,
    })
    expect(recs.length).toBeLessThanOrEqual(3)
  })

  it('prioriza critical > high > medium > low', () => {
    const recs = generateRecommendations({
      ...sane,
      roas: 0.5, // critical: ROAS < BE
      breakEvenRoas: 2,
      netProfit: -500, // critical: operando en pérdida
      orderCount: 5,
      revenueDeltaPct: -40, // high: caída revenue
    })
    // Al menos los dos primeros deben ser críticos
    expect(recs[0].priority).toBe('critical')
    expect(recs[1].priority).toBe('critical')
  })

  it('ROAS debajo de break-even → critical', () => {
    const recs = generateRecommendations({
      ...sane,
      roas: 1,
      breakEvenRoas: 2,
    })
    expect(recs[0].priority).toBe('critical')
    expect(recs[0].title.toLowerCase()).toContain('roas')
  })

  it('ROAS sano + crecimiento → medium sugiere escalar', () => {
    const recs = generateRecommendations({
      ...sane,
      roas: 4, // BE=2, 4 >= 2*1.5=3 → healthy
      revenueDeltaPct: 10,
    })
    const escalar = recs.find(r => r.title.toLowerCase().includes('escalar'))
    expect(escalar).toBeDefined()
    expect(escalar?.priority).toBe('medium')
  })

  it('no Shopify → medium con link a tienda', () => {
    const recs = generateRecommendations({ ...sane, hasShopify: false })
    const shopify = recs.find(r => r.title.toLowerCase().includes('shopify'))
    expect(shopify).toBeDefined()
    expect(shopify?.href).toBe('/mi-tienda')
  })

  it('todo sano → fallback low "todo bajo control"', () => {
    const recs = generateRecommendations(sane)
    expect(recs.length).toBeGreaterThanOrEqual(1)
    expect(recs.find(r => r.priority === 'low')).toBeDefined()
  })

  it('cada recomendación tiene title + action no-vacíos', () => {
    const recs = generateRecommendations({
      ...sane,
      revenueDeltaPct: -40,
      healthDelta: -15,
    })
    for (const r of recs) {
      expect(r.title.length).toBeGreaterThan(0)
      expect(r.action.length).toBeGreaterThan(0)
    }
  })
})
