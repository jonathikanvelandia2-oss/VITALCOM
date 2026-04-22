// Tests de lógica pura del orchestrator (V26)
// No tocan Prisma ni LLM — validan las policies por agente que
// garantizan ruteo consistente y prompts íntegros.
import { describe, it, expect } from 'vitest'
import { ChatAgent } from '@prisma/client'
import {
  AGENT_MAP,
  AGENT_PROMPTS,
  taskTypeFor,
  needsPGContext,
  temperatureFor,
  shouldEscalateLowConfidence,
  escalationPriorityFor,
} from '../orchestrator'

describe('AGENT_MAP (classifier → Prisma)', () => {
  it('mapea identidad para cada key (el clasificador usa los mismos nombres)', () => {
    for (const agent of Object.values(ChatAgent)) {
      expect(AGENT_MAP[agent as keyof typeof AGENT_MAP]).toBe(agent)
    }
  })

  it('cubre todos los ChatAgent (no hay gaps)', () => {
    const mapped = new Set(Object.values(AGENT_MAP))
    for (const agent of Object.values(ChatAgent)) {
      expect(mapped.has(agent)).toBe(true)
    }
  })
})

describe('AGENT_PROMPTS', () => {
  it('tiene prompt definido para cada ChatAgent', () => {
    for (const agent of Object.values(ChatAgent)) {
      expect(AGENT_PROMPTS[agent as ChatAgent]).toBeDefined()
    }
  })

  it('ESCALATE_HUMAN es string vacío (no se usa con LLM)', () => {
    expect(AGENT_PROMPTS.ESCALATE_HUMAN).toBe('')
  })

  it('VITA menciona Vitalcom (identidad de marca)', () => {
    expect(AGENT_PROMPTS.VITA).toContain('Vitalcom')
  })

  it('MENTOR_FINANCIERO menciona la regla "nunca prometer ingresos"', () => {
    expect(AGENT_PROMPTS.MENTOR_FINANCIERO.toLowerCase()).toContain('ingresos')
  })

  it('CEO_ADVISOR es SOLO para admin (marcado en prompt)', () => {
    expect(AGENT_PROMPTS.CEO_ADVISOR.toLowerCase()).toContain('admin')
  })

  it('prompts no están vacíos (excepto ESCALATE_HUMAN)', () => {
    for (const [agent, prompt] of Object.entries(AGENT_PROMPTS)) {
      if (agent === 'ESCALATE_HUMAN') continue
      expect(prompt.length).toBeGreaterThan(50)
    }
  })

  it('todos los prompts activos hablan español LATAM (instrucción coherente)', () => {
    // Chequeamos una palabra garantizada en español en cada prompt no vacío
    for (const [agent, prompt] of Object.entries(AGENT_PROMPTS)) {
      if (agent === 'ESCALATE_HUMAN') continue
      // Debe tener al menos una palabra española (eres/tu/el/la)
      expect(prompt).toMatch(/\b(Eres|eres|tu|el|la)\b/)
    }
  })
})

describe('taskTypeFor', () => {
  it('razonamiento financiero → reasoning', () => {
    expect(taskTypeFor(ChatAgent.MENTOR_FINANCIERO)).toBe('reasoning')
    expect(taskTypeFor(ChatAgent.CEO_ADVISOR)).toBe('reasoning')
  })

  it('CREATIVO_MAKER → creative (modo alta temperatura)', () => {
    expect(taskTypeFor(ChatAgent.CREATIVO_MAKER)).toBe('creative')
  })

  it('agentes operativos complejos → conversation_complex', () => {
    expect(taskTypeFor(ChatAgent.MEDIA_BUYER)).toBe('conversation_complex')
    expect(taskTypeFor(ChatAgent.OPTIMIZADOR_TIENDA)).toBe('conversation_complex')
    expect(taskTypeFor(ChatAgent.BLUEPRINT_ANALYST)).toBe('conversation_complex')
  })

  it('agentes conversacionales simples → conversation_simple', () => {
    expect(taskTypeFor(ChatAgent.VITA)).toBe('conversation_simple')
    expect(taskTypeFor(ChatAgent.SOPORTE_IA)).toBe('conversation_simple')
    expect(taskTypeFor(ChatAgent.ESCALATE_HUMAN)).toBe('conversation_simple')
  })

  it('cobertura total: ningún agente cae fuera', () => {
    const valid = new Set(['reasoning', 'creative', 'conversation_complex', 'conversation_simple'])
    for (const agent of Object.values(ChatAgent)) {
      expect(valid.has(taskTypeFor(agent as ChatAgent))).toBe(true)
    }
  })
})

describe('needsPGContext', () => {
  it('agentes que hablan de dinero necesitan P&G', () => {
    expect(needsPGContext(ChatAgent.MENTOR_FINANCIERO)).toBe(true)
    expect(needsPGContext(ChatAgent.MEDIA_BUYER)).toBe(true)
    expect(needsPGContext(ChatAgent.BLUEPRINT_ANALYST)).toBe(true)
    expect(needsPGContext(ChatAgent.OPTIMIZADOR_TIENDA)).toBe(true)
    expect(needsPGContext(ChatAgent.CEO_ADVISOR)).toBe(true)
  })

  it('agentes conversacionales/creativos NO necesitan P&G (ahorra query)', () => {
    expect(needsPGContext(ChatAgent.VITA)).toBe(false)
    expect(needsPGContext(ChatAgent.SOPORTE_IA)).toBe(false)
    expect(needsPGContext(ChatAgent.CREATIVO_MAKER)).toBe(false)
    expect(needsPGContext(ChatAgent.ESCALATE_HUMAN)).toBe(false)
  })
})

describe('temperatureFor', () => {
  it('CREATIVO_MAKER → 0.8 (variedad)', () => {
    expect(temperatureFor(ChatAgent.CREATIVO_MAKER)).toBe(0.8)
  })

  it('resto → 0.3 (determinismo financiero)', () => {
    expect(temperatureFor(ChatAgent.MENTOR_FINANCIERO)).toBe(0.3)
    expect(temperatureFor(ChatAgent.VITA)).toBe(0.3)
    expect(temperatureFor(ChatAgent.MEDIA_BUYER)).toBe(0.3)
  })

  it('temperatura siempre en [0, 1]', () => {
    for (const agent of Object.values(ChatAgent)) {
      const t = temperatureFor(agent as ChatAgent)
      expect(t).toBeGreaterThanOrEqual(0)
      expect(t).toBeLessThanOrEqual(1)
    }
  })
})

describe('shouldEscalateLowConfidence', () => {
  it('escala con confianza <0.5 y urgencia high', () => {
    expect(shouldEscalateLowConfidence(0.4, 'high')).toBe(true)
    expect(shouldEscalateLowConfidence(0.49, 'high')).toBe(true)
  })

  it('escala con urgencia critical aunque sea baja confianza', () => {
    expect(shouldEscalateLowConfidence(0.3, 'critical')).toBe(true)
  })

  it('NO escala con confianza alta (LLM seguro de la respuesta)', () => {
    expect(shouldEscalateLowConfidence(0.5, 'high')).toBe(false)
    expect(shouldEscalateLowConfidence(0.9, 'critical')).toBe(false)
  })

  it('NO escala con urgencia low/medium aunque baja confianza (no urge)', () => {
    expect(shouldEscalateLowConfidence(0.1, 'low')).toBe(false)
    expect(shouldEscalateLowConfidence(0.1, 'medium')).toBe(false)
  })

  it('umbral exacto 0.5 NO escala (estrictamente menor)', () => {
    expect(shouldEscalateLowConfidence(0.5, 'high')).toBe(false)
  })
})

describe('escalationPriorityFor', () => {
  it('critical → URGENT', () => {
    expect(escalationPriorityFor('critical')).toBe('URGENT')
  })

  it('high/medium/low → HIGH (por defecto)', () => {
    expect(escalationPriorityFor('high')).toBe('HIGH')
    expect(escalationPriorityFor('medium')).toBe('HIGH')
    expect(escalationPriorityFor('low')).toBe('HIGH')
  })
})
