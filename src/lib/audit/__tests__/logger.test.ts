// V40 — Tests del audit logger.
// Cubren helpers puros: resolución de severidad, extracción de metadata HTTP,
// diff de campos, construcción del payload, filtros y cálculo de KPIs.

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SEVERITY,
  resolveSeverity,
  extractRequestMeta,
  diffFields,
  buildAuditPayload,
  buildAuditWhere,
  computeAuditStats,
} from '../logger'

// ── Severidad ────────────────────────────────────────
describe('resolveSeverity', () => {
  it('usa default mapping cuando no hay override', () => {
    expect(resolveSeverity('LOGIN_SUCCESS')).toBe('INFO')
    expect(resolveSeverity('LOGIN_FAILED')).toBe('WARNING')
    expect(resolveSeverity('ROLE_CHANGED')).toBe('CRITICAL')
    expect(resolveSeverity('USER_DELETED')).toBe('CRITICAL')
    expect(resolveSeverity('API_KEY_REVOKED')).toBe('CRITICAL')
  })

  it('respeta override explícito', () => {
    expect(resolveSeverity('LOGIN_SUCCESS', 'WARNING')).toBe('WARNING')
    expect(resolveSeverity('ROLE_CHANGED', 'INFO')).toBe('INFO')
  })

  it('todas las acciones tienen severidad por defecto', () => {
    const actions: Array<keyof typeof DEFAULT_SEVERITY> = [
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER',
      'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED',
      'ROLE_CHANGED', 'AREA_CHANGED',
      'USER_CREATED', 'USER_DEACTIVATED', 'USER_REACTIVATED', 'USER_DELETED',
      'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DEACTIVATED',
      'STOCK_ADJUSTED',
      'ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED',
      'INBOX_THREAD_RESOLVED', 'INBOX_THREAD_REASSIGNED',
      'CHANNEL_CREATED', 'CHANNEL_UPDATED', 'CHANNEL_DISABLED',
      'EXPORT_REQUESTED', 'DATA_ACCESSED', 'CONFIG_UPDATED',
      'API_KEY_CREATED', 'API_KEY_REVOKED', 'OTHER',
    ]
    for (const action of actions) {
      expect(DEFAULT_SEVERITY[action]).toBeDefined()
    }
  })
})

// ── Metadata HTTP ────────────────────────────────────
describe('extractRequestMeta', () => {
  it('extrae primer IP de x-forwarded-for', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.1, 198.51.100.5, 10.0.0.1',
      'user-agent': 'Mozilla/5.0',
    })
    const meta = extractRequestMeta(headers)
    expect(meta.ip).toBe('203.0.113.1')
    expect(meta.userAgent).toBe('Mozilla/5.0')
  })

  it('fallback a x-real-ip cuando falta forwarded-for', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.99' })
    const meta = extractRequestMeta(headers)
    expect(meta.ip).toBe('198.51.100.99')
    expect(meta.userAgent).toBe(null)
  })

  it('retorna null cuando no hay headers relevantes', () => {
    const headers = new Headers()
    const meta = extractRequestMeta(headers)
    expect(meta.ip).toBe(null)
    expect(meta.userAgent).toBe(null)
  })

  it('trimea espacios en el primer IP', () => {
    const headers = new Headers({ 'x-forwarded-for': '  192.0.2.1  ' })
    expect(extractRequestMeta(headers).ip).toBe('192.0.2.1')
  })

  it('acepta un Request directo', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.5' },
    })
    expect(extractRequestMeta(req).ip).toBe('203.0.113.5')
  })
})

// ── Diff ─────────────────────────────────────────────
describe('diffFields', () => {
  it('reporta solo campos cambiados', () => {
    const before = { role: 'EMPLOYEE', area: 'MARKETING', name: 'Juan' }
    const after = { role: 'ADMIN', area: 'MARKETING', name: 'Juan' }
    const diff = diffFields(before, after, ['role', 'area', 'name'])
    expect(diff).toEqual({ role: { from: 'EMPLOYEE', to: 'ADMIN' } })
  })

  it('retorna objeto vacío si nada cambió', () => {
    const user = { role: 'ADMIN', active: true }
    expect(diffFields(user, user, ['role', 'active'])).toEqual({})
  })

  it('ignora campos fuera del set solicitado', () => {
    const before = { role: 'A', password: 'old' }
    const after = { role: 'B', password: 'new' }
    expect(diffFields(before, after, ['role'])).toEqual({
      role: { from: 'A', to: 'B' },
    })
  })

  it('detecta cambios a null', () => {
    const before: { area: string | null } = { area: 'VENTAS' }
    const after: { area: string | null } = { area: null }
    expect(diffFields(before, after, ['area'])).toEqual({
      area: { from: 'VENTAS', to: null },
    })
  })
})

// ── Payload ──────────────────────────────────────────
describe('buildAuditPayload', () => {
  it('aplica severidad default cuando no se pasa', () => {
    const payload = buildAuditPayload({
      resource: 'USER',
      action: 'ROLE_CHANGED',
      summary: 'test',
    })
    expect(payload.severity).toBe('CRITICAL')
  })

  it('mapea actor snapshot a columnas independientes', () => {
    const payload = buildAuditPayload({
      actor: { id: 'u1', email: 'a@b.c', role: 'ADMIN' },
      resource: 'AUTH',
      action: 'LOGIN_SUCCESS',
      summary: 'login',
    })
    expect(payload.actorId).toBe('u1')
    expect(payload.actorEmail).toBe('a@b.c')
    expect(payload.actorRole).toBe('ADMIN')
  })

  it('permite actor anónimo (null en todos los snapshots)', () => {
    const payload = buildAuditPayload({
      resource: 'AUTH',
      action: 'LOGIN_FAILED',
      summary: 'failed',
    })
    expect(payload.actorId).toBe(null)
    expect(payload.actorEmail).toBe(null)
    expect(payload.actorRole).toBe(null)
  })

  it('omite metadata cuando no se provee', () => {
    const payload = buildAuditPayload({
      resource: 'OTHER',
      action: 'OTHER',
      summary: 'x',
    })
    expect(payload.metadata).toBeUndefined()
  })

  it('preserva resourceId explícito', () => {
    const payload = buildAuditPayload({
      resource: 'ORDER',
      action: 'ORDER_STATUS_CHANGED',
      resourceId: 'order_123',
      summary: 'x',
    })
    expect(payload.resourceId).toBe('order_123')
  })
})

// ── Filtros ──────────────────────────────────────────
describe('buildAuditWhere', () => {
  it('vacío cuando no hay filtros', () => {
    expect(buildAuditWhere({})).toEqual({})
  })

  it('aplica filtros individuales', () => {
    const where = buildAuditWhere({
      resource: 'USER',
      action: 'ROLE_CHANGED',
      severity: 'CRITICAL',
      actorId: 'u1',
      resourceId: 'user_42',
    })
    expect(where).toMatchObject({
      resource: 'USER',
      action: 'ROLE_CHANGED',
      severity: 'CRITICAL',
      actorId: 'u1',
      resourceId: 'user_42',
    })
  })

  it('combina from/to en createdAt', () => {
    const from = new Date('2026-01-01')
    const to = new Date('2026-01-31')
    const where = buildAuditWhere({ from, to })
    expect(where.createdAt).toEqual({ gte: from, lte: to })
  })

  it('solo from sin to produce gte sin lte', () => {
    const from = new Date('2026-01-01')
    const where = buildAuditWhere({ from })
    expect(where.createdAt).toEqual({ gte: from })
  })

  it('search produce OR sobre summary y actorEmail', () => {
    const where = buildAuditWhere({ search: 'login' })
    expect(where.OR).toHaveLength(2)
    expect(where.OR?.[0]).toHaveProperty('summary')
    expect(where.OR?.[1]).toHaveProperty('actorEmail')
  })
})

// ── KPIs ─────────────────────────────────────────────
describe('computeAuditStats', () => {
  const now = new Date('2026-04-24T12:00:00Z')

  function row(ms: number, overrides: Partial<{
    severity: 'INFO' | 'NOTICE' | 'WARNING' | 'CRITICAL'
    action: 'LOGIN_FAILED' | 'LOGIN_SUCCESS' | 'OTHER'
    resource: 'AUTH' | 'USER' | 'ORDER'
  }> = {}) {
    return {
      severity: (overrides.severity ?? 'INFO') as any,
      action: (overrides.action ?? 'OTHER') as any,
      resource: (overrides.resource ?? 'OTHER') as any,
      createdAt: new Date(now.getTime() - ms),
    }
  }

  it('cuenta eventos últimas 24h', () => {
    const rows = [
      row(0),
      row(60 * 60 * 1000), // 1h
      row(23 * 60 * 60 * 1000), // 23h
      row(25 * 60 * 60 * 1000), // fuera de rango
    ]
    const stats = computeAuditStats(rows, now)
    expect(stats.totalLast24h).toBe(3)
  })

  it('cuenta críticos últimos 7d', () => {
    const rows = [
      row(0, { severity: 'CRITICAL' }),
      row(6 * 24 * 60 * 60 * 1000, { severity: 'CRITICAL' }),
      row(8 * 24 * 60 * 60 * 1000, { severity: 'CRITICAL' }), // fuera
      row(0, { severity: 'INFO' }),
    ]
    const stats = computeAuditStats(rows, now)
    expect(stats.criticalLast7d).toBe(2)
  })

  it('cuenta logins fallidos en última hora', () => {
    const rows = [
      row(10 * 60 * 1000, { action: 'LOGIN_FAILED' }),
      row(30 * 60 * 1000, { action: 'LOGIN_FAILED' }),
      row(61 * 60 * 1000, { action: 'LOGIN_FAILED' }), // fuera de 1h
      row(10 * 60 * 1000, { action: 'LOGIN_SUCCESS' }),
    ]
    const stats = computeAuditStats(rows, now)
    expect(stats.failedLoginsLastHour).toBe(2)
  })

  it('agrupa por severidad y recurso últimos 7d', () => {
    const rows = [
      row(0, { severity: 'INFO', resource: 'AUTH' }),
      row(0, { severity: 'WARNING', resource: 'AUTH' }),
      row(0, { severity: 'INFO', resource: 'ORDER' }),
      row(0, { severity: 'CRITICAL', resource: 'USER' }),
    ]
    const stats = computeAuditStats(rows, now)
    expect(stats.bySeverityLast7d.INFO).toBe(2)
    expect(stats.bySeverityLast7d.WARNING).toBe(1)
    expect(stats.bySeverityLast7d.CRITICAL).toBe(1)
    expect(stats.byResourceLast7d.AUTH).toBe(2)
    expect(stats.byResourceLast7d.ORDER).toBe(1)
    expect(stats.byResourceLast7d.USER).toBe(1)
  })

  it('rows vacío retorna ceros', () => {
    const stats = computeAuditStats([], now)
    expect(stats.totalLast24h).toBe(0)
    expect(stats.criticalLast7d).toBe(0)
    expect(stats.failedLoginsLastHour).toBe(0)
    expect(stats.bySeverityLast7d.INFO).toBe(0)
  })
})
