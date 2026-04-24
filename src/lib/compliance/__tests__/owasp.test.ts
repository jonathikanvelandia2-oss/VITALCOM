// V41 — Tests del módulo de compliance.

import { describe, it, expect } from 'vitest'
import {
  OWASP_TOP_10_2021,
  ADDITIONAL_STANDARDS,
  summarizeCompliance,
  type OwaspItem,
} from '../owasp'

describe('OWASP_TOP_10_2021', () => {
  it('contiene los 10 ítems', () => {
    expect(OWASP_TOP_10_2021).toHaveLength(10)
  })

  it('todos los códigos siguen el formato A##:2021', () => {
    for (const item of OWASP_TOP_10_2021) {
      expect(item.code).toMatch(/^A(0[1-9]|10):2021$/)
    }
  })

  it('cada ítem tiene al menos 1 control y 1 evidencia', () => {
    for (const item of OWASP_TOP_10_2021) {
      expect(item.controls.length).toBeGreaterThan(0)
      expect(item.evidence.length).toBeGreaterThan(0)
    }
  })

  it('códigos son únicos', () => {
    const codes = OWASP_TOP_10_2021.map((i) => i.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('cada status es válido', () => {
    const valid = ['implemented', 'partial', 'pending']
    for (const item of OWASP_TOP_10_2021) {
      expect(valid).toContain(item.status)
    }
  })
})

describe('summarizeCompliance', () => {
  it('cuenta implemented/partial/pending correctamente', () => {
    const items: OwaspItem[] = [
      { code: 'A01', title: 't', risk: 'r', status: 'implemented', controls: ['c'], evidence: ['e'] },
      { code: 'A02', title: 't', risk: 'r', status: 'implemented', controls: ['c'], evidence: ['e'] },
      { code: 'A03', title: 't', risk: 'r', status: 'partial', controls: ['c'], evidence: ['e'] },
      { code: 'A04', title: 't', risk: 'r', status: 'pending', controls: ['c'], evidence: ['e'] },
    ]
    const summary = summarizeCompliance(items)
    expect(summary.total).toBe(4)
    expect(summary.implemented).toBe(2)
    expect(summary.partial).toBe(1)
    expect(summary.pending).toBe(1)
    // (2 * 1 + 1 * 0.5) / 4 = 0.625 → 63
    expect(summary.score).toBe(63)
  })

  it('score 100 cuando todos están implemented', () => {
    const items: OwaspItem[] = OWASP_TOP_10_2021.map((i) => ({ ...i, status: 'implemented' }))
    expect(summarizeCompliance(items).score).toBe(100)
  })

  it('score 0 cuando todos están pending', () => {
    const items: OwaspItem[] = OWASP_TOP_10_2021.map((i) => ({ ...i, status: 'pending' }))
    expect(summarizeCompliance(items).score).toBe(0)
  })

  it('score real del proyecto supera el 90%', () => {
    const summary = summarizeCompliance(OWASP_TOP_10_2021)
    expect(summary.score).toBeGreaterThanOrEqual(90)
  })
})

describe('ADDITIONAL_STANDARDS', () => {
  it('incluye los 4 países de Vitalcom', () => {
    const names = ADDITIONAL_STANDARDS.map((s) => s.name).join(' ')
    expect(names).toContain('Colombia')
    expect(names).toContain('Chile')
    expect(names).toContain('Ecuador')
    expect(names).toContain('Guatemala')
  })
})
