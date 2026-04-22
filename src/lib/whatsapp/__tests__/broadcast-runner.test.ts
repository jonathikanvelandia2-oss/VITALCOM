// Tests de lógica pura del broadcast-runner (V29+V30)
// Cubren los invariantes críticos para no mandar mensajes al segmento
// equivocado. No tocan Prisma — solo helpers extraídos.
import { describe, it, expect } from 'vitest'
import {
  buildSegmentWhere,
  matchesTagFilter,
  needsTagFilter,
  MAX_RECIPIENTS,
  RESOLVE_CHUNK,
} from '../broadcast-runner'

describe('buildSegmentWhere', () => {
  it('aplica isOptedIn:true por defecto', () => {
    const w = buildSegmentWhere('acc-1', {})
    expect(w).toEqual({ accountId: 'acc-1', isOptedIn: true })
  })

  it('omite isOptedIn cuando onlyOptedIn=false explícito', () => {
    const w = buildSegmentWhere('acc-1', { onlyOptedIn: false })
    expect(w).toEqual({ accountId: 'acc-1' })
    expect('isOptedIn' in w).toBe(false)
  })

  it('respeta onlyOptedIn=true explícito', () => {
    const w = buildSegmentWhere('acc-1', { onlyOptedIn: true })
    expect(w).toEqual({ accountId: 'acc-1', isOptedIn: true })
  })

  it('agrega segment cuando se provee', () => {
    const w = buildSegmentWhere('acc-1', { segment: 'vip' })
    expect(w).toMatchObject({ segment: 'vip' })
  })

  it('omite segment cuando es undefined', () => {
    const w = buildSegmentWhere('acc-1', {})
    expect('segment' in w).toBe(false)
  })

  it('agrega country como shippingCountry', () => {
    const w = buildSegmentWhere('acc-1', { country: 'CO' })
    expect(w).toMatchObject({ shippingCountry: 'CO' })
  })

  it('agrega minLtv como lifetimeValue gte', () => {
    const w = buildSegmentWhere('acc-1', { minLtv: 100000 })
    expect(w).toMatchObject({ lifetimeValue: { gte: 100000 } })
  })

  it('minLtv=0 se aplica (edge: excluye LTV negativo pero incluye 0)', () => {
    const w = buildSegmentWhere('acc-1', { minLtv: 0 })
    expect(w).toMatchObject({ lifetimeValue: { gte: 0 } })
  })

  it('composición múltiple no colisiona', () => {
    const w = buildSegmentWhere('acc-1', {
      segment: 'active',
      country: 'EC',
      minLtv: 50,
      onlyOptedIn: true,
    })
    expect(w).toEqual({
      accountId: 'acc-1',
      isOptedIn: true,
      segment: 'active',
      shippingCountry: 'EC',
      lifetimeValue: { gte: 50 },
    })
  })

  it('tags y excludeTags NO se agregan al where (se filtran en memoria)', () => {
    const w = buildSegmentWhere('acc-1', {
      tags: ['vip'],
      excludeTags: ['churn'],
    })
    expect('tags' in w).toBe(false)
    expect('excludeTags' in w).toBe(false)
  })
})

describe('matchesTagFilter', () => {
  const vip = [{ key: 'vip' }, { key: 'active' }]

  it('sin filtros → siempre true', () => {
    expect(matchesTagFilter(vip, [], [])).toBe(true)
    expect(matchesTagFilter([], [], [])).toBe(true)
    expect(matchesTagFilter(null, [], [])).toBe(true)
  })

  it('include: contacto debe tener AL MENOS UNA tag del include', () => {
    expect(matchesTagFilter(vip, ['vip'], [])).toBe(true)
    expect(matchesTagFilter(vip, ['active'], [])).toBe(true)
    expect(matchesTagFilter(vip, ['vip', 'churn'], [])).toBe(true) // "vip" está
  })

  it('include: contacto sin ninguna tag del filtro → false', () => {
    expect(matchesTagFilter(vip, ['churn'], [])).toBe(false)
    expect(matchesTagFilter([], ['vip'], [])).toBe(false)
  })

  it('exclude: contacto con ALGUNA tag excluida → false', () => {
    expect(matchesTagFilter(vip, [], ['vip'])).toBe(false)
    expect(matchesTagFilter(vip, [], ['active'])).toBe(false)
    expect(matchesTagFilter(vip, [], ['churn'])).toBe(true)
  })

  it('include + exclude combinados', () => {
    expect(matchesTagFilter(vip, ['vip'], ['churn'])).toBe(true)
    expect(matchesTagFilter(vip, ['vip'], ['active'])).toBe(false)
  })

  it('tolera tags no-array (BD sucia) → trata como sin tags', () => {
    expect(matchesTagFilter(undefined, [], [])).toBe(true)
    expect(matchesTagFilter({}, [], [])).toBe(true)
    expect(matchesTagFilter('string', [], [])).toBe(true)
    expect(matchesTagFilter(42, ['vip'], [])).toBe(false)
  })

  it('filtra objetos tag sin key (sucios)', () => {
    const dirty = [{ key: 'vip' }, {}, { key: null }, { key: 'active' }]
    expect(matchesTagFilter(dirty, ['vip'], [])).toBe(true)
    expect(matchesTagFilter(dirty, ['active'], [])).toBe(true)
  })

  it('vacío como include → siempre pasa include (equivalente a no filtro)', () => {
    expect(matchesTagFilter(vip, [], ['nada'])).toBe(true)
    expect(matchesTagFilter([], [], [])).toBe(true)
  })
})

describe('needsTagFilter', () => {
  it('true si hay tags', () => {
    expect(needsTagFilter({ tags: ['vip'] })).toBe(true)
  })

  it('true si hay excludeTags', () => {
    expect(needsTagFilter({ excludeTags: ['churn'] })).toBe(true)
  })

  it('true si hay ambos', () => {
    expect(needsTagFilter({ tags: ['vip'], excludeTags: ['churn'] })).toBe(true)
  })

  it('false si ambos vacíos o undefined', () => {
    expect(needsTagFilter({})).toBe(false)
    expect(needsTagFilter({ tags: [], excludeTags: [] })).toBe(false)
    expect(needsTagFilter({ segment: 'vip', country: 'CO' })).toBe(false)
  })
})

describe('constantes de guardrail', () => {
  it('MAX_RECIPIENTS limita a ≤10k (no sobrecargar serverless)', () => {
    expect(MAX_RECIPIENTS).toBeGreaterThan(0)
    expect(MAX_RECIPIENTS).toBeLessThanOrEqual(10_000)
  })

  it('RESOLVE_CHUNK razonable (no cargar 10k rows en una query)', () => {
    expect(RESOLVE_CHUNK).toBeGreaterThan(0)
    expect(RESOLVE_CHUNK).toBeLessThanOrEqual(1000)
  })

  it('MAX_RECIPIENTS es múltiplo o mayor que RESOLVE_CHUNK (paginación alcanza el cap)', () => {
    expect(MAX_RECIPIENTS).toBeGreaterThanOrEqual(RESOLVE_CHUNK)
  })
})
