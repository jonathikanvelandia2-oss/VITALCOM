// V38 — Tests helpers de canales Vitalcom.
// Validan normalización de teléfonos, URLs wa.me, invites, agrupación,
// validación de input y agregación de clicks. Todo puro, sin Prisma.

import { describe, it, expect } from 'vitest'
import {
  normalizePhone,
  isValidE164,
  phoneMatchesCountry,
  buildWaMeUrl,
  isValidWhatsAppInvite,
  resolveChannelUrl,
  groupChannelsForUI,
  filterChannelsForCountry,
  validateChannelInput,
  aggregateClicks,
  COUNTRY_PHONE_PREFIX,
  type ChannelLike,
} from '../helpers'

// ── Factory ───────────────────────────────────────────
function makeChannel(overrides: Partial<ChannelLike> = {}): ChannelLike {
  const base: ChannelLike = {
    id: 'c1',
    type: 'STAFF_DM',
    area: null,
    label: 'Soporte',
    description: null,
    phone: '573001234567',
    inviteUrl: null,
    defaultMessage: null,
    icon: null,
    country: null,
    active: true,
    order: 0,
  }
  return { ...base, ...overrides }
}

// ── normalizePhone ────────────────────────────────────
describe('normalizePhone', () => {
  it('elimina espacios y guiones', () => {
    expect(normalizePhone('+57 300 123 4567')).toBe('573001234567')
  })
  it('elimina paréntesis y otros caracteres', () => {
    expect(normalizePhone('(+593) 99-123-4567')).toBe('593991234567')
  })
  it('preserva solo dígitos', () => {
    expect(normalizePhone('57-300-abc-1234-567')).toBe('573001234567')
  })
})

// ── isValidE164 ───────────────────────────────────────
describe('isValidE164', () => {
  it('acepta números LATAM válidos', () => {
    expect(isValidE164('573001234567')).toBe(true)
    expect(isValidE164('593991234567')).toBe(true)
    expect(isValidE164('50212345678')).toBe(true)
    expect(isValidE164('56912345678')).toBe(true)
  })
  it('rechaza números con 0 al inicio', () => {
    expect(isValidE164('0573001234567')).toBe(false)
  })
  it('rechaza números muy cortos o muy largos', () => {
    expect(isValidE164('1234')).toBe(false)
    expect(isValidE164('12345678901234567890')).toBe(false)
  })
  it('normaliza antes de validar', () => {
    expect(isValidE164('+57 300 123 4567')).toBe(true)
  })
})

// ── phoneMatchesCountry ──────────────────────────────
describe('phoneMatchesCountry', () => {
  it('CO phone matches CO', () => {
    expect(phoneMatchesCountry('573001234567', 'CO')).toBe(true)
  })
  it('CO phone does not match CL', () => {
    expect(phoneMatchesCountry('573001234567', 'CL')).toBe(false)
  })
  it('todos los países Vitalcom tienen prefix definido', () => {
    expect(COUNTRY_PHONE_PREFIX.CO).toBeTruthy()
    expect(COUNTRY_PHONE_PREFIX.EC).toBeTruthy()
    expect(COUNTRY_PHONE_PREFIX.GT).toBeTruthy()
    expect(COUNTRY_PHONE_PREFIX.CL).toBeTruthy()
  })
})

// ── buildWaMeUrl ──────────────────────────────────────
describe('buildWaMeUrl', () => {
  it('construye URL básica', () => {
    expect(buildWaMeUrl('573001234567')).toBe('https://wa.me/573001234567')
  })
  it('agrega text encoded cuando hay mensaje', () => {
    const url = buildWaMeUrl('573001234567', 'Hola quiero ayuda')
    expect(url).toBe('https://wa.me/573001234567?text=Hola%20quiero%20ayuda')
  })
  it('recorta mensajes muy largos', () => {
    const long = 'a'.repeat(2000)
    const url = buildWaMeUrl('573001234567', long)!
    expect(url.length).toBeLessThan(1200)
  })
  it('devuelve null con teléfono nulo', () => {
    expect(buildWaMeUrl(null)).toBeNull()
  })
  it('devuelve null con teléfono inválido', () => {
    expect(buildWaMeUrl('abc')).toBeNull()
  })
  it('normaliza teléfono antes de construir URL', () => {
    expect(buildWaMeUrl('+57 300 123 4567')).toBe('https://wa.me/573001234567')
  })
})

// ── isValidWhatsAppInvite ────────────────────────────
describe('isValidWhatsAppInvite', () => {
  it('acepta chat.whatsapp.com', () => {
    expect(isValidWhatsAppInvite('https://chat.whatsapp.com/ABC123xyz')).toBe(true)
  })
  it('acepta whatsapp.com/channel', () => {
    expect(isValidWhatsAppInvite('https://whatsapp.com/channel/XYZ')).toBe(true)
  })
  it('rechaza http', () => {
    expect(isValidWhatsAppInvite('http://chat.whatsapp.com/ABC')).toBe(false)
  })
  it('rechaza otros dominios', () => {
    expect(isValidWhatsAppInvite('https://example.com/fake-invite')).toBe(false)
  })
  it('rechaza strings vacíos', () => {
    expect(isValidWhatsAppInvite('')).toBe(false)
  })
})

// ── resolveChannelUrl ────────────────────────────────
describe('resolveChannelUrl', () => {
  it('STAFF_DM → wa.me con mensaje', () => {
    const ch = makeChannel({ type: 'STAFF_DM', defaultMessage: 'Hola soporte' })
    expect(resolveChannelUrl(ch)).toContain('wa.me/573001234567')
    expect(resolveChannelUrl(ch)).toContain('text=')
  })
  it('BROADCAST_LIST → wa.me con mensaje default si no hay custom', () => {
    const ch = makeChannel({ type: 'BROADCAST_LIST', defaultMessage: null })
    const url = resolveChannelUrl(ch)
    expect(url).toContain('wa.me/')
    expect(url).toContain('Quiero%20suscribirme')
  })
  it('COMMUNITY_GROUP → inviteUrl directo', () => {
    const ch = makeChannel({
      type: 'COMMUNITY_GROUP',
      phone: null,
      inviteUrl: 'https://chat.whatsapp.com/XYZ123',
    })
    expect(resolveChannelUrl(ch)).toBe('https://chat.whatsapp.com/XYZ123')
  })
  it('ANNOUNCEMENTS con inviteUrl inválido → null', () => {
    const ch = makeChannel({ type: 'ANNOUNCEMENTS', inviteUrl: 'https://fake.com/nope' })
    expect(resolveChannelUrl(ch)).toBeNull()
  })
})

// ── groupChannelsForUI ───────────────────────────────
describe('groupChannelsForUI', () => {
  it('separa en 3 secciones (groups / staff / announcements)', () => {
    const channels = [
      makeChannel({ id: '1', type: 'COMMUNITY_GROUP', inviteUrl: 'https://chat.whatsapp.com/A' }),
      makeChannel({ id: '2', type: 'STAFF_DM' }),
      makeChannel({ id: '3', type: 'BROADCAST_LIST' }),
      makeChannel({ id: '4', type: 'ANNOUNCEMENTS', inviteUrl: 'https://whatsapp.com/channel/X' }),
    ]
    const groups = groupChannelsForUI(channels)
    expect(groups.map((g) => g.key)).toEqual(['groups', 'staff', 'announcements'])
    expect(groups.find((g) => g.key === 'staff')!.channels).toHaveLength(2) // STAFF_DM + BROADCAST_LIST
  })
  it('excluye inactivos', () => {
    const channels = [
      makeChannel({ id: '1', type: 'STAFF_DM', active: false }),
      makeChannel({ id: '2', type: 'STAFF_DM', active: true }),
    ]
    const groups = groupChannelsForUI(channels)
    expect(groups[0].channels).toHaveLength(1)
    expect(groups[0].channels[0].id).toBe('2')
  })
  it('respeta order field', () => {
    const channels = [
      makeChannel({ id: '1', type: 'STAFF_DM', order: 10 }),
      makeChannel({ id: '2', type: 'STAFF_DM', order: 1 }),
      makeChannel({ id: '3', type: 'STAFF_DM', order: 5 }),
    ]
    const groups = groupChannelsForUI(channels)
    expect(groups[0].channels.map((c) => c.id)).toEqual(['2', '3', '1'])
  })
  it('no crea sección vacía', () => {
    const channels = [makeChannel({ type: 'STAFF_DM' })]
    const groups = groupChannelsForUI(channels)
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe('staff')
  })
})

// ── filterChannelsForCountry ─────────────────────────
describe('filterChannelsForCountry', () => {
  it('incluye canales sin país específico (globales)', () => {
    const channels = [makeChannel({ id: '1', country: null }), makeChannel({ id: '2', country: 'CO' })]
    expect(filterChannelsForCountry(channels, 'CO')).toHaveLength(2)
  })
  it('excluye canales de otro país', () => {
    const channels = [makeChannel({ id: '1', country: 'CL' }), makeChannel({ id: '2', country: 'CO' })]
    const filtered = filterChannelsForCountry(channels, 'CO')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('2')
  })
  it('country null devuelve todos', () => {
    const channels = [makeChannel({ country: 'CL' })]
    expect(filterChannelsForCountry(channels, null)).toHaveLength(1)
  })
})

// ── validateChannelInput ─────────────────────────────
describe('validateChannelInput', () => {
  it('STAFF_DM requiere phone válido', () => {
    const errs = validateChannelInput({ type: 'STAFF_DM', label: 'Test' })
    expect(errs).toHaveLength(1)
    expect(errs[0].field).toBe('phone')
  })
  it('COMMUNITY_GROUP requiere inviteUrl válido', () => {
    const errs = validateChannelInput({ type: 'COMMUNITY_GROUP', label: 'Test' })
    expect(errs[0].field).toBe('inviteUrl')
  })
  it('label vacío falla', () => {
    const errs = validateChannelInput({ type: 'STAFF_DM', label: '', phone: '573001234567' })
    expect(errs.some((e) => e.field === 'label')).toBe(true)
  })
  it('STAFF_DM válido no devuelve errores', () => {
    const errs = validateChannelInput({
      type: 'STAFF_DM',
      label: 'Soporte Ventas',
      phone: '573001234567',
    })
    expect(errs).toEqual([])
  })
  it('COMMUNITY_GROUP válido no devuelve errores', () => {
    const errs = validateChannelInput({
      type: 'COMMUNITY_GROUP',
      label: 'Grupo Dropshippers',
      inviteUrl: 'https://chat.whatsapp.com/XYZ',
    })
    expect(errs).toEqual([])
  })
})

// ── aggregateClicks ──────────────────────────────────
describe('aggregateClicks', () => {
  const now = new Date('2026-04-23T12:00:00Z')
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  it('cuenta clicks por canal', () => {
    const clicks = [
      { channelId: 'a', createdAt: now },
      { channelId: 'a', createdAt: oneDayAgo },
      { channelId: 'b', createdAt: now },
    ]
    const agg = aggregateClicks(clicks, now)
    expect(agg.get('a')!.total).toBe(2)
    expect(agg.get('b')!.total).toBe(1)
  })

  it('separa last7Days vs last30Days vs total', () => {
    const clicks = [
      { channelId: 'a', createdAt: oneDayAgo }, // en últimos 7
      { channelId: 'a', createdAt: tenDaysAgo }, // en últimos 30 pero no 7
      { channelId: 'a', createdAt: sixtyDaysAgo }, // total solo
    ]
    const agg = aggregateClicks(clicks, now)
    const r = agg.get('a')!
    expect(r.total).toBe(3)
    expect(r.last7Days).toBe(1)
    expect(r.last30Days).toBe(2)
  })

  it('guarda el lastClickAt más reciente', () => {
    const clicks = [
      { channelId: 'a', createdAt: tenDaysAgo },
      { channelId: 'a', createdAt: oneDayAgo },
    ]
    const agg = aggregateClicks(clicks, now)
    expect(new Date(agg.get('a')!.lastClickAt!).getTime()).toBe(oneDayAgo.getTime())
  })

  it('map vacío con lista vacía', () => {
    expect(aggregateClicks([], now).size).toBe(0)
  })
})
