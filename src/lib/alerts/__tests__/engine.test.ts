// V31 — tests del engine de alertas (funciones puras)
import { describe, it, expect } from 'vitest'
import { isOnCooldown } from '../engine'

describe('isOnCooldown', () => {
  it('false si nunca se disparó', () => {
    expect(isOnCooldown({ lastTriggeredAt: null, cooldownMinutes: 60 })).toBe(false)
  })

  it('true si se disparó hace menos del cooldown', () => {
    const now = new Date('2026-04-21T12:00:00Z')
    const lastTriggeredAt = new Date('2026-04-21T11:30:00Z') // 30 min antes
    expect(
      isOnCooldown({ lastTriggeredAt, cooldownMinutes: 60 }, now),
    ).toBe(true)
  })

  it('false si se disparó exactamente hace cooldown minutos', () => {
    const now = new Date('2026-04-21T12:00:00Z')
    const lastTriggeredAt = new Date('2026-04-21T11:00:00Z') // 60 min antes
    expect(
      isOnCooldown({ lastTriggeredAt, cooldownMinutes: 60 }, now),
    ).toBe(false)
  })

  it('false si pasó más tiempo que el cooldown', () => {
    const now = new Date('2026-04-21T12:00:00Z')
    const lastTriggeredAt = new Date('2026-04-21T10:00:00Z') // 2h antes
    expect(
      isOnCooldown({ lastTriggeredAt, cooldownMinutes: 60 }, now),
    ).toBe(false)
  })

  it('usa Date.now() si no se pasa now', () => {
    const lastTriggeredAt = new Date(Date.now() - 30 * 60_000) // 30 min antes
    expect(isOnCooldown({ lastTriggeredAt, cooldownMinutes: 60 })).toBe(true)

    const farPast = new Date(Date.now() - 2 * 3_600_000) // 2h antes
    expect(isOnCooldown({ lastTriggeredAt: farPast, cooldownMinutes: 60 })).toBe(false)
  })

  it('cooldown de 0 nunca bloquea', () => {
    const lastTriggeredAt = new Date()
    expect(
      isOnCooldown({ lastTriggeredAt, cooldownMinutes: 0 }),
    ).toBe(false)
  })

  it('cooldown de 24h (1440min) bloquea si disparó hace 23h', () => {
    const now = new Date('2026-04-21T12:00:00Z')
    const lastTriggeredAt = new Date('2026-04-20T13:00:00Z') // 23h antes
    expect(
      isOnCooldown({ lastTriggeredAt, cooldownMinutes: 1440 }, now),
    ).toBe(true)
  })

  it('cooldown de 24h no bloquea si disparó hace 25h', () => {
    const now = new Date('2026-04-21T12:00:00Z')
    const lastTriggeredAt = new Date('2026-04-20T11:00:00Z') // 25h antes
    expect(
      isOnCooldown({ lastTriggeredAt, cooldownMinutes: 1440 }, now),
    ).toBe(false)
  })
})
