import OpenAI from 'openai'
import { prisma } from '@/lib/db/prisma'
import type { AdPlatform, CreativeAngle, CreativeRatio, Product } from '@prisma/client'

// ── Agente CreativoMaker IA ──────────────────────────────
// Genera variantes de copy + imagen listas para ads a partir
// de un producto Vitalcom. Soporta 8 ángulos psicológicos,
// 3 plataformas y 4 ratios. Imagen vía Cloudinary overlay
// sobre la base del producto (sin bloquear en DALL-E).

const RATIO_DIMS: Record<CreativeRatio, { w: number; h: number }> = {
  SQUARE: { w: 1080, h: 1080 },
  PORTRAIT: { w: 1080, h: 1350 },
  STORY: { w: 1080, h: 1920 },
  LANDSCAPE: { w: 1920, h: 1080 },
}

const ANGLE_BRIEFS: Record<CreativeAngle, { hook: string; style: string }> = {
  BENEFIT: {
    hook: 'Destaca el beneficio #1 del producto en forma directa y emocional',
    style: 'tono aspiracional, lenguaje de ganancia ("descubre", "siente", "logra")',
  },
  PAIN_POINT: {
    hook: 'Pone en palabras el dolor que el cliente vive hoy',
    style: 'empático, identifica el problema primero y luego introduce la solución',
  },
  SOCIAL_PROOF: {
    hook: 'Números reales: testimonios, rating, comunidad Vitalcom',
    style: 'credibilidad, cita implícita, "más de 1.500 personas confían"',
  },
  URGENCY: {
    hook: 'Escasez + oportunidad: stock limitado, oferta por tiempo',
    style: 'CTA fuerte, verbos de acción inmediata, sin sonar spam',
  },
  LIFESTYLE: {
    hook: 'Visión de cómo se siente la vida CON el producto',
    style: 'narrativo, momento del día, escena específica',
  },
  TESTIMONIAL: {
    hook: 'Frase tipo testimonio real en primera persona',
    style: 'auténtico, detalles concretos, sin exagerar',
  },
  BEFORE_AFTER: {
    hook: 'Transformación antes/después del producto',
    style: 'contraste claro, sin promesas médicas, enfocado en sensación',
  },
  PROBLEM_SOLUTION: {
    hook: 'Problema específico → producto como solución directa',
    style: 'lógico, 2 frases: problema + solución con producto',
  },
}

const ANGLE_BG: Record<CreativeAngle, string> = {
  BENEFIT: 'rgb:0A0A0A',
  PAIN_POINT: 'rgb:1F1F1F',
  SOCIAL_PROOF: 'rgb:7FB800',
  URGENCY: 'rgb:C6FF3C',
  LIFESTYLE: 'rgb:141414',
  TESTIMONIAL: 'rgb:2A2A2A',
  BEFORE_AFTER: 'rgb:0A0A0A',
  PROBLEM_SOLUTION: 'rgb:141414',
}

export type CreativeInput = {
  angle: CreativeAngle
  platform: AdPlatform
  ratio: CreativeRatio
  headline: string
  primaryText: string
  description: string
  cta: string
  hashtags: string[]
  imageUrl: string | null
  imagePrompt: string
  score: number
  reasoning: string
}

// ── Cloudinary overlay ───────────────────────────────────
// Genera URL Cloudinary con overlay de color + texto sobre la
// imagen base del producto. Sin upload — usa fetch URL.
function buildCloudinaryCreative(
  baseImageUrl: string | null | undefined,
  angle: CreativeAngle,
  ratio: CreativeRatio,
  headline: string,
): string | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName || !baseImageUrl) return baseImageUrl ?? null

  const { w, h } = RATIO_DIMS[ratio]
  const bg = ANGLE_BG[angle]
  const safeHeadline = headline
    .slice(0, 60)
    .replace(/[,/%&]/g, ' ')
    .trim()
  const encodedHeadline = encodeURIComponent(safeHeadline)

  // Transforms:
  // - c_pad,b_rgb:XXX,w_X,h_Y — canvas con fondo de color por ángulo
  // - l_text:Arial_60_bold:XXX,co_rgb:C6FF3C,g_south,y_80 — overlay del headline
  const transforms = [
    `c_pad,b_${bg},w_${w},h_${h},g_center`,
    `l_text:Arial_${Math.floor(w / 22)}_bold:${encodedHeadline},co_rgb:C6FF3C,g_south,y_${Math.floor(h / 14)},w_${Math.floor(w * 0.8)},c_fit`,
    'f_auto,q_auto',
  ].join('/')

  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms}/${encodeURIComponent(baseImageUrl)}`
}

// ── Fallback sin OpenAI ──────────────────────────────────
function fallbackCopy(
  product: Pick<Product, 'name' | 'description' | 'benefits'>,
  angle: CreativeAngle,
  platform: AdPlatform,
): Pick<CreativeInput, 'headline' | 'primaryText' | 'description' | 'cta' | 'hashtags'> {
  const name = product.name
  const benefits = Array.isArray(product.benefits) ? product.benefits : []
  const firstBenefit =
    benefits[0] && typeof benefits[0] === 'object' && 'title' in (benefits[0] as any)
      ? (benefits[0] as any).title
      : product.description?.slice(0, 80) ?? 'Producto natural Vitalcom'

  const templates: Record<CreativeAngle, { headline: string; primaryText: string; description: string }> = {
    BENEFIT: {
      headline: `${name} — Siente la diferencia`,
      primaryText: `✨ ${firstBenefit}\n\n${name} está hecho 100% con ingredientes naturales Vitalcom.\n\nEscríbenos hoy y empieza tu transformación.`,
      description: 'Envío rápido · Pago contra entrega',
    },
    PAIN_POINT: {
      headline: `¿Cansado de probar sin resultados?`,
      primaryText: `Sabemos lo frustrante que es.\n\n${name} te ofrece ${firstBenefit.toLowerCase()}.\n\nMás de 1.500 personas en Vitalcom ya confían.`,
      description: 'Prueba sin riesgo · Garantía Vitalcom',
    },
    SOCIAL_PROOF: {
      headline: `+1.500 personas confían en ${name}`,
      primaryText: `⭐⭐⭐⭐⭐ Rating 4.8 de la comunidad Vitalcom.\n\n${firstBenefit}.\n\nÚnete a quienes ya sienten la diferencia.`,
      description: 'Comunidad Vitalcom · Resultados reales',
    },
    URGENCY: {
      headline: `Últimas unidades de ${name}`,
      primaryText: `🔥 Stock limitado — envío mismo día.\n\n${firstBenefit}.\n\nNo esperes más, pídelo antes que se agote.`,
      description: 'Oferta por tiempo limitado',
    },
    LIFESTYLE: {
      headline: `Tu mejor versión empieza hoy`,
      primaryText: `Imagina despertar con más energía.\n\n${name} es parte de esa rutina que te hace sentir bien cada día.\n\n${firstBenefit}.`,
      description: 'Bienestar diario · Natural',
    },
    TESTIMONIAL: {
      headline: `"${name} me cambió la vida"`,
      primaryText: `"Llevo 30 días y la diferencia se nota. ${firstBenefit}" — María, cliente Vitalcom.\n\nÚnete a quienes ya comprobaron resultados.`,
      description: 'Testimonio real · Comunidad Vitalcom',
    },
    BEFORE_AFTER: {
      headline: `El cambio que estabas esperando`,
      primaryText: `Antes: cansancio, dudas, resultados a medias.\n\nDespués: ${firstBenefit}.\n\n${name} fue la clave.`,
      description: 'Transformación natural',
    },
    PROBLEM_SOLUTION: {
      headline: `La solución natural a tu rutina`,
      primaryText: `El problema: no encuentras algo que funcione sin efectos.\n\nLa solución: ${name}.\n\n${firstBenefit}.`,
      description: 'Natural · Sin químicos · Vitalcom',
    },
  }

  const base = templates[angle]
  return {
    ...base,
    cta: platform === 'GOOGLE' ? 'LEARN_MORE' : 'BUY_NOW',
    hashtags: ['Vitalcom', 'Bienestar', 'Natural', name.split(' ')[0]].map((t) => t.replace(/\s/g, '')),
  }
}

// ── LLM copy generation ──────────────────────────────────
async function generateCopyWithLLM(
  product: Pick<Product, 'name' | 'description' | 'benefits' | 'category'>,
  angle: CreativeAngle,
  platform: AdPlatform,
): Promise<Pick<CreativeInput, 'headline' | 'primaryText' | 'description' | 'cta' | 'hashtags' | 'reasoning'> | null> {
  if (!process.env.OPENAI_API_KEY) return null

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const brief = ANGLE_BRIEFS[angle]
    const benefits = Array.isArray(product.benefits) ? product.benefits : []

    const prompt = `Producto: ${product.name}
Categoría: ${product.category ?? 'bienestar'}
Descripción: ${product.description ?? 'Producto natural Vitalcom'}
Beneficios: ${JSON.stringify(benefits).slice(0, 400)}

Plataforma: ${platform}
Ángulo: ${angle}
Hook: ${brief.hook}
Estilo: ${brief.style}

Reglas:
- Español neutro LATAM
- Sin promesas médicas ni "cura" "elimina enfermedad"
- Tono auténtico Vitalcom (comunidad de bienestar)
- Optimizado para ${platform} (Meta: 3 párrafos cortos, TikTok: hook fuerte primera línea, Google: directo y claro)

Devuelve JSON:
{
  "headline": "máx 40 chars, hook del ángulo",
  "primaryText": "máx 300 chars, 2-3 párrafos con emoji",
  "description": "máx 60 chars, refuerzo",
  "cta": "BUY_NOW | LEARN_MORE | SHOP_NOW | SIGN_UP | SEND_MESSAGE",
  "hashtags": ["array", "de", "3-5", "tags", "sin", "#"],
  "reasoning": "1 frase explicando por qué este copy funciona con el ángulo"
}`

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres copywriter senior de Vitalcom, experto en ads de bienestar para LATAM. Respondes solo con JSON válido.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    return {
      headline: String(parsed.headline ?? product.name).slice(0, 60),
      primaryText: String(parsed.primaryText ?? '').slice(0, 500),
      description: String(parsed.description ?? '').slice(0, 100),
      cta: String(parsed.cta ?? 'BUY_NOW').toUpperCase(),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 5).map(String) : [],
      reasoning: String(parsed.reasoning ?? `Ángulo ${angle} aplicado al copy.`).slice(0, 200),
    }
  } catch (err) {
    console.error('[creative-maker] LLM error', err)
    return null
  }
}

// ── Image prompt generator (para gpt-image-1/DALL-E futuro) ──
function buildImagePrompt(
  product: Pick<Product, 'name' | 'category'>,
  angle: CreativeAngle,
  ratio: CreativeRatio,
): string {
  const moodMap: Record<CreativeAngle, string> = {
    BENEFIT: 'bright, clean, uplifting with natural light and lime-green accents',
    PAIN_POINT: 'contrast between dim and vibrant, dramatic lighting',
    SOCIAL_PROOF: 'warm, trustworthy, community-focused with soft lighting',
    URGENCY: 'bold, high-contrast, lime-green neon glow, urgent feel',
    LIFESTYLE: 'aspirational lifestyle scene, morning routine, natural environment',
    TESTIMONIAL: 'authentic human portrait, real emotion, warm tones',
    BEFORE_AFTER: 'split composition showing transformation, clear contrast',
    PROBLEM_SOLUTION: 'minimalist problem imagery with product as hero',
  }
  const ratioText =
    ratio === 'SQUARE' ? '1:1 square' :
    ratio === 'PORTRAIT' ? '4:5 portrait' :
    ratio === 'STORY' ? '9:16 vertical story format' : '16:9 landscape'

  return `Professional wellness advertisement for "${product.name}" (${product.category ?? 'bienestar'}), ${ratioText}, ${moodMap[angle]}. Vitalcom brand palette: deep black background, lime-green (#C6FF3C) accents. Modern, premium, dropshipping-friendly. No text overlay — clean product focus.`
}

// ── Score heurístico ─────────────────────────────────────
function computeScore(
  angle: CreativeAngle,
  hasLLM: boolean,
  platform: AdPlatform,
  hasProductImage: boolean,
): number {
  let score = 60
  if (hasLLM) score += 15
  if (hasProductImage) score += 10
  const anglePop: Partial<Record<CreativeAngle, number>> = {
    BENEFIT: 8, SOCIAL_PROOF: 7, PAIN_POINT: 6, TESTIMONIAL: 5,
    URGENCY: 6, LIFESTYLE: 4, BEFORE_AFTER: 3, PROBLEM_SOLUTION: 4,
  }
  score += anglePop[angle] ?? 0
  const platformBoost: Partial<Record<AdPlatform, number>> = { META: 3, TIKTOK: 5, GOOGLE: 2 }
  score += platformBoost[platform] ?? 0
  return Math.min(100, Math.max(0, score))
}

// ── Punto de entrada: genera N creativos para un producto ──
export async function generateCreatives(opts: {
  userId: string
  productId: string
  platform?: AdPlatform
  angles?: CreativeAngle[]
  ratios?: CreativeRatio[]
}): Promise<CreativeInput[]> {
  const product = await prisma.product.findUnique({
    where: { id: opts.productId },
    select: { id: true, name: true, description: true, benefits: true, category: true, images: true },
  })
  if (!product) throw new Error('Producto no encontrado')

  const platform = opts.platform ?? 'META'
  const angles = opts.angles && opts.angles.length > 0
    ? opts.angles
    : (['BENEFIT', 'PAIN_POINT', 'SOCIAL_PROOF', 'URGENCY'] as CreativeAngle[])
  const ratios = opts.ratios && opts.ratios.length > 0 ? opts.ratios : (['SQUARE'] as CreativeRatio[])

  const baseImage = product.images?.[0] ?? null
  const results: CreativeInput[] = []

  for (const angle of angles) {
    for (const ratio of ratios) {
      const llmCopy = await generateCopyWithLLM(product, angle, platform)
      const copy = llmCopy ?? {
        ...fallbackCopy(product, angle, platform),
        reasoning: `Ángulo ${angle} generado con plantilla consistente.`,
      }

      const imageUrl = buildCloudinaryCreative(baseImage, angle, ratio, copy.headline)
      const imagePrompt = buildImagePrompt(product, angle, ratio)
      const score = computeScore(angle, !!llmCopy, platform, !!baseImage)

      results.push({
        angle,
        platform,
        ratio,
        headline: copy.headline,
        primaryText: copy.primaryText,
        description: copy.description ?? '',
        cta: copy.cta ?? 'BUY_NOW',
        hashtags: copy.hashtags ?? [],
        imageUrl,
        imagePrompt,
        score,
        reasoning: copy.reasoning ?? `Ángulo ${angle} aplicado al copy.`,
      })
    }
  }

  return results
}
