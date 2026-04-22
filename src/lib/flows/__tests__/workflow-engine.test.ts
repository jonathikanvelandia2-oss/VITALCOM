// Tests de lógica pura del workflow-engine (V27)
// No tocan Prisma — validan interpolación de variables y evaluación de
// condiciones de branch. Un bug aquí manda mensajes con nombres vacíos
// o enruta a la rama equivocada.
import { describe, it, expect } from 'vitest'
import type { WhatsappContact } from '@prisma/client'
import {
  resolveVariable,
  resolveTemplate,
  interpolate,
  evalCondition,
} from '../workflow-engine'

const makeContact = (overrides: Partial<WhatsappContact> = {}): WhatsappContact => ({
  id: 'c1',
  accountId: 'acc-1',
  phoneE164: '+573001234567',
  firstName: 'María',
  lastName: 'Pérez',
  shippingAddress: 'Calle 1',
  shippingCity: 'Bogotá',
  shippingCountry: 'CO',
  segment: 'vip',
  isOptedIn: true,
  lifetimeValue: 100000,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  // fields potencialmente adicionales
  ...overrides,
} as WhatsappContact)

describe('resolveVariable', () => {
  it('devuelve literal si no empieza con {{', () => {
    expect(resolveVariable('Hola', {}, null)).toBe('Hola')
    expect(resolveVariable('', {}, null)).toBe('')
  })

  it('resuelve contact.field cuando contact está presente', () => {
    const c = makeContact({ firstName: 'María' })
    expect(resolveVariable('{{contact.firstName}}', {}, c)).toBe('María')
  })

  it('devuelve string vacío si contact.field es null/undefined (no rompe)', () => {
    const c = makeContact({ firstName: null })
    expect(resolveVariable('{{contact.firstName}}', {}, c)).toBe('')
  })

  it('resuelve variable del contexto cuando no es contact.*', () => {
    expect(resolveVariable('{{product_name}}', { product_name: 'Té Verde' }, null)).toBe('Té Verde')
  })

  it('devuelve string vacío si la variable no existe (no "undefined")', () => {
    expect(resolveVariable('{{falta}}', {}, null)).toBe('')
  })

  it('tolera contact null con referencia a contact.*', () => {
    expect(resolveVariable('{{contact.firstName}}', {}, null)).toBe('')
  })

  it('tolera valor undefined en input', () => {
    expect(resolveVariable(undefined as unknown as string, {}, null)).toBe(undefined as unknown as string)
  })
})

describe('resolveTemplate', () => {
  it('interpola múltiples variables en un mensaje', () => {
    const c = makeContact({ firstName: 'Ana' })
    const r = resolveTemplate(
      'Hola {{contact.firstName}}, tu pedido {{order_number}} está confirmado',
      { order_number: 'VC-CO-001' },
      c,
    )
    expect(r).toBe('Hola Ana, tu pedido VC-CO-001 está confirmado')
  })

  it('variables inexistentes → string vacío (no rompe el mensaje)', () => {
    const r = resolveTemplate('Hola {{falta}} otros', {}, null)
    expect(r).toBe('Hola  otros')
  })

  it('soporta keys con punto (nested: contact.field)', () => {
    const c = makeContact({ shippingCity: 'Medellín' })
    expect(resolveTemplate('{{contact.shippingCity}}', {}, c)).toBe('Medellín')
  })

  it('template sin placeholders se devuelve sin cambios', () => {
    expect(resolveTemplate('Texto literal', {}, null)).toBe('Texto literal')
  })

  it('NO explota llaves escapadas simples como {{{{}}}}', () => {
    // Edge case: no garantizamos nada elegante, pero no debe tirar excepción
    expect(() => resolveTemplate('{{{{foo}}}}', { foo: 'bar' }, null)).not.toThrow()
  })

  it('valor 0 se renderiza como "0" (no string vacío)', () => {
    expect(resolveTemplate('{{total}}', { total: 0 }, null)).toBe('0')
  })

  it('valor false se renderiza como "false"', () => {
    expect(resolveTemplate('{{flag}}', { flag: false }, null)).toBe('false')
  })
})

describe('interpolate', () => {
  it('más simple: solo vars, sin contact', () => {
    expect(interpolate('A {{x}} B', { x: '1' })).toBe('A 1 B')
  })

  it('var faltante → string vacío', () => {
    expect(interpolate('{{x}}', {})).toBe('')
  })

  it('acepta keys con punto pero trata como literal si no existe', () => {
    expect(interpolate('{{x.y}}', { 'x.y': 'ok' })).toBe('ok')
  })
})

describe('evalCondition', () => {
  describe('eq / neq', () => {
    it('eq: match estricto', () => {
      expect(evalCondition('vip', 'eq', 'vip')).toBe(true)
      expect(evalCondition('vip', 'eq', 'regular')).toBe(false)
      expect(evalCondition(5, 'eq', 5)).toBe(true)
      expect(evalCondition(5, 'eq', '5')).toBe(false) // no type coercion
    })

    it('neq: inverso de eq', () => {
      expect(evalCondition('vip', 'neq', 'churn')).toBe(true)
      expect(evalCondition('vip', 'neq', 'vip')).toBe(false)
    })
  })

  describe('gt / lt / gte / lte (numéricas)', () => {
    it('gt funciona con strings numéricas (coerción Number)', () => {
      expect(evalCondition('150', 'gt', '100')).toBe(true)
      expect(evalCondition(150, 'gt', 200)).toBe(false)
    })

    it('lt', () => {
      expect(evalCondition(50, 'lt', 100)).toBe(true)
      expect(evalCondition(100, 'lt', 100)).toBe(false)
    })

    it('gte incluye igualdad', () => {
      expect(evalCondition(100, 'gte', 100)).toBe(true)
      expect(evalCondition(99, 'gte', 100)).toBe(false)
    })

    it('lte incluye igualdad', () => {
      expect(evalCondition(100, 'lte', 100)).toBe(true)
      expect(evalCondition(101, 'lte', 100)).toBe(false)
    })

    it('NaN siempre false (no enrutar cuando hay bug de tipo)', () => {
      expect(evalCondition('abc', 'gt', 10)).toBe(false)
      expect(evalCondition('abc', 'lt', 10)).toBe(false)
      expect(evalCondition('abc', 'gte', 10)).toBe(false)
    })
  })

  describe('contains', () => {
    it('substring en strings', () => {
      expect(evalCondition('hola mundo', 'contains', 'mundo')).toBe(true)
      expect(evalCondition('hola', 'contains', 'xyz')).toBe(false)
    })

    it('coerciona a string', () => {
      expect(evalCondition(12345, 'contains', '234')).toBe(true)
    })
  })

  describe('in', () => {
    it('matches cuando fieldValue está en array target', () => {
      expect(evalCondition('vip', 'in', ['vip', 'gold'])).toBe(true)
      expect(evalCondition('silver', 'in', ['vip', 'gold'])).toBe(false)
    })

    it('target no-array → false (no assumptions)', () => {
      expect(evalCondition('vip', 'in', 'vip')).toBe(false)
      expect(evalCondition('vip', 'in', null)).toBe(false)
    })

    it('array vacío → false', () => {
      expect(evalCondition('vip', 'in', [])).toBe(false)
    })
  })

  describe('exists', () => {
    it('true para valores no null/undefined', () => {
      expect(evalCondition('vip', 'exists', null)).toBe(true)
      expect(evalCondition(0, 'exists', null)).toBe(true)
      expect(evalCondition('', 'exists', null)).toBe(true) // string vacío EXISTE
      expect(evalCondition(false, 'exists', null)).toBe(true)
    })

    it('false para null/undefined', () => {
      expect(evalCondition(null, 'exists', null)).toBe(false)
      expect(evalCondition(undefined, 'exists', null)).toBe(false)
    })
  })

  describe('operador desconocido', () => {
    it('retorna false en operador inexistente (fail-safe)', () => {
      expect(evalCondition('x', 'INVALID', 'x')).toBe(false)
      expect(evalCondition('x', '', 'x')).toBe(false)
    })
  })
})
