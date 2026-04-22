// V33 — tests de helpers puros del Studio
import { describe, it, expect } from 'vitest'
import {
  slugify,
  classifyDriveFolder,
  fuzzyMatchProduct,
  evaluateBudget,
  autoGradeAsset,
  IMAGE_LAB_COSTS,
  VIDEO_COST_PER_SECOND,
} from '../helpers'

describe('slugify', () => {
  it('acentos quitados', () => {
    expect(slugify('TÉ CHINO')).toBe('te-chino')
    expect(slugify('Colágeno Premium')).toBe('colageno-premium')
  })

  it('espacios multiples colapsan', () => {
    expect(slugify('Manual  de   Marca')).toBe('manual-de-marca')
  })

  it('caracteres especiales removidos', () => {
    expect(slugify('12 Colágenos + Omega / 1200g')).toBe('12-colagenos-omega-1200g')
  })

  it('trim guiones al inicio y final', () => {
    expect(slugify('---hola---')).toBe('hola')
  })

  it('string vacio devuelve vacio', () => {
    expect(slugify('')).toBe('')
    expect(slugify('   ')).toBe('')
  })
})

describe('classifyDriveFolder', () => {
  it('clasifica carpetas Vitalcom conocidas', () => {
    expect(classifyDriveFolder('Reel Lanzamiento').type).toBe('REEL_MASTER')
    expect(classifyDriveFolder('Mockups').type).toBe('MOCKUP')
    expect(classifyDriveFolder('Fotos reales').type).toBe('LIFESTYLE')
    expect(classifyDriveFolder('Fotos reseña').type).toBe('REVIEW_PHOTO')
    expect(classifyDriveFolder('Landing').type).toBe('LANDING_HERO')
    expect(classifyDriveFolder('EBOOK').type).toBe('EBOOK')
    expect(classifyDriveFolder('Manual de Marca').type).toBe('BRAND_MANUAL')
  })

  it('carpeta desconocida cae a GALLERY', () => {
    expect(classifyDriveFolder('Carpeta Random').type).toBe('GALLERY')
  })

  it('asigna angle cuando procede', () => {
    expect(classifyDriveFolder('Fotos reseña').angle).toBe('SOCIAL_PROOF')
    expect(classifyDriveFolder('Reel Lanzamiento').angle).toBe('ASPIRATION')
    expect(classifyDriveFolder('Antes despues').angle).toBe('TRANSFORMATION')
  })

  it('default format coherente con el tipo', () => {
    expect(classifyDriveFolder('Reel Lanzamiento').defaultFormat).toBe('STORY_9x16')
    expect(classifyDriveFolder('Landing').defaultFormat).toBe('LANDSCAPE_16x9')
    expect(classifyDriveFolder('EBOOK').defaultFormat).toBe('A4_PORTRAIT')
  })
})

describe('fuzzyMatchProduct', () => {
  const catalog = [
    { id: '1', name: 'Té Chino Premium', slug: 'te-chino-premium' },
    { id: '2', name: 'Colágeno 1200mg', slug: 'colageno-1200mg' },
    { id: '3', name: 'Omega 3 Puro', slug: 'omega-3-puro' },
  ]

  it('exact slug match score 1', () => {
    const r = fuzzyMatchProduct('te-chino-premium', catalog)
    expect(r.strategy).toBe('exact-slug')
    expect(r.candidate?.id).toBe('1')
    expect(r.score).toBe(1)
  })

  it('exact name match score 0.95 (cuando slug difiere del name)', () => {
    // Producto cuyo slug fue customizado y no coincide con slugify(name)
    const cat = [{ id: 'x', name: 'Producto Especial', slug: 'abc-123' }]
    const r = fuzzyMatchProduct('Producto Especial', cat)
    expect(r.strategy).toBe('exact-name')
    expect(r.candidate?.id).toBe('x')
  })

  it('contains match (folder subset de producto)', () => {
    const r = fuzzyMatchProduct('TÉ CHINO', catalog)
    expect(r.strategy).toBe('contains')
    expect(r.candidate?.id).toBe('1')
    expect(r.score).toBeGreaterThan(0.6)
  })

  it('contains match (producto subset de folder)', () => {
    const r = fuzzyMatchProduct('Colágeno 1200mg Extra Fuerte', catalog)
    expect(r.candidate?.id).toBe('2')
  })

  it('token overlap para nombres parciales', () => {
    const r = fuzzyMatchProduct('Omega Natural', catalog)
    expect(r.candidate?.id).toBe('3')
    expect(r.strategy).toBe('overlap')
  })

  it('sin match devuelve null', () => {
    const r = fuzzyMatchProduct('producto inexistente totalmente', catalog)
    expect(r.candidate).toBeNull()
    expect(r.score).toBe(0)
  })

  it('folder vacio devuelve null', () => {
    const r = fuzzyMatchProduct('', catalog)
    expect(r.candidate).toBeNull()
  })
})

describe('evaluateBudget', () => {
  const now = new Date('2026-04-22T12:00:00Z')
  const future = new Date('2026-04-23T00:00:00Z')
  const futureMonth = new Date('2026-05-01T00:00:00Z')

  const validState = {
    dailyLimitUsd: 20,
    monthlyLimitUsd: 300,
    usedTodayUsd: 5,
    usedMonthUsd: 50,
    resetDaily: future,
    resetMonthly: futureMonth,
  }

  it('permite si cabe en ambos limites', () => {
    const r = evaluateBudget(validState, 10, now)
    expect(r.allowed).toBe(true)
    expect(r.remainingTodayUsd).toBe(15)
    expect(r.remainingMonthUsd).toBe(250)
  })

  it('bloquea si excede diario', () => {
    const r = evaluateBudget(validState, 18, now)
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/DAILY_LIMIT_EXCEEDED/)
  })

  it('bloquea si excede mensual (aunque diario OK)', () => {
    const state = { ...validState, usedMonthUsd: 295 }
    const r = evaluateBudget(state, 10, now)
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/MONTHLY_LIMIT_EXCEEDED/)
  })

  it('aplica reset diario si la fecha paso', () => {
    const past = new Date('2026-04-21T00:00:00Z') // ayer
    const state = { ...validState, resetDaily: past, usedTodayUsd: 18 }
    const r = evaluateBudget(state, 10, now)
    expect(r.allowed).toBe(true)
    expect(r.appliedResets.daily).toBe(true)
    expect(r.remainingTodayUsd).toBe(20) // reset a 0, todo el limit disponible
  })

  it('aplica reset mensual si paso', () => {
    const past = new Date('2026-04-01T00:00:00Z')
    const state = { ...validState, resetMonthly: past, usedMonthUsd: 295 }
    const r = evaluateBudget(state, 10, now)
    expect(r.appliedResets.monthly).toBe(true)
    expect(r.remainingMonthUsd).toBe(300)
  })

  it('costo negativo bloquea', () => {
    const r = evaluateBudget(validState, -5, now)
    expect(r.allowed).toBe(false)
    expect(r.reason).toBe('NEGATIVE_COST')
  })

  it('costo 0 permitido', () => {
    const r = evaluateBudget(validState, 0, now)
    expect(r.allowed).toBe(true)
  })
})

describe('autoGradeAsset', () => {
  it('A_PREMIUM con alta res + metadata', () => {
    const r = autoGradeAsset({
      width: 1920, height: 1080,
      altText: 'Foto del producto en uso',
      angle: 'LIFESTYLE' as never, // actually SalesAngle value
      type: 'HERO',
    })
    // LIFESTYLE no es SalesAngle válido, usar uno real
    const r2 = autoGradeAsset({
      width: 1920, height: 1080,
      altText: 'Foto del producto',
      angle: 'ASPIRATION',
      type: 'HERO',
    })
    expect(r2).toBe('A_PREMIUM')
  })

  it('B_STANDARD sin metadata completa', () => {
    expect(
      autoGradeAsset({ width: 1080, height: 1080, type: 'HERO' }),
    ).toBe('B_STANDARD')
  })

  it('C_ACCEPTABLE con res baja', () => {
    expect(
      autoGradeAsset({ width: 600, height: 600, type: 'GALLERY' }),
    ).toBe('C_ACCEPTABLE')
  })

  it('UNRATED si faltan dimensiones', () => {
    expect(autoGradeAsset({ type: 'HERO' })).toBe('UNRATED')
  })

  it('EBOOK grande → B_STANDARD', () => {
    expect(autoGradeAsset({ type: 'EBOOK', fileSizeBytes: 500_000 })).toBe('B_STANDARD')
  })

  it('EBOOK chico → C_ACCEPTABLE', () => {
    expect(autoGradeAsset({ type: 'EBOOK', fileSizeBytes: 50_000 })).toBe('C_ACCEPTABLE')
  })
})

describe('cost tables', () => {
  it('IMAGE_LAB_COSTS tiene 9 ops', () => {
    expect(Object.keys(IMAGE_LAB_COSTS).length).toBe(9)
  })

  it('VideoGen Pika es el mas barato', () => {
    expect(VIDEO_COST_PER_SECOND.PIKA_LABS).toBeLessThan(VIDEO_COST_PER_SECOND.RUNWAY_GEN3)
    expect(VIDEO_COST_PER_SECOND.PIKA_LABS).toBeLessThan(VIDEO_COST_PER_SECOND.SORA_OPENAI)
  })

  it('todos los costos son positivos', () => {
    for (const cost of Object.values(IMAGE_LAB_COSTS)) {
      expect(cost).toBeGreaterThan(0)
    }
    for (const cost of Object.values(VIDEO_COST_PER_SECOND)) {
      expect(cost).toBeGreaterThan(0)
    }
  })
})
