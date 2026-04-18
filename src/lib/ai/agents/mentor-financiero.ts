import OpenAI from 'openai'
import type { PnLSummary } from '@/lib/finance/pnl-service'

// ── Agente MentorFinanciero ──────────────────────────────
// Especialista en finanzas del dropshipper. Analiza el P&G y
// genera 2-4 insights accionables priorizados por severidad.

export type Insight = {
  title: string
  message: string
  action?: string
  severity: 'high' | 'medium' | 'low'
  category: 'profit' | 'cost' | 'ads' | 'pricing' | 'scale' | 'risk'
}

const SYSTEM_PROMPT = `Eres el Mentor Financiero de Vitalcom, especializado en dropshipping de productos de bienestar en LATAM (CO/EC/GT/CL).

Tu rol: analizar el P&G del dropshipper y dar 2-4 insights accionables, priorizados por impacto en ganancia neta.

CONTEXTO DE NEGOCIO (benchmarks de dropshipping bienestar en LATAM):
- COGS ideal: <40% del ingreso
- Envío ideal: <10% del ingreso
- Publicidad saludable: 15-25% del ingreso
- Margen neto objetivo: 20-30%
- Devoluciones sanas: <5%
- ROAS mínimo rentable: 3x
- Ticket promedio saludable bienestar: $80k-$150k COP

REGLAS:
- Español claro, tono de coach (cercano, directo, sin jerga financiera compleja)
- Cada insight debe ser ACCIONABLE — incluir qué hacer concretamente
- Priorizar leaks más grandes primero (ej: si publicidad es 40%, ese es el problema #1)
- NUNCA prometer ganancias específicas — usar lenguaje como "podrías reducir X%" o "históricamente esto mejora Y"
- Si el P&G está saludable, felicita y sugiere la siguiente palanca de crecimiento
- Si hay POCO dato (ingreso < $500k COP o 0 órdenes), diagnostica "sin datos suficientes" y sugiere primeras acciones

FORMATO DE RESPUESTA (estricto JSON):
{
  "insights": [
    {
      "title": "Texto breve 3-6 palabras",
      "message": "1-2 oraciones explicando el hallazgo con cifras reales",
      "action": "1 oración con la acción concreta",
      "severity": "high" | "medium" | "low",
      "category": "profit" | "cost" | "ads" | "pricing" | "scale" | "risk"
    }
  ]
}

Devuelve SOLO JSON válido, sin markdown ni explicación extra.`

function buildUserPrompt(summary: PnLSummary): string {
  const ratio = (n: number) => (summary.ingresoBruto > 0 ? ((n / summary.ingresoBruto) * 100).toFixed(1) : '0')

  return `Analiza este P&G del dropshipper para el periodo ${summary.period}:

INGRESOS:
- Ingreso bruto: $${summary.ingresoBruto.toLocaleString('es-CO')} COP
- Órdenes: ${summary.ordersCount}
- Ticket promedio: $${summary.ticketPromedio.toLocaleString('es-CO')} COP

EGRESOS:
- Costo producto (COGS): $${summary.costoProducto.toLocaleString('es-CO')} (${ratio(summary.costoProducto)}%)
- Envío: $${summary.costoEnvio.toLocaleString('es-CO')} (${ratio(summary.costoEnvio)}%)
- Publicidad: $${summary.gastoPublicidad.toLocaleString('es-CO')} (${ratio(summary.gastoPublicidad)}%)
- Devoluciones: $${summary.devoluciones.toLocaleString('es-CO')} (${ratio(summary.devoluciones)}%)
- Otros: $${summary.otrosEgresos.toLocaleString('es-CO')} (${ratio(summary.otrosEgresos)}%)

RESULTADO:
- Ganancia bruta: $${summary.gananciaBruta.toLocaleString('es-CO')} (margen ${summary.margenBruto}%)
- Ganancia neta: $${summary.gananciaNeta.toLocaleString('es-CO')} (margen ${summary.margenNeto}%)
- ROI: ${summary.roi}%

Devuelve 2-4 insights en JSON.`
}

export async function runMentorFinanciero(summary: PnLSummary): Promise<Insight[]> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackInsights(summary)
  }

  // Si el dropshipper no tiene datos suficientes, dar onboarding
  if (summary.ingresoBruto < 100_000 && summary.ordersCount === 0) {
    return [
      {
        title: 'Aún sin ventas registradas',
        message: 'No tienes órdenes en este periodo para analizar. El P&G se construye automáticamente cuando marcas pedidos como ENTREGADOS.',
        action: 'Conecta tu tienda Shopify o registra tu primer pedido desde Mi Tienda.',
        severity: 'medium',
        category: 'scale',
      },
      {
        title: 'Registra tus gastos de ads',
        message: 'Para que el Mentor calcule tu ganancia neta real, registra tu inversión en publicidad aquí mismo (botón "Registrar gasto").',
        action: 'Agrega gastos de Meta, TikTok o Google ads del último mes.',
        severity: 'low',
        category: 'ads',
      },
    ]
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(summary) },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) return fallbackInsights(summary)

    const parsed = JSON.parse(content)
    const insights = Array.isArray(parsed.insights) ? parsed.insights : []

    // Validar estructura básica
    return insights
      .filter((i: any) => i.title && i.message && i.severity)
      .slice(0, 4) as Insight[]
  } catch (err) {
    console.error('[MentorFinanciero] Error:', err)
    return fallbackInsights(summary)
  }
}

/** Insights derivados de reglas — se usan si OpenAI no responde. */
function fallbackInsights(summary: PnLSummary): Insight[] {
  const insights: Insight[] = []
  const ratio = (n: number) => (summary.ingresoBruto > 0 ? (n / summary.ingresoBruto) * 100 : 0)

  if (summary.gananciaNeta < 0) {
    insights.push({
      title: 'Estás perdiendo plata',
      message: `Tu ganancia neta es negativa ($${Math.round(summary.gananciaNeta).toLocaleString('es-CO')}). Gastas más de lo que ingresas.`,
      action: 'Revisa primero publicidad y COGS — son los leaks más grandes típicamente.',
      severity: 'high',
      category: 'profit',
    })
  }

  const adRatio = ratio(summary.gastoPublicidad)
  if (adRatio > 30) {
    insights.push({
      title: 'Publicidad muy alta',
      message: `${adRatio.toFixed(0)}% de tu ingreso se va en ads. El benchmark saludable es 15-25%.`,
      action: 'Pausa los ads con ROAS < 3x y escala solo los ganadores.',
      severity: 'high',
      category: 'ads',
    })
  }

  const cogsRatio = ratio(summary.costoProducto)
  if (cogsRatio > 50) {
    insights.push({
      title: 'Costo de producto elevado',
      message: `Tu COGS es ${cogsRatio.toFixed(0)}% del ingreso. El objetivo es <40%.`,
      action: 'Sube precios de venta o enfócate en productos con más margen.',
      severity: 'medium',
      category: 'pricing',
    })
  }

  if (summary.gananciaNeta > 0 && summary.margenNeto >= 20 && insights.length === 0) {
    insights.push({
      title: '¡Tu negocio es rentable!',
      message: `Margen neto ${summary.margenNeto}% en ${summary.ordersCount} órdenes. Estás sobre el benchmark de la industria.`,
      action: 'Ahora enfócate en escalar — dobla budget en tus campañas ganadoras.',
      severity: 'low',
      category: 'scale',
    })
  }

  if (insights.length === 0) {
    insights.push({
      title: 'P&G saludable',
      message: 'Tus ratios están en rango normal. Sigue monitoreando semanalmente.',
      action: 'Registra tus gastos de ads para un análisis más profundo.',
      severity: 'low',
      category: 'profit',
    })
  }

  return insights
}
