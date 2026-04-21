// V30 — Cliente Meta Graph API para plantillas
// ═══════════════════════════════════════════════════════════
// Sincroniza plantillas aprobadas por Meta con la BD local.
// En MODO MOCK devuelve un set sintético para que el UI funcione
// sin credenciales.
//
// Ref: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates

import { WHATSAPP_MOCK_MODE } from './client'

const META_API_VERSION = 'v21.0'
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

export interface MetaTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phone_number?: string
  }>
}

export interface MetaTemplate {
  id: string
  name: string
  language: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED' | 'PAUSED'
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
  components: MetaTemplateComponent[]
  rejected_reason?: string
}

// Fetch: lista de plantillas de una WABA
export async function fetchMetaTemplates(params: {
  wabaId: string
  accessToken: string
}): Promise<MetaTemplate[]> {
  if (WHATSAPP_MOCK_MODE) {
    return mockTemplates()
  }

  const url = `${META_BASE}/${params.wabaId}/message_templates?fields=id,name,language,status,category,components,rejected_reason&limit=200`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${params.accessToken}` },
  })
  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Meta Graph ${res.status}: ${errBody.slice(0, 300)}`)
  }
  const body = (await res.json()) as { data?: MetaTemplate[] }
  return body.data ?? []
}

// Extrae body/header/footer/buttons de los components
export function extractTemplateContent(components: MetaTemplateComponent[]): {
  headerType: string | null
  headerContent: string | null
  bodyText: string
  footerText: string | null
  buttons: Array<{ type: string; text: string; url?: string }>
} {
  let headerType: string | null = null
  let headerContent: string | null = null
  let bodyText = ''
  let footerText: string | null = null
  const buttons: Array<{ type: string; text: string; url?: string }> = []

  for (const c of components) {
    if (c.type === 'HEADER') {
      headerType = c.format ?? 'TEXT'
      headerContent = c.text ?? null
    } else if (c.type === 'BODY') {
      bodyText = c.text ?? ''
    } else if (c.type === 'FOOTER') {
      footerText = c.text ?? null
    } else if (c.type === 'BUTTONS' && c.buttons) {
      for (const b of c.buttons) {
        buttons.push({
          type: b.type === 'URL' ? 'URL' : 'QUICK_REPLY',
          text: b.text,
          ...(b.url ? { url: b.url } : {}),
        })
      }
    }
  }

  return { headerType, headerContent, bodyText, footerText, buttons }
}

// Set sintético para MODO MOCK
function mockTemplates(): MetaTemplate[] {
  return [
    {
      id: 'mock_tmpl_001',
      name: 'confirmacion_v2',
      language: 'es_CO',
      status: 'APPROVED',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'Hola {{1}}, tu pedido #{{2}} está listo. Responde *SI* para confirmar o *NO* para cancelar.',
        },
        { type: 'FOOTER', text: 'Vitalcom • Tu energía natural' },
      ],
    },
    {
      id: 'mock_tmpl_002',
      name: 'recuperacion_carrito',
      language: 'es_CO',
      status: 'APPROVED',
      category: 'MARKETING',
      components: [
        {
          type: 'BODY',
          text: '{{1}}, dejaste {{2}} en tu carrito. 20% off por 24h con código RECUPERA. Responde *STOP* para no recibir más.',
        },
      ],
    },
    {
      id: 'mock_tmpl_003',
      name: 'despacho_en_ruta',
      language: 'es_CO',
      status: 'APPROVED',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: '📦 Tu pedido #{{1}} salió de bodega. Tracking: {{2}}. Llega en {{3}} días hábiles.',
        },
      ],
    },
  ]
}
