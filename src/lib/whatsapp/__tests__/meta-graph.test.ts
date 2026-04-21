// V30.1 — tests de meta-graph (extractTemplateContent + mock mode)
// Importante: WHATSAPP_MOCK_MODE se evalúa en tiempo de import de client.ts,
// por lo que este env var debe setearse ANTES del import.
process.env.WHATSAPP_MOCK_MODE = 'true'

import { describe, it, expect } from 'vitest'
import {
  extractTemplateContent,
  fetchMetaTemplates,
  type MetaTemplateComponent,
} from '../meta-graph'

describe('extractTemplateContent', () => {
  it('extrae body simple', () => {
    const components: MetaTemplateComponent[] = [
      { type: 'BODY', text: 'Hola {{1}}' },
    ]
    const result = extractTemplateContent(components)
    expect(result.bodyText).toBe('Hola {{1}}')
    expect(result.headerType).toBeNull()
    expect(result.footerText).toBeNull()
    expect(result.buttons).toEqual([])
  })

  it('extrae header TEXT', () => {
    const components: MetaTemplateComponent[] = [
      { type: 'HEADER', format: 'TEXT', text: 'Bienvenido' },
      { type: 'BODY', text: 'Contenido' },
    ]
    const result = extractTemplateContent(components)
    expect(result.headerType).toBe('TEXT')
    expect(result.headerContent).toBe('Bienvenido')
    expect(result.bodyText).toBe('Contenido')
  })

  it('extrae header IMAGE sin text', () => {
    const components: MetaTemplateComponent[] = [
      { type: 'HEADER', format: 'IMAGE' },
      { type: 'BODY', text: 'Contenido' },
    ]
    const result = extractTemplateContent(components)
    expect(result.headerType).toBe('IMAGE')
    expect(result.headerContent).toBeNull()
  })

  it('extrae footer', () => {
    const components: MetaTemplateComponent[] = [
      { type: 'BODY', text: 'Cuerpo' },
      { type: 'FOOTER', text: 'Responde STOP para cancelar' },
    ]
    const result = extractTemplateContent(components)
    expect(result.footerText).toBe('Responde STOP para cancelar')
  })

  it('extrae botones QUICK_REPLY', () => {
    const components: MetaTemplateComponent[] = [
      { type: 'BODY', text: 'Confirma' },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: 'Sí' },
          { type: 'QUICK_REPLY', text: 'No' },
        ],
      },
    ]
    const result = extractTemplateContent(components)
    expect(result.buttons).toHaveLength(2)
    expect(result.buttons[0]).toEqual({ type: 'QUICK_REPLY', text: 'Sí' })
    expect(result.buttons[1]).toEqual({ type: 'QUICK_REPLY', text: 'No' })
  })

  it('extrae botón URL con url preservada', () => {
    const components: MetaTemplateComponent[] = [
      { type: 'BODY', text: 'Ir a tracking' },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'URL', text: 'Ver pedido', url: 'https://example.com/{{1}}' },
        ],
      },
    ]
    const result = extractTemplateContent(components)
    expect(result.buttons[0]).toEqual({
      type: 'URL',
      text: 'Ver pedido',
      url: 'https://example.com/{{1}}',
    })
  })

  it('normaliza tipos de botón desconocidos a QUICK_REPLY', () => {
    const components: MetaTemplateComponent[] = [
      { type: 'BODY', text: 'Llama ahora' },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'PHONE_NUMBER', text: 'Llamar', phone_number: '+573001234567' },
        ],
      },
    ]
    const result = extractTemplateContent(components)
    expect(result.buttons[0].type).toBe('QUICK_REPLY')
    expect(result.buttons[0].text).toBe('Llamar')
  })

  it('tolera components vacíos', () => {
    const result = extractTemplateContent([])
    expect(result.bodyText).toBe('')
    expect(result.headerType).toBeNull()
    expect(result.footerText).toBeNull()
    expect(result.buttons).toEqual([])
  })

  it('maneja body sin text (edge)', () => {
    const components: MetaTemplateComponent[] = [
      { type: 'BODY' },
    ]
    const result = extractTemplateContent(components)
    expect(result.bodyText).toBe('')
  })
})

describe('fetchMetaTemplates en MOCK mode', () => {
  it('devuelve 3 plantillas sintéticas sin credenciales reales', async () => {
    const templates = await fetchMetaTemplates({
      wabaId: 'fake',
      accessToken: 'fake',
    })
    // MOCK mode se activa si META_APP_SECRET no está definido (ver client.ts)
    // En entorno de test debería devolver los 3 mocks
    expect(templates.length).toBeGreaterThanOrEqual(3)
    const names = templates.map(t => t.name)
    expect(names).toContain('confirmacion_v2')
    expect(names).toContain('recuperacion_carrito')
    expect(names).toContain('despacho_en_ruta')
  })

  it('las mocks incluyen al menos una MARKETING con opt-out', async () => {
    const templates = await fetchMetaTemplates({
      wabaId: 'fake',
      accessToken: 'fake',
    })
    const marketing = templates.find(t => t.category === 'MARKETING')
    expect(marketing).toBeDefined()
    const body = marketing!.components.find(c => c.type === 'BODY')?.text ?? ''
    expect(body.toLowerCase()).toContain('stop')
  })

  it('todas las mocks tienen status APPROVED', async () => {
    const templates = await fetchMetaTemplates({
      wabaId: 'fake',
      accessToken: 'fake',
    })
    for (const t of templates) {
      expect(t.status).toBe('APPROVED')
    }
  })
})
