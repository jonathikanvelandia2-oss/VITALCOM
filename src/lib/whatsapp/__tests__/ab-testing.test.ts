// V30.1 — tests de A/B testing picker (función pura, sin BD)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { pickWeightedVariant } from '../ab-testing'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pickWeightedVariant', () => {
  it('lanza error si array vacío', () => {
    expect(() => pickWeightedVariant([])).toThrow('No variants')
  })

  it('devuelve el único cuando hay 1 variante', () => {
    const v = [{ weight: 5, id: 'a' }]
    expect(pickWeightedVariant(v)).toBe(v[0])
  })

  it('elige primera si todos los pesos son 0', () => {
    const v = [
      { weight: 0, id: 'a' },
      { weight: 0, id: 'b' },
    ]
    expect(pickWeightedVariant(v)).toBe(v[0])
  })

  it('trata pesos negativos como 0', () => {
    const v = [
      { weight: -5, id: 'a' },
      { weight: 10, id: 'b' },
    ]
    // Con -5 tratado como 0, total = 10, siempre elige b
    for (let i = 0; i < 10; i++) {
      expect(pickWeightedVariant(v).id).toBe('b')
    }
  })

  it('distribuye proporcionalmente en muchas corridas (50/50)', () => {
    const v = [
      { weight: 50, id: 'a' },
      { weight: 50, id: 'b' },
    ]
    const counts = { a: 0, b: 0 } as Record<string, number>
    for (let i = 0; i < 10_000; i++) {
      counts[pickWeightedVariant(v).id]++
    }
    // Tolerancia ±5% sobre 10k corridas
    expect(counts.a).toBeGreaterThan(4500)
    expect(counts.a).toBeLessThan(5500)
    expect(counts.b).toBeGreaterThan(4500)
    expect(counts.b).toBeLessThan(5500)
  })

  it('distribuye proporcionalmente en 80/20', () => {
    const v = [
      { weight: 80, id: 'a' },
      { weight: 20, id: 'b' },
    ]
    const counts = { a: 0, b: 0 } as Record<string, number>
    for (let i = 0; i < 10_000; i++) {
      counts[pickWeightedVariant(v).id]++
    }
    expect(counts.a).toBeGreaterThan(7500)
    expect(counts.a).toBeLessThan(8500)
    expect(counts.b).toBeGreaterThan(1500)
    expect(counts.b).toBeLessThan(2500)
  })

  it('con Math.random() = 0 devuelve primera variante con peso > 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const v = [
      { weight: 10, id: 'a' },
      { weight: 90, id: 'b' },
    ]
    // r = 0 * 100 = 0 → entra al primer bucket (a: 0 -= 10 = -10 ≤ 0 → a)
    expect(pickWeightedVariant(v).id).toBe('a')
  })

  it('con Math.random() = 0.99 devuelve última variante', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const v = [
      { weight: 10, id: 'a' },
      { weight: 90, id: 'b' },
    ]
    expect(pickWeightedVariant(v).id).toBe('b')
  })

  it('preserva el objeto original (no lo clona)', () => {
    const a = { weight: 10, id: 'a', extra: 'payload' }
    const v = [a]
    expect(pickWeightedVariant(v)).toBe(a)
  })
})
