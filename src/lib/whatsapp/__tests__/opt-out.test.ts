// V30.1 — tests de opt-out detection + validación MARKETING
import { describe, it, expect } from 'vitest'
import {
  isOptOutMessage,
  isOptInMessage,
  marketingTemplateHasOptOut,
  OPT_OUT_CONFIRMATION_TEXT,
  OPT_IN_CONFIRMATION_TEXT,
  SUGGESTED_MARKETING_FOOTER,
} from '../opt-out'

describe('isOptOutMessage', () => {
  it('detecta palabras clave base', () => {
    expect(isOptOutMessage('STOP')).toBe(true)
    expect(isOptOutMessage('stop')).toBe(true)
    expect(isOptOutMessage('Baja')).toBe(true)
    expect(isOptOutMessage('BAJA')).toBe(true)
    expect(isOptOutMessage('salir')).toBe(true)
    expect(isOptOutMessage('cancelar')).toBe(true)
    expect(isOptOutMessage('unsubscribe')).toBe(true)
    expect(isOptOutMessage('parar')).toBe(true)
  })

  it('tolera espacios y signos de exclamación', () => {
    expect(isOptOutMessage('  STOP  ')).toBe(true)
    expect(isOptOutMessage('stop!')).toBe(true)
    expect(isOptOutMessage('STOP!!!')).toBe(true)
  })

  it('acepta frases multipalabra con acento y sin acento', () => {
    expect(isOptOutMessage('no más')).toBe(true)
    expect(isOptOutMessage('no mas')).toBe(true)
    expect(isOptOutMessage('no molestar')).toBe(true)
    expect(isOptOutMessage('darme de baja')).toBe(true)
  })

  it('no matchea frases largas donde STOP aparece embebido', () => {
    // Diseño: matchea solo mensaje completo STOP, no oraciones largas
    expect(isOptOutMessage('STOP pero quiero más info')).toBe(false)
    expect(isOptOutMessage('por favor no me hagan stop automático')).toBe(false)
  })

  it('no matchea mensajes normales', () => {
    expect(isOptOutMessage('hola')).toBe(false)
    expect(isOptOutMessage('quiero comprar')).toBe(false)
    expect(isOptOutMessage('gracias')).toBe(false)
    expect(isOptOutMessage('si')).toBe(false)
  })

  it('maneja null y undefined', () => {
    expect(isOptOutMessage(null)).toBe(false)
    expect(isOptOutMessage(undefined)).toBe(false)
    expect(isOptOutMessage('')).toBe(false)
  })
})

describe('isOptInMessage', () => {
  it('detecta reactivación', () => {
    expect(isOptInMessage('ALTA')).toBe(true)
    expect(isOptInMessage('alta')).toBe(true)
    expect(isOptInMessage('volver')).toBe(true)
    expect(isOptInMessage('suscribir')).toBe(true)
    expect(isOptInMessage('opt in')).toBe(true)
    expect(isOptInMessage('opt-in')).toBe(true)
    expect(isOptInMessage('resume')).toBe(true)
  })

  it('tolera espacios y bangs', () => {
    expect(isOptInMessage('  alta ')).toBe(true)
    expect(isOptInMessage('alta!')).toBe(true)
  })

  it('no matchea frases arbitrarias', () => {
    expect(isOptInMessage('hola alta mis ventas')).toBe(false)
    expect(isOptInMessage('')).toBe(false)
    expect(isOptInMessage(null)).toBe(false)
  })
})

describe('marketingTemplateHasOptOut', () => {
  it('acepta bodies con disclosure STOP', () => {
    expect(
      marketingTemplateHasOptOut(
        '20% off por 24h. Responde STOP para no recibir más mensajes.',
      ),
    ).toBe(true)
  })

  it('acepta disclosures en español natural', () => {
    expect(
      marketingTemplateHasOptOut('Si ya no deseas recibir, envía BAJA'),
    ).toBe(true)
    expect(
      marketingTemplateHasOptOut('Puedes darse de baja cuando quieras'),
    ).toBe(true)
    expect(
      marketingTemplateHasOptOut('Si no deseas no recibir más, cancela tu suscripción'),
    ).toBe(true)
  })

  it('acepta disclosures en inglés', () => {
    expect(
      marketingTemplateHasOptOut('Reply to unsubscribe anytime'),
    ).toBe(true)
    expect(
      marketingTemplateHasOptOut('Send opt-out to stop'),
    ).toBe(true)
  })

  it('rechaza bodies sin disclosure', () => {
    expect(
      marketingTemplateHasOptOut('20% off por 24 horas. Código PROMO'),
    ).toBe(false)
    expect(
      marketingTemplateHasOptOut('Hola {{1}}, tu pedido está en ruta.'),
    ).toBe(false)
    expect(marketingTemplateHasOptOut('')).toBe(false)
  })

  it('el footer sugerido por defecto cumple', () => {
    expect(marketingTemplateHasOptOut(SUGGESTED_MARKETING_FOOTER)).toBe(true)
  })
})

describe('textos de confirmación', () => {
  it('OPT_OUT_CONFIRMATION_TEXT menciona cómo reactivar', () => {
    expect(OPT_OUT_CONFIRMATION_TEXT.toLowerCase()).toContain('alta')
  })

  it('OPT_IN_CONFIRMATION_TEXT menciona cómo volver a darse de baja', () => {
    expect(OPT_IN_CONFIRMATION_TEXT.toLowerCase()).toContain('stop')
  })
})
