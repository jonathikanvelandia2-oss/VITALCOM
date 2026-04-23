// V36 — POST /api/products/[id]/generate-copy
// Genera 3 variantes de copy de venta (headline + body + CTA) listas para
// copiar a Meta Ads, TikTok y caption de Shopify. Usa OpenAI si hay API
// key; si no, cae a un template determinista para nunca bloquear al user.

import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { guardRateLimit } from '@/lib/security/rate-limit'
import { prisma } from '@/lib/db/prisma'
import { SALES_ANGLE_HINTS } from '@/lib/catalog/product-detail'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const schema = z.object({
  angle: z.string().min(2).max(40),
  platform: z.enum(['instagram', 'tiktok', 'shopify', 'whatsapp']).default('instagram'),
})

type CopyVariant = {
  headline: string
  body: string
  cta: string
  hashtags: string[]
}

export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  // Protección de costo LLM — 10 copy/hora por dropshipper
  const blocked = guardRateLimit(`gen-copy:${session.id}`, { maxRequests: 10, windowMs: 60 * 60 * 1000 })
  if (blocked) return blocked

  const body = await req.json().catch(() => ({}))
  const data = schema.parse(body)

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, category: true, benefits: true, active: true },
  })
  if (!product || !product.active) return apiError('Producto no encontrado', 404, 'NOT_FOUND')

  const angleHint = SALES_ANGLE_HINTS.find((a) => a.key === data.angle) ?? SALES_ANGLE_HINTS[0]

  const variants = await generateVariants({
    productName: product.name,
    productDescription: product.description ?? '',
    category: product.category ?? 'bienestar',
    angleKey: angleHint.key,
    angleHook: angleHint.hook,
    platform: data.platform,
  })

  return apiSuccess({
    productId: id,
    angle: angleHint.key,
    platform: data.platform,
    variants,
    generatedWithLlm: Boolean(process.env.OPENAI_API_KEY),
  })
})

async function generateVariants(input: {
  productName: string
  productDescription: string
  category: string
  angleKey: string
  angleHook: string
  platform: 'instagram' | 'tiktok' | 'shopify' | 'whatsapp'
}): Promise<CopyVariant[]> {
  if (!process.env.OPENAI_API_KEY) {
    return deterministicFallback(input)
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const sys = `Eres un copywriter experto para dropshippers LATAM. Produces copy en ESPAÑOL NEUTRO para vender productos de bienestar Vitalcom. Eres concreto, sin promesas médicas, con CTAs claros.`

    const user = `Producto: ${input.productName}
Categoría: ${input.category}
Descripción: ${input.productDescription || '(sin descripción disponible)'}
Ángulo de venta: ${input.angleKey}
Hook: ${input.angleHook}
Plataforma destino: ${input.platform}

Genera 3 variantes de copy, cada una con:
- headline (máx 8 palabras)
- body (máx 40 palabras)
- cta (máx 5 palabras)
- hashtags (array de 5 strings sin #)

Devuelve SOLO un JSON con la clave "variants": [{headline, body, cta, hashtags}].`

    const resp = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 800,
    })

    const raw = resp.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as { variants?: CopyVariant[] }
    if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      return deterministicFallback(input)
    }
    return parsed.variants.slice(0, 3).map(normalizeVariant)
  } catch {
    return deterministicFallback(input)
  }
}

function normalizeVariant(v: Partial<CopyVariant>): CopyVariant {
  return {
    headline: String(v.headline ?? '').slice(0, 100),
    body: String(v.body ?? '').slice(0, 400),
    cta: String(v.cta ?? 'Pídelo ahora').slice(0, 40),
    hashtags: Array.isArray(v.hashtags) ? v.hashtags.map((h) => String(h).replace(/^#/, '')).slice(0, 8) : [],
  }
}

type Triplet = Array<{ headline: string; body: string; cta: string }>

function deterministicFallback(input: {
  productName: string
  angleKey: string
  category: string
  platform: string
}): CopyVariant[] {
  // Fallback sin LLM — 3 variantes armadas con templates según ángulo.
  // Mantiene al menos valor utilitario cuando OpenAI no está disponible.
  const name = input.productName
  const cat = input.category.toLowerCase()

  const base: Record<string, Triplet> = {
    BENEFIT: [
      { headline: `${name} — bienestar real`, body: `Suma ${name} a tu rutina y siente el cambio en días. Calidad Vitalcom, respaldo de comunidad.`, cta: 'Pide el tuyo' },
      { headline: `Descubre lo que ${name} puede lograr`, body: `Formulación premium, pensada para quienes buscan resultados reales sin complicaciones.`, cta: 'Más información' },
      { headline: `${name}: tu próximo imprescindible`, body: `El producto que ya eligió la comunidad Vitalcom para cuidar su ${cat}.`, cta: 'Conocer ahora' },
    ],
    PAIN_POINT: [
      { headline: `¿Cansado de lo que no funciona?`, body: `${name} es para ti. Resultados visibles, sin humo ni promesas imposibles.`, cta: 'Probar hoy' },
      { headline: `Esto es lo que nadie te cuenta`, body: `Probaste de todo y nada funcionó. ${name} aborda el problema desde la raíz.`, cta: 'Saber más' },
      { headline: `El final de buscar sin encontrar`, body: `${name}, la alternativa que sí cumple. Pruébalo 7 días y nota la diferencia.`, cta: 'Comprar ahora' },
    ],
    SOCIAL_PROOF: [
      { headline: `Más de 800 personas lo confirman`, body: `La comunidad Vitalcom ya eligió ${name}. Únete y descubre por qué lo recomiendan.`, cta: 'Ver reseñas' },
      { headline: `Por qué todos hablan de ${name}`, body: `Rating 4.7/5 en nuestra comunidad. Resultados reales, avalados por quienes ya lo probaron.`, cta: 'Pedir el mío' },
      { headline: `La elección de la comunidad`, body: `${name} llegó para quedarse: lo confirman miles de clientes Vitalcom en 4 países.`, cta: 'Unirme también' },
    ],
  }

  const pool = base[input.angleKey] ?? base.BENEFIT
  return pool.map((p) => ({
    ...p,
    hashtags: ['vitalcom', 'bienestar', cat.replace(/\s+/g, ''), 'dropshipping', 'latam'],
  }))
}
