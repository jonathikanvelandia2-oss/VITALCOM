// V30.1 — tests del clasificador de intenciones (9 agentes)
import { describe, it, expect } from 'vitest'
import { classify } from '../intent-classifier'

describe('classify — ESCALATE_HUMAN', () => {
  it('detecta reclamos legales', () => {
    const r = classify('voy a demandar a la empresa')
    expect(r.agent).toBe('ESCALATE_HUMAN')
    expect(r.shouldEscalate).toBe(true)
    expect(r.urgency).toBe('critical')
  })

  it('detecta doble cobro', () => {
    const r = classify('me cobraron dos veces el mismo pedido')
    expect(r.agent).toBe('ESCALATE_HUMAN')
    expect(r.urgency).toBe('critical')
  })

  it('detecta petición explícita de humano', () => {
    const r = classify('quiero hablar con una persona')
    expect(r.agent).toBe('ESCALATE_HUMAN')
  })

  it('detecta estafa/fraude', () => {
    const r = classify('esto es una estafa')
    expect(r.agent).toBe('ESCALATE_HUMAN')
    expect(r.shouldEscalate).toBe(true)
  })

  it('detecta reembolso como escalación', () => {
    const r = classify('quiero que me devuelvan el dinero')
    expect(r.agent).toBe('ESCALATE_HUMAN')
  })
})

describe('classify — MENTOR_FINANCIERO', () => {
  it('detecta P&G', () => {
    const r = classify('muéstrame el P&G del mes')
    expect(r.agent).toBe('MENTOR_FINANCIERO')
  })

  it('detecta pérdidas con urgencia alta', () => {
    const r = classify('estoy perdiendo plata con las campañas')
    expect(r.agent).toBe('MENTOR_FINANCIERO')
    expect(r.urgency).toBe('high')
  })

  it('detecta educativo sobre ROAS', () => {
    const r = classify('qué es el roas')
    expect(r.agent).toBe('MENTOR_FINANCIERO')
  })

  it('detecta breakeven', () => {
    const r = classify('cuál es mi punto de equilibrio')
    expect(r.agent).toBe('MENTOR_FINANCIERO')
  })
})

describe('classify — MEDIA_BUYER', () => {
  it('detecta problemas con campañas', () => {
    const r = classify('la campaña está mal')
    expect(r.agent).toBe('MEDIA_BUYER')
  })

  it('detecta plataformas de ads', () => {
    const r = classify('lanzar un anuncio en meta ads')
    expect(r.agent).toBe('MEDIA_BUYER')
  })

  it('detecta métricas ads', () => {
    const r = classify('mi CPA está muy alto')
    expect(r.agent).toBe('MEDIA_BUYER')
  })

  it('detecta presupuesto ads', () => {
    const r = classify('cuánto debo gastar en meta ads')
    expect(r.agent).toBe('MEDIA_BUYER')
  })
})

describe('classify — CREATIVO_MAKER', () => {
  it('detecta copy', () => {
    const r = classify('escribe un anuncio para mi producto')
    expect(r.agent).toBe('CREATIVO_MAKER')
  })

  it('detecta ángulos / hooks', () => {
    const r = classify('dame ideas de hooks')
    expect(r.agent).toBe('CREATIVO_MAKER')
  })

  it('detecta headline', () => {
    const r = classify('necesito un headline mejor')
    expect(r.agent).toBe('CREATIVO_MAKER')
  })
})

describe('classify — OPTIMIZADOR_TIENDA', () => {
  it('detecta conversión', () => {
    const r = classify('mi landing no convierte')
    expect(r.agent).toBe('OPTIMIZADOR_TIENDA')
  })

  it('detecta cross-sell', () => {
    const r = classify('quiero armar un bundle')
    expect(r.agent).toBe('OPTIMIZADOR_TIENDA')
  })

  it('detecta pricing', () => {
    const r = classify('cuál es el mejor precio para mi producto')
    expect(r.agent).toBe('OPTIMIZADOR_TIENDA')
  })

  it('detecta restock', () => {
    const r = classify('necesito hacer restock de mi producto estrella')
    expect(r.agent).toBe('OPTIMIZADOR_TIENDA')
  })
})

describe('classify — BLUEPRINT_ANALYST', () => {
  it('detecta blueprint explícito', () => {
    const r = classify('hazme el blueprint de mi tienda')
    expect(r.agent).toBe('BLUEPRINT_ANALYST')
  })

  it('detecta cómo va mi negocio', () => {
    const r = classify('cómo está mi tienda')
    expect(r.agent).toBe('BLUEPRINT_ANALYST')
  })
})

describe('classify — SOPORTE_IA', () => {
  it('detecta problemas de acceso', () => {
    const r = classify('no puedo entrar a mi cuenta')
    expect(r.agent).toBe('SOPORTE_IA')
  })

  it('detecta reset de contraseña', () => {
    const r = classify('olvidé mi contraseña')
    expect(r.agent).toBe('SOPORTE_IA')
  })

  it('detecta cómo usar', () => {
    const r = classify('cómo uso la calculadora')
    expect(r.agent).toBe('SOPORTE_IA')
  })
})

describe('classify — VITA (default)', () => {
  it('detecta saludos', () => {
    const r = classify('hola')
    expect(r.agent).toBe('VITA')
  })

  it('detecta consulta de catálogo', () => {
    const r = classify('mostrame el catalogo')
    expect(r.agent).toBe('VITA')
  })

  it('cae a VITA default con confianza baja si nada matchea', () => {
    const r = classify('xjksdfa qweru poiwq')
    expect(r.agent).toBe('VITA')
    expect(r.confidence).toBeLessThanOrEqual(0.5)
  })
})

describe('classify — boost de urgencia', () => {
  it('eleva urgencia con palabra "urgente"', () => {
    const base = classify('mi landing no convierte')
    const boosted = classify('mi landing no convierte, urgente')
    const order = ['low', 'medium', 'high', 'critical']
    expect(order.indexOf(boosted.urgency)).toBeGreaterThanOrEqual(
      order.indexOf(base.urgency),
    )
  })

  it('eleva 2 pasos con "crítico"', () => {
    // Saludo (low base) + booster "crítico" (+2) → debería quedar ≥ high
    const boosted = classify('hola tengo una emergencia crítico')
    expect(['high', 'critical']).toContain(boosted.urgency)
  })
})

describe('classify — shouldEscalate', () => {
  it('escala si urgency = critical', () => {
    const r = classify('emergencia crítica, estoy perdiendo dinero urgente')
    expect(r.shouldEscalate).toBe(true)
  })

  it('NO escala si urgency < critical y agent != ESCALATE_HUMAN', () => {
    const r = classify('hola')
    expect(r.shouldEscalate).toBe(false)
  })
})

describe('classify — confianza normalizada', () => {
  it('confidence siempre en [0,1]', () => {
    const samples = [
      'hola',
      'me cobraron mil veces y es una estafa legal ya',
      'cuanto gane',
      'no entiendo nada de esto',
    ]
    for (const s of samples) {
      const r = classify(s)
      expect(r.confidence).toBeGreaterThanOrEqual(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
    }
  })
})
