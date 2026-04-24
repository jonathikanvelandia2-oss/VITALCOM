// V41 — Tests del exportador CSV.

import { describe, it, expect } from 'vitest'
import { csvEscape, formatRow, buildCsv, buildFilename } from '../export'

describe('csvEscape', () => {
  it('retorna string vacío para null y undefined', () => {
    expect(csvEscape(null)).toBe('')
    expect(csvEscape(undefined)).toBe('')
  })

  it('deja strings simples sin modificar', () => {
    expect(csvEscape('hola')).toBe('hola')
    expect(csvEscape('user@example.com')).toBe('user@example.com')
  })

  it('envuelve en comillas strings con coma', () => {
    expect(csvEscape('Hola, mundo')).toBe('"Hola, mundo"')
  })

  it('envuelve en comillas strings con salto de línea', () => {
    expect(csvEscape('línea 1\nlínea 2')).toBe('"línea 1\nlínea 2"')
  })

  it('duplica comillas internas + envuelve', () => {
    expect(csvEscape('Dijo "hola"')).toBe('"Dijo ""hola"""')
  })

  it('envuelve strings con carriage return', () => {
    expect(csvEscape('a\r\nb')).toBe('"a\r\nb"')
  })
})

describe('formatRow', () => {
  const baseRow = {
    id: 'log_1',
    createdAt: new Date('2026-04-24T10:00:00Z'),
    resource: 'AUTH',
    action: 'LOGIN_SUCCESS',
    severity: 'INFO',
    summary: 'Login ok',
    actorEmail: 'a@b.c',
    actorRole: 'ADMIN',
    resourceId: null,
    ip: '192.0.2.1',
    userAgent: 'Mozilla/5.0',
  }

  it('respeta el orden de columnas', () => {
    const row = formatRow(baseRow)
    expect(row).toBe('log_1,2026-04-24T10:00:00.000Z,AUTH,LOGIN_SUCCESS,INFO,Login ok,a@b.c,ADMIN,,192.0.2.1,Mozilla/5.0')
  })

  it('convierte nulls en strings vacíos', () => {
    const row = formatRow({
      ...baseRow,
      actorEmail: null,
      actorRole: null,
      ip: null,
      userAgent: null,
    })
    expect(row.split(',').slice(6, 11)).toEqual(['', '', '', '', ''])
  })

  it('escapa summaries con comas', () => {
    const row = formatRow({ ...baseRow, summary: 'cambió rol de ADMIN, EMPLOYEE' })
    expect(row).toContain('"cambió rol de ADMIN, EMPLOYEE"')
  })
})

describe('buildCsv', () => {
  it('incluye header en primera línea', () => {
    const csv = buildCsv([])
    const firstLine = csv.split('\r\n')[0]
    expect(firstLine).toBe(
      'id,timestamp,resource,action,severity,summary,actor_email,actor_role,resource_id,ip,user_agent',
    )
  })

  it('usa CRLF como separador de línea', () => {
    const csv = buildCsv([
      {
        id: '1',
        createdAt: new Date('2026-01-01'),
        resource: 'AUTH',
        action: 'LOGIN_SUCCESS',
        severity: 'INFO',
        summary: 'x',
        actorEmail: null,
        actorRole: null,
        resourceId: null,
        ip: null,
        userAgent: null,
      },
    ])
    expect(csv).toContain('\r\n')
    expect(csv.split('\r\n')).toHaveLength(2)
  })

  it('arreglo vacío solo devuelve header', () => {
    const csv = buildCsv([])
    expect(csv.split('\r\n')).toHaveLength(1)
  })
})

describe('buildFilename', () => {
  it('produce nombre con timestamp ISO-safe', () => {
    const name = buildFilename(new Date('2026-04-24T14:30:45.123Z'))
    expect(name).toBe('vitalcom-audit-log-2026-04-24T14-30-45.csv')
  })

  it('nombre no contiene caracteres inválidos para filesystem', () => {
    const name = buildFilename(new Date())
    expect(name).toMatch(/^vitalcom-audit-log-[\d\-T]+\.csv$/)
  })
})
