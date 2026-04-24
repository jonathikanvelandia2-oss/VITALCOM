// V42 — Tests del onboarding.

import { describe, it, expect } from 'vitest'
import {
  buildSteps,
  computeProgress,
  shouldShowWidget,
  getMotivationMessage,
  type UserCompletionFlags,
} from '../helpers'

const EMPTY_FLAGS: UserCompletionFlags = {
  hasAvatar: false,
  hasBio: false,
  hasWhatsapp: false,
  hasStore: false,
  hasProductSync: false,
  hasCalculation: false,
  hasChannelClick: false,
  hasPost: false,
  hasOrder: false,
}

const ALL_FLAGS: UserCompletionFlags = {
  hasAvatar: true,
  hasBio: true,
  hasWhatsapp: true,
  hasStore: true,
  hasProductSync: true,
  hasCalculation: true,
  hasChannelClick: true,
  hasPost: true,
  hasOrder: true,
}

// ── buildSteps ──
describe('buildSteps', () => {
  it('retorna 7 pasos', () => {
    expect(buildSteps(EMPTY_FLAGS)).toHaveLength(7)
  })

  it('profile requiere avatar + bio + whatsapp (AND)', () => {
    const steps = buildSteps({ ...EMPTY_FLAGS, hasAvatar: true, hasBio: true, hasWhatsapp: false })
    const profile = steps.find((s) => s.key === 'profile')!
    expect(profile.completed).toBe(false)
  })

  it('profile completo cuando los 3 flags de perfil están en true', () => {
    const steps = buildSteps({
      ...EMPTY_FLAGS,
      hasAvatar: true,
      hasBio: true,
      hasWhatsapp: true,
    })
    expect(steps.find((s) => s.key === 'profile')!.completed).toBe(true)
  })

  it('hay exactamente 4 pasos required', () => {
    const steps = buildSteps(EMPTY_FLAGS)
    expect(steps.filter((s) => s.required)).toHaveLength(4)
  })

  it('todos los pasos tienen href y points positivos', () => {
    const steps = buildSteps(EMPTY_FLAGS)
    for (const s of steps) {
      expect(s.cta.href).toMatch(/^\//)
      expect(s.points).toBeGreaterThan(0)
    }
  })

  it('todos los keys son únicos', () => {
    const steps = buildSteps(EMPTY_FLAGS)
    const keys = steps.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

// ── computeProgress ──
describe('computeProgress', () => {
  it('0% cuando no hay pasos completos', () => {
    const progress = computeProgress(buildSteps(EMPTY_FLAGS))
    expect(progress.percent).toBe(0)
    expect(progress.percentRequired).toBe(0)
    expect(progress.allComplete).toBe(false)
    expect(progress.allRequiredComplete).toBe(false)
    expect(progress.totalPointsEarned).toBe(0)
  })

  it('100% cuando todo completo', () => {
    const progress = computeProgress(buildSteps(ALL_FLAGS))
    expect(progress.percent).toBe(100)
    expect(progress.percentRequired).toBe(100)
    expect(progress.allComplete).toBe(true)
    expect(progress.allRequiredComplete).toBe(true)
    expect(progress.nextStep).toBe(null)
  })

  it('percentRequired 100 sin que percent general llegue a 100', () => {
    // Completar solo los 4 required
    const flags: UserCompletionFlags = {
      ...EMPTY_FLAGS,
      hasAvatar: true, hasBio: true, hasWhatsapp: true,
      hasChannelClick: true,
      hasCalculation: true,
      hasPost: true,
    }
    const progress = computeProgress(buildSteps(flags))
    expect(progress.percentRequired).toBe(100)
    expect(progress.percent).toBeLessThan(100)
    expect(progress.allRequiredComplete).toBe(true)
    expect(progress.allComplete).toBe(false)
  })

  it('nextStep es el primer paso incompleto', () => {
    const flags: UserCompletionFlags = {
      ...EMPTY_FLAGS,
      hasAvatar: true, hasBio: true, hasWhatsapp: true,
      // profile completo, los demás pendientes
    }
    const progress = computeProgress(buildSteps(flags))
    expect(progress.nextStep?.key).toBe('whatsapp')
  })

  it('totalPointsEarned acumula solo de pasos completos', () => {
    const flags: UserCompletionFlags = {
      ...EMPTY_FLAGS,
      hasCalculation: true, // 10 puntos
      hasPost: true, // 20 puntos
    }
    const progress = computeProgress(buildSteps(flags))
    expect(progress.totalPointsEarned).toBe(30)
    expect(progress.totalPointsAvailable).toBe(235)
  })
})

// ── shouldShowWidget ──
describe('shouldShowWidget', () => {
  const now = new Date('2026-04-24T12:00:00Z')
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000)

  it('muestra para COMMUNITY nuevo sin dismiss', () => {
    expect(
      shouldShowWidget({
        role: 'COMMUNITY',
        createdAt: tenDaysAgo,
        dismissedAt: null,
        allRequiredComplete: false,
        now,
      }),
    ).toBe(true)
  })

  it('oculta cuando el user hizo dismiss', () => {
    expect(
      shouldShowWidget({
        role: 'COMMUNITY',
        createdAt: tenDaysAgo,
        dismissedAt: new Date(),
        allRequiredComplete: false,
        now,
      }),
    ).toBe(false)
  })

  it('oculta siempre para staff interno', () => {
    for (const role of ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE']) {
      expect(
        shouldShowWidget({
          role,
          createdAt: tenDaysAgo,
          dismissedAt: null,
          allRequiredComplete: false,
          now,
        }),
      ).toBe(false)
    }
  })

  it('muestra aún con required completos si está en primeros 30 días', () => {
    expect(
      shouldShowWidget({
        role: 'COMMUNITY',
        createdAt: tenDaysAgo,
        dismissedAt: null,
        allRequiredComplete: true,
        now,
      }),
    ).toBe(true)
  })

  it('oculta después de 30 días si required completos', () => {
    expect(
      shouldShowWidget({
        role: 'COMMUNITY',
        createdAt: fiftyDaysAgo,
        dismissedAt: null,
        allRequiredComplete: true,
        now,
      }),
    ).toBe(false)
  })

  it('muestra después de 30 días si required incompletos', () => {
    expect(
      shouldShowWidget({
        role: 'COMMUNITY',
        createdAt: fiftyDaysAgo,
        dismissedAt: null,
        allRequiredComplete: false,
        now,
      }),
    ).toBe(true)
  })

  it('funciona para DROPSHIPPER igual que COMMUNITY', () => {
    expect(
      shouldShowWidget({
        role: 'DROPSHIPPER',
        createdAt: tenDaysAgo,
        dismissedAt: null,
        allRequiredComplete: false,
        now,
      }),
    ).toBe(true)
  })
})

// ── getMotivationMessage ──
describe('getMotivationMessage', () => {
  it('celebra cuando todo está completo', () => {
    const progress = computeProgress(buildSteps(ALL_FLAGS))
    expect(getMotivationMessage(progress)).toContain('Vitalcommer completo')
  })

  it('mensaje de inicio cuando no hay nada completo', () => {
    const progress = computeProgress(buildSteps(EMPTY_FLAGS))
    expect(getMotivationMessage(progress)).toContain('Bienvenido')
  })

  it('indica setup mínimo listo cuando required completos pero no todos', () => {
    const flags: UserCompletionFlags = {
      ...EMPTY_FLAGS,
      hasAvatar: true, hasBio: true, hasWhatsapp: true,
      hasChannelClick: true,
      hasCalculation: true,
      hasPost: true,
    }
    const progress = computeProgress(buildSteps(flags))
    expect(getMotivationMessage(progress)).toContain('Setup mínimo')
  })

  it('muestra progreso numérico en estado intermedio', () => {
    const flags: UserCompletionFlags = {
      ...EMPTY_FLAGS,
      hasCalculation: true,
    }
    const progress = computeProgress(buildSteps(flags))
    const msg = getMotivationMessage(progress)
    expect(msg).toMatch(/1 de 4/)
  })
})
