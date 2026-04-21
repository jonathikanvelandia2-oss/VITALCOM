// V30.1 — tests del LLM router (utilidades puras + health)
import { describe, it, expect } from 'vitest'
import { cosine, getRouterHealth } from '../llm-router'

describe('cosine', () => {
  it('vectores idénticos → 1', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6)
  })

  it('vectores ortogonales → 0', () => {
    expect(cosine([1, 0], [0, 1])).toBe(0)
  })

  it('vectores opuestos → -1', () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1, 6)
  })

  it('vector cero devuelve 0 (no NaN)', () => {
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0)
    expect(cosine([1, 2, 3], [0, 0, 0])).toBe(0)
  })

  it('longitudes distintas devuelve 0', () => {
    expect(cosine([1, 2, 3], [1, 2])).toBe(0)
  })

  it('array vacío devuelve 0', () => {
    expect(cosine([], [])).toBe(0)
  })

  it('es simétrico', () => {
    const a = [0.3, 0.7, 0.2, 0.9]
    const b = [0.1, 0.5, 0.6, 0.4]
    const ab = cosine(a, b)
    const ba = cosine(b, a)
    expect(ab).toBeCloseTo(ba, 9)
  })

  it('resultado siempre en [-1, 1] para entradas normales', () => {
    const a = [0.1, 0.2, 0.3, 0.4, 0.5]
    const b = [0.5, 0.4, 0.3, 0.2, 0.1]
    const sim = cosine(a, b)
    expect(sim).toBeGreaterThanOrEqual(-1)
    expect(sim).toBeLessThanOrEqual(1)
  })
})

describe('getRouterHealth', () => {
  it('devuelve estructura con flags y circuits', () => {
    const h = getRouterHealth()
    expect(h).toHaveProperty('anthropicEnabled')
    expect(h).toHaveProperty('embeddingsEnabled')
    expect(h).toHaveProperty('circuits')
    expect(h.circuits).toHaveProperty('openai')
    expect(h.circuits).toHaveProperty('anthropic')
  })

  it('circuit abierto es boolean', () => {
    const h = getRouterHealth()
    expect(typeof h.circuits.openai.open).toBe('boolean')
    expect(typeof h.circuits.anthropic.open).toBe('boolean')
  })

  it('en test sin key Anthropic, anthropicEnabled refleja env', () => {
    const h = getRouterHealth()
    expect(h.anthropicEnabled).toBe(Boolean(process.env.ANTHROPIC_API_KEY))
  })
})
