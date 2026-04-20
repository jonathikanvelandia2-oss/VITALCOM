import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// ── POST /api/campaigns/drafts/[id]/suggest ──────────────
// Genera sugerencias de creativo (headline, primaryText, description)
// con OpenAI a partir del producto vinculado al draft.
// Si no hay API key, devuelve plantilla estática consistente.

type Suggestion = {
  headline: string
  primaryText: string
  description: string
}

function fallbackSuggestion(productName: string, benefit: string, platform: string): Suggestion {
  return {
    headline: `${productName} — Bienestar Vitalcom`,
    primaryText:
      `${benefit}\n\n` +
      `✅ Producto 100% Vitalcom\n` +
      `✅ Envío a todo el país\n` +
      `✅ Garantía de calidad\n\n` +
      `Escríbenos hoy y empieza tu transformación.`,
    description: `Envío rápido · Pago contra entrega · ${platform === 'TIKTOK' ? 'Más de 1.500 clientes nos prefieren' : 'Respaldado por comunidad Vitalcom'}`,
  }
}

export const POST = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params

  const draft = await prisma.campaignDraft.findFirst({
    where: { id, userId: session.id },
    include: {
      product: { select: { name: true, description: true, benefits: true, category: true, tags: true } },
    },
  })
  if (!draft) return apiError('Borrador no encontrado', 404, 'NOT_FOUND')
  if (!draft.product) return apiError('Selecciona un producto primero', 400, 'NO_PRODUCT')

  const productName = draft.product.name
  const benefits = Array.isArray(draft.product.benefits) ? draft.product.benefits : []
  const firstBenefit =
    typeof benefits[0] === 'object' && benefits[0] !== null && 'title' in (benefits[0] as any)
      ? `${(benefits[0] as any).title}: ${(benefits[0] as any).description ?? ''}`
      : draft.product.description ?? 'Producto natural de alta calidad'

  if (!process.env.OPENAI_API_KEY) {
    return apiSuccess({ suggestion: fallbackSuggestion(productName, firstBenefit, draft.platform) })
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const prompt = `Genera creativo para una campaña de ${draft.platform} con objetivo ${draft.objective}.
Producto: ${productName}
Descripción: ${draft.product.description ?? 'Producto de bienestar Vitalcom'}
Beneficios: ${JSON.stringify(benefits).slice(0, 400)}
País: ${draft.targetCountry ?? 'LATAM'}
Audiencia: ${draft.ageMin}-${draft.ageMax} años, ${draft.gender ?? 'ALL'}

Devuelve JSON con:
- headline (máx 40 caracteres, hook potente)
- primaryText (máx 300 caracteres, 3 párrafos con emoji)
- description (máx 60 caracteres, refuerzo de confianza)

Reglas: español neutro LATAM, sin promesas médicas, tono cercano y auténtico.`

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres copywriter experto en ads de bienestar para Vitalcom. Respondes solo con JSON válido.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as Partial<Suggestion>
    const suggestion: Suggestion = {
      headline: parsed.headline || productName,
      primaryText: parsed.primaryText || firstBenefit,
      description: parsed.description || 'Envío rápido · Pago contra entrega',
    }
    return apiSuccess({ suggestion })
  } catch (err) {
    console.error('[suggest] OpenAI error', err)
    return apiSuccess({ suggestion: fallbackSuggestion(productName, firstBenefit, draft.platform) })
  }
})
