// V37 — Tests helpers de fulfillment.
// Validan transiciones de estado, generación de URLs de tracking,
// estimación de entrega, normalización de guías y RBAC.
// Todo puro, sin Prisma ni HTTP.

import { describe, it, expect } from 'vitest'
import {
  canTransitionTo,
  nextStatusesFor,
  isTerminalStatus,
  ORDER_TRANSITIONS,
  getCarriersForCountry,
  findCarrier,
  buildTrackingUrl,
  estimateDeliveryWindow,
  estimateDeliveryDate,
  normalizeTrackingCode,
  canFulfillManually,
  canFulfillWithProvider,
  buildFulfillmentSnapshot,
  CARRIERS,
} from '../helpers'

// ── Transiciones ──────────────────────────────────────
describe('ORDER_TRANSITIONS', () => {
  it('tiene entrada para los 7 estados conocidos', () => {
    const expected = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED']
    for (const s of expected) {
      expect(ORDER_TRANSITIONS).toHaveProperty(s)
    }
  })
})

describe('canTransitionTo', () => {
  it('PENDING → CONFIRMED válido', () => {
    expect(canTransitionTo('PENDING', 'CONFIRMED')).toBe(true)
  })
  it('PENDING → DELIVERED inválido', () => {
    expect(canTransitionTo('PENDING', 'DELIVERED')).toBe(false)
  })
  it('PROCESSING → DISPATCHED válido', () => {
    expect(canTransitionTo('PROCESSING', 'DISPATCHED')).toBe(true)
  })
  it('DISPATCHED → DELIVERED válido', () => {
    expect(canTransitionTo('DISPATCHED', 'DELIVERED')).toBe(true)
  })
  it('CANCELLED es terminal — ninguna transición válida', () => {
    expect(canTransitionTo('CANCELLED', 'PENDING')).toBe(false)
    expect(canTransitionTo('CANCELLED', 'RETURNED')).toBe(false)
  })
  it('RETURNED es terminal', () => {
    expect(canTransitionTo('RETURNED', 'DELIVERED')).toBe(false)
  })
})

describe('nextStatusesFor', () => {
  it('PROCESSING permite DISPATCHED y CANCELLED', () => {
    const next = nextStatusesFor('PROCESSING')
    expect(next).toEqual(['DISPATCHED', 'CANCELLED'])
  })
  it('DELIVERED solo permite RETURNED', () => {
    expect(nextStatusesFor('DELIVERED')).toEqual(['RETURNED'])
  })
  it('estado terminal devuelve array vacío', () => {
    expect(nextStatusesFor('CANCELLED')).toEqual([])
  })
})

describe('isTerminalStatus', () => {
  it('CANCELLED y RETURNED son terminales', () => {
    expect(isTerminalStatus('CANCELLED')).toBe(true)
    expect(isTerminalStatus('RETURNED')).toBe(true)
  })
  it('PENDING/CONFIRMED/PROCESSING/DISPATCHED/DELIVERED no son terminales', () => {
    expect(isTerminalStatus('PENDING')).toBe(false)
    expect(isTerminalStatus('DISPATCHED')).toBe(false)
    expect(isTerminalStatus('DELIVERED')).toBe(false)
  })
})

// ── Carriers ──────────────────────────────────────────
describe('CARRIERS constante', () => {
  it('todos los carriers tienen key única', () => {
    const keys = CARRIERS.map((c) => c.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('todos incluyen {{code}} en el template', () => {
    for (const c of CARRIERS) {
      expect(c.trackingUrlTemplate).toContain('{{code}}')
    }
  })
  it('al menos 3 carriers por cada país', () => {
    for (const country of ['CO', 'EC', 'GT', 'CL'] as const) {
      const forCountry = CARRIERS.filter((c) => c.country === country)
      expect(forCountry.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('getCarriersForCountry', () => {
  it('Colombia devuelve carriers con country=CO', () => {
    const list = getCarriersForCountry('CO')
    expect(list.length).toBeGreaterThan(0)
    for (const c of list) expect(c.country).toBe('CO')
  })
  it('cada país tiene su propia lista', () => {
    expect(getCarriersForCountry('EC').every((c) => c.country === 'EC')).toBe(true)
    expect(getCarriersForCountry('GT').every((c) => c.country === 'GT')).toBe(true)
    expect(getCarriersForCountry('CL').every((c) => c.country === 'CL')).toBe(true)
  })
})

describe('findCarrier', () => {
  it('encuentra carrier por key', () => {
    const c = findCarrier('servientrega-co')
    expect(c).not.toBeNull()
    expect(c?.label).toBe('Servientrega')
  })
  it('devuelve null si no existe', () => {
    expect(findCarrier('inexistente-xx')).toBeNull()
  })
})

// ── Tracking URLs ─────────────────────────────────────
describe('buildTrackingUrl', () => {
  it('construye URL con código encoded', () => {
    const url = buildTrackingUrl('servientrega-co', 'ABC123')
    expect(url).toContain('guia=ABC123')
    expect(url).toContain('servientrega.com')
  })
  it('escapa caracteres especiales', () => {
    const url = buildTrackingUrl('coordinadora-co', 'AB 12&X')
    expect(url).toContain('AB%2012%26X')
  })
  it('devuelve null si falta carrier', () => {
    expect(buildTrackingUrl(null, 'ABC')).toBeNull()
  })
  it('devuelve null si falta código', () => {
    expect(buildTrackingUrl('servientrega-co', null)).toBeNull()
  })
  it('devuelve null si carrier no existe', () => {
    expect(buildTrackingUrl('fake-carrier-xx', 'ABC')).toBeNull()
  })
})

// ── Delivery estimate ─────────────────────────────────
describe('estimateDeliveryWindow', () => {
  it('Colombia 2-5 días', () => {
    expect(estimateDeliveryWindow('CO')).toEqual({ min: 2, max: 5 })
  })
  it('Chile 4-8 días (el más lejano)', () => {
    expect(estimateDeliveryWindow('CL')).toEqual({ min: 4, max: 8 })
  })
})

describe('estimateDeliveryDate', () => {
  it('suma días correctamente desde fecha dada', () => {
    const from = new Date('2026-04-23T00:00:00Z')
    const { minDate, maxDate } = estimateDeliveryDate('CO', from)
    // CO: 2-5 días
    const minDiff = (minDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
    const maxDiff = (maxDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
    expect(minDiff).toBe(2)
    expect(maxDiff).toBe(5)
  })
  it('no muta la fecha de entrada', () => {
    const from = new Date('2026-04-23T00:00:00Z')
    const original = from.getTime()
    estimateDeliveryDate('CO', from)
    expect(from.getTime()).toBe(original)
  })
})

// ── Normalización de guía ─────────────────────────────
describe('normalizeTrackingCode', () => {
  it('uppercase y trim', () => {
    expect(normalizeTrackingCode('  abc123  ')).toBe('ABC123')
  })
  it('preserva guiones', () => {
    expect(normalizeTrackingCode('vc-co-2026-001')).toBe('VC-CO-2026-001')
  })
  it('elimina espacios intermedios', () => {
    expect(normalizeTrackingCode('ABC 123 XYZ')).toBe('ABC123XYZ')
  })
  it('elimina caracteres especiales', () => {
    expect(normalizeTrackingCode('ABC#123@X')).toBe('ABC123X')
  })
})

// ── RBAC ──────────────────────────────────────────────
describe('canFulfillManually', () => {
  it('staff puede fulfillear manualmente', () => {
    expect(canFulfillManually('SUPERADMIN')).toBe(true)
    expect(canFulfillManually('ADMIN')).toBe(true)
    expect(canFulfillManually('MANAGER_AREA')).toBe(true)
    expect(canFulfillManually('EMPLOYEE')).toBe(true)
  })
  it('community/dropshipper NO puede', () => {
    expect(canFulfillManually('COMMUNITY')).toBe(false)
    expect(canFulfillManually('DROPSHIPPER')).toBe(false)
  })
})

describe('canFulfillWithProvider', () => {
  it('solo SUPERADMIN y ADMIN pueden disparar providers externos', () => {
    expect(canFulfillWithProvider('SUPERADMIN')).toBe(true)
    expect(canFulfillWithProvider('ADMIN')).toBe(true)
    expect(canFulfillWithProvider('MANAGER_AREA')).toBe(false)
    expect(canFulfillWithProvider('EMPLOYEE')).toBe(false)
  })
})

// ── Snapshot ──────────────────────────────────────────
describe('buildFulfillmentSnapshot', () => {
  it('snapshot básico con tracking y fecha', () => {
    const snap = buildFulfillmentSnapshot({
      status: 'DISPATCHED',
      mode: 'MANUAL',
      country: 'CO',
      trackingCode: 'ABC123',
      carrier: 'servientrega-co',
      fulfilledAt: new Date('2026-04-23T10:00:00Z'),
    })
    expect(snap.status).toBe('DISPATCHED')
    expect(snap.carrierLabel).toBe('Servientrega')
    expect(snap.trackingUrl).toContain('guia=ABC123')
    expect(snap.nextActions).toEqual(['DELIVERED', 'RETURNED'])
    expect(snap.isTerminal).toBe(false)
    expect(snap.estimatedMinDate).not.toBeNull()
  })

  it('snapshot sin fulfilledAt no genera estimados', () => {
    const snap = buildFulfillmentSnapshot({
      status: 'PROCESSING',
      mode: 'MANUAL',
      country: 'CO',
      trackingCode: null,
      carrier: null,
      fulfilledAt: null,
    })
    expect(snap.estimatedMinDate).toBeNull()
    expect(snap.estimatedMaxDate).toBeNull()
    expect(snap.trackingUrl).toBeNull()
    expect(snap.fulfilledAt).toBeNull()
  })

  it('snapshot terminal marca isTerminal true y sin next actions', () => {
    const snap = buildFulfillmentSnapshot({
      status: 'CANCELLED',
      mode: 'MANUAL',
      country: 'CO',
      trackingCode: null,
      carrier: null,
      fulfilledAt: null,
    })
    expect(snap.isTerminal).toBe(true)
    expect(snap.nextActions).toEqual([])
  })

  it('si carrier no está en catálogo, usa string raw como label', () => {
    const snap = buildFulfillmentSnapshot({
      status: 'DISPATCHED',
      mode: 'MANUAL',
      country: 'CO',
      trackingCode: 'X1',
      carrier: 'Mi transporte propio',
      fulfilledAt: new Date(),
    })
    expect(snap.carrierLabel).toBe('Mi transporte propio')
    expect(snap.trackingUrl).toBeNull() // no template para este carrier
  })
})
