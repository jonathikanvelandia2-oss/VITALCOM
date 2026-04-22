// Tests del rate limiter in-memory + helper guardRateLimit
// Verifica las garantías que previenen abuso en endpoints críticos.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rateLimit, guardRateLimit, rateLimitHeaders, RATE_LIMITS } from '../rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('permite la primera request e inicializa la ventana', () => {
    const r = rateLimit('user-a-first', { maxRequests: 3, windowMs: 60_000 })
    expect(r.success).toBe(true)
    expect(r.remaining).toBe(2)
  })

  it('permite requests sucesivas dentro del cap, decrementa remaining', () => {
    const config = { maxRequests: 3, windowMs: 60_000 }
    const a = rateLimit('user-sweep', config)
    const b = rateLimit('user-sweep', config)
    const c = rateLimit('user-sweep', config)
    expect(a.remaining).toBe(2)
    expect(b.remaining).toBe(1)
    expect(c.remaining).toBe(0)
    expect([a, b, c].every(r => r.success)).toBe(true)
  })

  it('bloquea la (N+1)ésima request con success=false', () => {
    const config = { maxRequests: 2, windowMs: 60_000 }
    rateLimit('user-overflow', config)
    rateLimit('user-overflow', config)
    const third = rateLimit('user-overflow', config)
    expect(third.success).toBe(false)
    expect(third.remaining).toBe(0)
  })

  it('resetea la ventana tras windowMs', () => {
    const config = { maxRequests: 1, windowMs: 60_000 }
    const first = rateLimit('user-reset', config)
    expect(first.success).toBe(true)

    // Avanzar > windowMs
    vi.advanceTimersByTime(60_001)

    const second = rateLimit('user-reset', config)
    expect(second.success).toBe(true)
    expect(second.remaining).toBe(0)
  })

  it('aislamiento por identifier: usuarios distintos no se afectan', () => {
    const config = { maxRequests: 1, windowMs: 60_000 }
    const a = rateLimit('iso-user-a', config)
    const b = rateLimit('iso-user-b', config)
    expect(a.success).toBe(true)
    expect(b.success).toBe(true)
  })

  it('resetAt devuelve timestamp futuro en ms', () => {
    const config = { maxRequests: 1, windowMs: 60_000 }
    const r = rateLimit('user-reset-ts', config)
    expect(r.resetAt).toBeGreaterThan(Date.now())
    expect(r.resetAt).toBeLessThanOrEqual(Date.now() + 60_000)
  })
})

describe('guardRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna null cuando hay cuota (caller continúa)', () => {
    const result = guardRateLimit('guard-ok', { maxRequests: 5, windowMs: 60_000 })
    expect(result).toBeNull()
  })

  it('retorna Response 429 cuando excede cuota', async () => {
    const config = { maxRequests: 1, windowMs: 60_000 }
    // Primera pasa
    const first = guardRateLimit('guard-overflow', config)
    expect(first).toBeNull()
    // Segunda bloquea
    const blocked = guardRateLimit('guard-overflow', config)
    expect(blocked).not.toBeNull()
    expect(blocked!.status).toBe(429)
  })

  it('respuesta 429 tiene cuerpo JSON con code RATE_LIMITED', async () => {
    const config = { maxRequests: 1, windowMs: 60_000 }
    guardRateLimit('guard-json', config)
    const blocked = guardRateLimit('guard-json', config)!
    const json = await blocked.json()
    expect(json.ok).toBe(false)
    expect(json.code).toBe('RATE_LIMITED')
    expect(typeof json.error).toBe('string')
  })

  it('respuesta 429 incluye header Retry-After', () => {
    const config = { maxRequests: 1, windowMs: 60_000 }
    guardRateLimit('guard-retry', config)
    const blocked = guardRateLimit('guard-retry', config)!
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0)
  })

  it('acepta mensaje custom', async () => {
    const config = { maxRequests: 1, windowMs: 60_000 }
    guardRateLimit('guard-msg', config)
    const blocked = guardRateLimit('guard-msg', config, 'Demasiados posts')!
    const json = await blocked.json()
    expect(json.error).toBe('Demasiados posts')
  })

  it('Content-Type es application/json', () => {
    const config = { maxRequests: 1, windowMs: 60_000 }
    guardRateLimit('guard-ct', config)
    const blocked = guardRateLimit('guard-ct', config)!
    expect(blocked.headers.get('Content-Type')).toBe('application/json')
  })
})

describe('rateLimitHeaders', () => {
  it('incluye X-RateLimit-Remaining y Reset cuando success', () => {
    const headers = rateLimitHeaders({ success: true, remaining: 5, resetAt: 1000 })
    expect(headers['X-RateLimit-Remaining']).toBe('5')
    expect(headers['X-RateLimit-Reset']).toBe('1')
    expect(headers['Retry-After']).toBeUndefined()
  })

  it('incluye Retry-After cuando success=false', () => {
    const resetAt = Date.now() + 30_000
    const headers = rateLimitHeaders({ success: false, remaining: 0, resetAt })
    expect(headers['Retry-After']).toBeDefined()
    expect(Number(headers['Retry-After'])).toBeGreaterThanOrEqual(29)
    expect(Number(headers['Retry-After'])).toBeLessThanOrEqual(30)
  })
})

describe('RATE_LIMITS presets (invariantes)', () => {
  it('auth: 5 intentos por 15min (anti brute-force login)', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThanOrEqual(5)
    expect(RATE_LIMITS.auth.windowMs).toBeGreaterThanOrEqual(15 * 60 * 1000)
  })

  it('sensitive: muy estricto (anti password-spray)', () => {
    expect(RATE_LIMITS.sensitive.maxRequests).toBeLessThanOrEqual(3)
  })

  it('api: razonable para uso normal', () => {
    expect(RATE_LIMITS.api.maxRequests).toBeGreaterThanOrEqual(60)
    expect(RATE_LIMITS.api.maxRequests).toBeLessThanOrEqual(500)
  })
})
