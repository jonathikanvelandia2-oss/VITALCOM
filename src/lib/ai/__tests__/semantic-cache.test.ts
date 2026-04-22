// Tests de lógica pura del semantic-cache (V28)
// No tocan Prisma — validan los invariantes que previenen fugas cross-user
// de datos personales y la estabilidad del hash de cache.
import { describe, it, expect } from 'vitest'
import { ChatAgent } from '@prisma/client'
import {
  normalizeQuery,
  hashQuery,
  containsPersonalData,
  cachePolicy,
  TTL_BY_AGENT,
  CANONICAL_AGENTS,
  SEMANTIC_THRESHOLD,
} from '../semantic-cache'

describe('normalizeQuery', () => {
  it('convierte a minúsculas', () => {
    expect(normalizeQuery('HOLA')).toBe('hola')
    expect(normalizeQuery('Mezclado')).toBe('mezclado')
  })

  it('colapsa espacios múltiples', () => {
    expect(normalizeQuery('a   b    c')).toBe('a b c')
    expect(normalizeQuery('una\tfrase\n aquí')).toBe('una frase aquí')
  })

  it('trim', () => {
    expect(normalizeQuery('  hola  ')).toBe('hola')
  })

  it('remueve signos de puntuación comunes', () => {
    expect(normalizeQuery('¿Cómo estás?')).toBe('cómo estás')
    expect(normalizeQuery('¡Gracias!')).toBe('gracias')
    expect(normalizeQuery('algo, otro; más: final.')).toBe('algo otro más final')
  })

  it('preserva acentos y caracteres unicode', () => {
    expect(normalizeQuery('CAMPAÑA')).toBe('campaña')
    expect(normalizeQuery('Té Chino Premium')).toBe('té chino premium')
  })
})

describe('hashQuery', () => {
  it('produce hash SHA-256 de 64 chars hex', () => {
    const h = hashQuery('user-1', ChatAgent.VITA, 'hola')
    expect(h).toMatch(/^[a-f0-9]{64}$/)
  })

  it('mismo input → mismo hash (determinístico)', () => {
    const a = hashQuery('user-1', ChatAgent.VITA, 'hola')
    const b = hashQuery('user-1', ChatAgent.VITA, 'hola')
    expect(a).toBe(b)
  })

  it('diferente user → diferente hash (aislamiento)', () => {
    const a = hashQuery('user-1', ChatAgent.VITA, 'hola')
    const b = hashQuery('user-2', ChatAgent.VITA, 'hola')
    expect(a).not.toBe(b)
  })

  it('diferente agente → diferente hash', () => {
    const a = hashQuery('user-1', ChatAgent.VITA, 'hola')
    const b = hashQuery('user-1', ChatAgent.MENTOR_FINANCIERO, 'hola')
    expect(a).not.toBe(b)
  })

  it('queries equivalentes por normalización colisionan intencionalmente', () => {
    // "¿Hola?" y "HOLA" normalizan a lo mismo → mismo hash
    const a = hashQuery('user-1', ChatAgent.VITA, '¿Hola?')
    const b = hashQuery('user-1', ChatAgent.VITA, 'HOLA')
    expect(a).toBe(b)
  })

  it('acepta userId null como "anon"', () => {
    const a = hashQuery(null, ChatAgent.VITA, 'hola')
    const b = hashQuery('anon', ChatAgent.VITA, 'hola')
    expect(a).toBe(b)
  })
})

describe('containsPersonalData', () => {
  it('detecta cifras con símbolo de moneda', () => {
    expect(containsPersonalData('Tu venta del mes fue $1,200')).toBe(true)
    expect(containsPersonalData('Ganaste $ 500 en comisiones')).toBe(true)
  })

  it('detecta códigos de moneda LATAM (formato LLM: código primero)', () => {
    // El regex matchea "CODIGO <espacios> <número>" — formato típico de los LLMs
    expect(containsPersonalData('Te recomiendo COP 50000')).toBe(true)
    expect(containsPersonalData('USD 30 de utilidad')).toBe(true)
    expect(containsPersonalData('CLP 80000 sugerido')).toBe(true)
    expect(containsPersonalData('GTQ 300')).toBe(true)
  })

  it('detecta ROAS en formato decimal x', () => {
    expect(containsPersonalData('Tu ROAS es 2.5x')).toBe(true)
    expect(containsPersonalData('Actualmente 3.8x')).toBe(true)
  })

  it('detecta menciones de margen con número', () => {
    expect(containsPersonalData('Tu margen es 30%')).toBe(true)
    expect(containsPersonalData('Margen actual: 15')).toBe(true)
  })

  it('detecta cantidad de pedidos', () => {
    expect(containsPersonalData('Pedidos: 45')).toBe(true)
    expect(containsPersonalData('pedido: 7 este mes')).toBe(true)
  })

  it('NO marca respuestas educativas genéricas', () => {
    expect(containsPersonalData('El té verde tiene muchos beneficios')).toBe(false)
    expect(containsPersonalData('Para calcular el ROAS, divide revenue entre ad spend')).toBe(false)
    expect(containsPersonalData('Los dropshippers exitosos optimizan sus campañas')).toBe(false)
  })

  it('NO marca números sueltos sin contexto monetario', () => {
    expect(containsPersonalData('Tenemos 4 países: CO, EC, GT, CL')).toBe(false)
  })
})

describe('cachePolicy', () => {
  it('agente canonical + respuesta sin datos → cacheable y canonical', () => {
    const p = cachePolicy(ChatAgent.VITA, 'El té verde tiene muchos beneficios para la salud')
    expect(p.shouldCache).toBe(true)
    expect(p.isCanonical).toBe(true)
  })

  it('agente canonical + respuesta con datos personales → NO cacheable (previene fuga)', () => {
    const p = cachePolicy(ChatAgent.VITA, 'Tu ROAS es 2.5x este mes')
    expect(p.shouldCache).toBe(false)
    expect(p.isCanonical).toBe(false)
  })

  it('agente NO-canonical + respuesta sin datos → cacheable pero NO canonical', () => {
    const p = cachePolicy(ChatAgent.MENTOR_FINANCIERO, 'El principio del break-even es cubrir costos fijos')
    expect(p.shouldCache).toBe(true)
    expect(p.isCanonical).toBe(false)
  })

  it('agente NO-canonical + respuesta con datos → NO cacheable', () => {
    const p = cachePolicy(ChatAgent.MENTOR_FINANCIERO, 'Tu margen actual es 15%')
    expect(p.shouldCache).toBe(false)
    expect(p.isCanonical).toBe(false)
  })

  it('CEO_ADVISOR nunca es canonical aunque sea educativo (privacidad)', () => {
    const p = cachePolicy(ChatAgent.CEO_ADVISOR, 'Las tendencias del mercado LATAM son X')
    expect(p.isCanonical).toBe(false)
  })
})

describe('TTL_BY_AGENT', () => {
  it('tiene TTL definido para cada ChatAgent', () => {
    for (const agent of Object.values(ChatAgent)) {
      expect(TTL_BY_AGENT[agent as ChatAgent]).toBeDefined()
      expect(typeof TTL_BY_AGENT[agent as ChatAgent]).toBe('number')
    }
  })

  it('agentes financieros tienen TTL corto (<=15min) — datos rotan rápido', () => {
    expect(TTL_BY_AGENT.MENTOR_FINANCIERO).toBeLessThanOrEqual(15)
    expect(TTL_BY_AGENT.MEDIA_BUYER).toBeLessThanOrEqual(15)
  })

  it('agentes educativos/soporte tienen TTL largo (>=60min)', () => {
    expect(TTL_BY_AGENT.VITA).toBeGreaterThanOrEqual(60)
    expect(TTL_BY_AGENT.SOPORTE_IA).toBeGreaterThanOrEqual(60)
    expect(TTL_BY_AGENT.CREATIVO_MAKER).toBeGreaterThanOrEqual(60)
  })

  it('ESCALATE_HUMAN tiene TTL 0 (no se cachea)', () => {
    expect(TTL_BY_AGENT.ESCALATE_HUMAN).toBe(0)
  })
})

describe('CANONICAL_AGENTS + SEMANTIC_THRESHOLD', () => {
  it('contiene solo agentes educativos/catálogo/soporte', () => {
    expect(CANONICAL_AGENTS).toContain(ChatAgent.VITA)
    expect(CANONICAL_AGENTS).toContain(ChatAgent.SOPORTE_IA)
    expect(CANONICAL_AGENTS).toContain(ChatAgent.CREATIVO_MAKER)
  })

  it('NO incluye agentes con datos financieros personales', () => {
    expect(CANONICAL_AGENTS).not.toContain(ChatAgent.MENTOR_FINANCIERO)
    expect(CANONICAL_AGENTS).not.toContain(ChatAgent.MEDIA_BUYER)
    expect(CANONICAL_AGENTS).not.toContain(ChatAgent.CEO_ADVISOR)
    expect(CANONICAL_AGENTS).not.toContain(ChatAgent.BLUEPRINT_ANALYST)
    expect(CANONICAL_AGENTS).not.toContain(ChatAgent.OPTIMIZADOR_TIENDA)
  })

  it('threshold conservador (>=0.9) para evitar matches falsos', () => {
    expect(SEMANTIC_THRESHOLD).toBeGreaterThanOrEqual(0.9)
    expect(SEMANTIC_THRESHOLD).toBeLessThan(1)
  })
})
