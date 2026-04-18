import OpenAI from 'openai'
import type { BlueprintDiagnostic } from '@/lib/blueprint/blueprint-service'

// ── Agente BlueprintAnalyst ──────────────────────────────
// Recibe un diagnóstico 0-100 y devuelve 5 acciones semanales
// priorizadas por impacto en el score. Inspirado en ConvertMate
// ("5 acciones concretas esta semana") + pipeline AI-first.

export type BlueprintAction = {
  order: number
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'quick' | 'medium' | 'deep'
  category: 'profit' | 'ads' | 'offer' | 'activity' | 'quality' | 'scale'
  link?: string
  linkLabel?: string
}

const SYSTEM_PROMPT = `Eres el Estratega Blueprint de Vitalcom. Diseñas planes de acción semanales para dropshippers de bienestar en LATAM (CO/EC/GT/CL) que venden productos Vitalcom.

Tu misión: recibir un diagnóstico 0-100 con 5 pilares y devolver EXACTAMENTE 5 acciones concretas y accionables esta semana.

CONTEXTO VITALCOM:
- Los dropshippers tienen Mi P&G (/mi-pyg), Catálogo (/herramientas/catalogo), Calculadora (/herramientas/calculadora), Pedidos (/pedidos), Cursos (/cursos), MentorFinanciero.
- Los productos ganadores salen de /herramientas/catalogo + /rendimiento
- El objetivo final es subir el score hacia 85+ (tier "Árbol").

BENCHMARKS LATAM bienestar:
- Margen neto ideal: 20-30%
- Ads ideal: 15-25% del ingreso
- COGS ideal: <40%
- Devoluciones: <5%
- 5+ productos activos es saludable

REGLAS DE LAS 5 ACCIONES:
1. PRIORIZAR el pilar con menor score (mayor impacto en subir el score)
2. Cada acción debe ser ejecutable en 1 semana (no objetivos vagos)
3. Incluir link interno a la herramienta Vitalcom que acompañe la acción cuando aplique
4. Tono: coach directo, español cercano, sin jerga, sin promesas de dinero
5. Si el score es bajo (<40), foco en fundamentos: activar ventas, registrar ads, estabilizar COGS
6. Si el score es alto (>70), foco en escalar: subir budget, agregar productos, automatizar

CATEGORÍAS permitidas: profit, ads, offer, activity, quality, scale
IMPACTO: high (sube >5 pts del score), medium (3-5 pts), low (<3 pts)
ESFUERZO: quick (<30 min), medium (1-3 hrs), deep (todo el día o más)
LINKS útiles: /mi-pyg, /pedidos, /herramientas/catalogo, /herramientas/calculadora, /rendimiento, /cursos, /asistente

FORMATO JSON (estricto):
{
  "actions": [
    {
      "order": 1,
      "title": "Texto breve 4-8 palabras",
      "description": "1-2 oraciones con la acción concreta y el por qué",
      "impact": "high" | "medium" | "low",
      "effort": "quick" | "medium" | "deep",
      "category": "profit" | "ads" | "offer" | "activity" | "quality" | "scale",
      "link": "/ruta-interna-vitalcom" (opcional),
      "linkLabel": "Texto del botón" (opcional, requerido si hay link)
    }
  ]
}

Devuelve SOLO JSON válido. EXACTAMENTE 5 acciones.`

function buildUserPrompt(d: BlueprintDiagnostic): string {
  const pillarsStr = d.pillars
    .map((p) => `- ${p.label}: ${p.score}/${p.max} (${p.status}) — ${p.note}`)
    .join('\n')

  return `Analiza este diagnóstico del dropshipper y genera las 5 acciones de esta semana:

SCORE GLOBAL: ${d.score}/100 — Tier ${d.tier}
Periodo: ${d.period}

PILARES:
${pillarsStr}

SEÑALES:
- Ingreso bruto: $${d.signals.ingresoBruto.toLocaleString('es-CO')} COP
- Ganancia neta: $${d.signals.gananciaNeta.toLocaleString('es-CO')} COP (margen ${d.signals.margenNeto.toFixed(1)}%)
- Órdenes: ${d.signals.ordersCount} (ticket $${d.signals.ticketPromedio.toLocaleString('es-CO')})
- Publicidad: $${d.signals.gastoPublicidad.toLocaleString('es-CO')} (${d.signals.adsRatio.toFixed(1)}% del ingreso)
- Productos vendidos: ${d.signals.productsSold}
- Concentración top producto: ${d.signals.topProductShare.toFixed(0)}%
- Devoluciones: ${d.signals.devolucionesRatio.toFixed(1)}% del ingreso

COMUNIDAD VITALCOM:
- Ticket promedio comunidad: $${d.community.avgTicket.toLocaleString('es-CO')} COP
- Tu ticket vs comunidad: ${d.community.relativeActivity}
- Dropshippers activos: ${d.community.totalDropshippers}

Devuelve las 5 acciones en JSON.`
}

export async function runBlueprintAnalyst(diagnostic: BlueprintDiagnostic): Promise<BlueprintAction[]> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackActions(diagnostic)
  }

  // Si no hay datos suficientes, dar onboarding
  if (diagnostic.signals.ordersCount === 0 && diagnostic.signals.ingresoBruto === 0) {
    return onboardingActions()
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(diagnostic) },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) return fallbackActions(diagnostic)

    const parsed = JSON.parse(content)
    const actions = Array.isArray(parsed.actions) ? parsed.actions : []

    return actions
      .filter((a: any) => a.title && a.description && a.impact)
      .slice(0, 5)
      .map((a: any, i: number) => ({
        order: a.order ?? i + 1,
        title: a.title,
        description: a.description,
        impact: a.impact,
        effort: a.effort ?? 'medium',
        category: a.category ?? 'scale',
        link: a.link,
        linkLabel: a.linkLabel,
      })) as BlueprintAction[]
  } catch (err) {
    console.error('[BlueprintAnalyst] Error:', err)
    return fallbackActions(diagnostic)
  }
}

function onboardingActions(): BlueprintAction[] {
  return [
    {
      order: 1,
      title: 'Explora el catálogo Vitalcom',
      description: 'Revisa los 200+ productos disponibles y marca 3-5 que te interesan para iniciar tu tienda.',
      impact: 'high',
      effort: 'quick',
      category: 'offer',
      link: '/herramientas/catalogo',
      linkLabel: 'Ver catálogo',
    },
    {
      order: 2,
      title: 'Calcula precios de tus primeros productos',
      description: 'Usa la calculadora con el país objetivo para definir precio final y margen real.',
      impact: 'high',
      effort: 'quick',
      category: 'profit',
      link: '/herramientas/calculadora',
      linkLabel: 'Abrir calculadora',
    },
    {
      order: 3,
      title: 'Haz el curso Fundamentos del Dropshipping',
      description: 'Construye la base: diferenciador, audiencia, canales de tráfico, manejo de objeciones.',
      impact: 'medium',
      effort: 'deep',
      category: 'scale',
      link: '/cursos',
      linkLabel: 'Ver cursos',
    },
    {
      order: 4,
      title: 'Crea tu primer pedido de prueba',
      description: 'Registra una orden manual o sincroniza tu Shopify para empezar a mover métricas reales.',
      impact: 'high',
      effort: 'medium',
      category: 'activity',
      link: '/pedidos',
      linkLabel: 'Crear pedido',
    },
    {
      order: 5,
      title: 'Activa tu P&G con gastos reales',
      description: 'Registra tu inversión en ads (aunque sea poca) para que el Mentor te muestre métricas reales.',
      impact: 'medium',
      effort: 'quick',
      category: 'ads',
      link: '/mi-pyg',
      linkLabel: 'Ir a Mi P&G',
    },
  ]
}

function fallbackActions(d: BlueprintDiagnostic): BlueprintAction[] {
  const weakest = [...d.pillars].sort((a, b) => (a.score / a.max) - (b.score / b.max))[0]
  const actions: BlueprintAction[] = []

  // Acción prioritaria basada en el pilar más débil
  if (weakest.id === 'profitability' && d.signals.margenNeto < 15) {
    actions.push({
      order: 1,
      title: 'Audita tus costos esta semana',
      description: `Tu margen neto está en ${d.signals.margenNeto.toFixed(1)}%. Abre Mi P&G y revisa qué egreso se lleva más — típicamente ads o envío.`,
      impact: 'high',
      effort: 'medium',
      category: 'profit',
      link: '/mi-pyg',
      linkLabel: 'Abrir P&G',
    })
  } else if (weakest.id === 'ads') {
    actions.push({
      order: 1,
      title: 'Registra tu inversión en ads',
      description: 'Sin registrar ads, el P&G no refleja tu rentabilidad real. Agrega el gasto en Mi P&G.',
      impact: 'high',
      effort: 'quick',
      category: 'ads',
      link: '/mi-pyg',
      linkLabel: 'Registrar gasto',
    })
  } else if (weakest.id === 'offer') {
    actions.push({
      order: 1,
      title: 'Suma productos ganadores a tu tienda',
      description: `Solo tienes ${d.signals.productsSold} producto(s) activo(s). Agrega 2-3 más desde el catálogo.`,
      impact: 'high',
      effort: 'medium',
      category: 'offer',
      link: '/herramientas/catalogo',
      linkLabel: 'Ver catálogo',
    })
  } else if (weakest.id === 'activity') {
    actions.push({
      order: 1,
      title: 'Sube el volumen de pedidos',
      description: 'Tienes ritmo bajo esta semana. Programa 3 publicaciones orgánicas o una campaña de ads piloto.',
      impact: 'high',
      effort: 'medium',
      category: 'activity',
      link: '/asistente',
      linkLabel: 'Consultar a VITA',
    })
  } else {
    actions.push({
      order: 1,
      title: 'Revisa devoluciones recientes',
      description: `Tu ratio de devoluciones es ${d.signals.devolucionesRatio.toFixed(1)}%. Audita los últimos pedidos devueltos.`,
      impact: 'high',
      effort: 'medium',
      category: 'quality',
      link: '/pedidos',
      linkLabel: 'Ver pedidos',
    })
  }

  actions.push({
    order: 2,
    title: 'Recalcula precios con la calculadora',
    description: 'Confirma que tu precio final cubre ads + envío + margen objetivo 20-30%.',
    impact: 'medium',
    effort: 'quick',
    category: 'profit',
    link: '/herramientas/calculadora',
    linkLabel: 'Abrir calculadora',
  })

  actions.push({
    order: 3,
    title: 'Consulta el Mentor Financiero',
    description: 'Revisa los insights que el Mentor generó sobre tu P&G y aplica el primero esta semana.',
    impact: 'medium',
    effort: 'quick',
    category: 'profit',
    link: '/mi-pyg',
    linkLabel: 'Ver insights',
  })

  actions.push({
    order: 4,
    title: 'Mira los productos ganadores de la comunidad',
    description: 'Hay productos que otros dropshippers están moviendo mejor. Súmalos si encajan con tu tienda.',
    impact: 'medium',
    effort: 'quick',
    category: 'offer',
    link: '/rendimiento',
    linkLabel: 'Ver ganadores',
  })

  actions.push({
    order: 5,
    title: 'Completa una lección del curso',
    description: 'Suma 5 pts de XP y una habilidad nueva. El curso intermedio cubre marketing wellness.',
    impact: 'low',
    effort: 'medium',
    category: 'scale',
    link: '/cursos',
    linkLabel: 'Ver cursos',
  })

  return actions
}
