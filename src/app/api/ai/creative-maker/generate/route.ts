import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { generateCreatives } from '@/lib/ai/agents/creative-maker'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/creative-maker/generate ─────────────────
// Genera creativos para un producto con ángulos seleccionados.

const schema = z.object({
  productId: z.string().min(1),
  platform: z.enum(['META', 'TIKTOK', 'GOOGLE']).default('META'),
  angles: z
    .array(
      z.enum([
        'BENEFIT',
        'PAIN_POINT',
        'SOCIAL_PROOF',
        'URGENCY',
        'LIFESTYLE',
        'TESTIMONIAL',
        'BEFORE_AFTER',
        'PROBLEM_SOLUTION',
      ]),
    )
    .optional(),
  ratios: z.array(z.enum(['SQUARE', 'PORTRAIT', 'STORY', 'LANDSCAPE'])).optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const input = schema.parse(body)

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true },
  })
  if (!product) return apiError('Producto no encontrado', 404, 'NOT_FOUND')

  const creatives = await generateCreatives({
    userId: session.id,
    productId: input.productId,
    platform: input.platform,
    angles: input.angles,
    ratios: input.ratios,
  })

  if (creatives.length === 0) {
    return apiSuccess({ created: 0, items: [] })
  }

  await prisma.adCreative.createMany({
    data: creatives.map((c) => ({
      userId: session.id,
      productId: input.productId,
      angle: c.angle,
      platform: c.platform,
      ratio: c.ratio,
      headline: c.headline,
      primaryText: c.primaryText,
      description: c.description,
      cta: c.cta,
      hashtags: c.hashtags,
      imageUrl: c.imageUrl,
      imagePrompt: c.imagePrompt,
      score: c.score,
      reasoning: c.reasoning,
    })),
  })

  const items = await prisma.adCreative.findMany({
    where: {
      userId: session.id,
      productId: input.productId,
      createdAt: { gte: new Date(Date.now() - 30000) },
    },
    include: { product: { select: { id: true, name: true, slug: true, images: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return apiSuccess({ created: creatives.length, items })
})
