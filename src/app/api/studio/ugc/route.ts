// V33 — POST /api/studio/ugc — genera paquete UGC para un producto
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { rateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { generateUgcPackage, listUgcPackages } from '@/lib/studio/ugc-scriptwriter'
import { SalesAngle } from '@prisma/client'

export const dynamic = 'force-dynamic'

const schema = z.object({
  productId: z.string().min(1),
  angle: z.nativeEnum(SalesAngle),
  persona: z.string().min(2).max(80),
  platform: z.enum(['instagram_reel', 'tiktok', 'youtube_shorts']),
  durationSec: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  country: z.enum(['CO', 'EC', 'GT', 'CL']).optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  // 5 paquetes/hora por usuario — protege costo LLM
  const limit = rateLimit(`ugc:${session.id}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: 'Máx 5 paquetes UGC por hora', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitHeaders(limit) },
    )
  }

  const body = await req.json()
  const data = schema.parse(body)

  const result = await generateUgcPackage({
    productId: data.productId,
    angle: data.angle,
    persona: data.persona,
    platform: data.platform,
    durationSec: data.durationSec,
    country: data.country,
    dropshipperId: session.id,
  })

  return apiSuccess(result, 201)
})

export const GET = withErrorHandler(async (req: Request) => {
  await requireSession()
  const url = new URL(req.url)
  const productId = url.searchParams.get('productId')
  if (!productId) return apiSuccess({ items: [] })
  const items = await listUgcPackages(productId, 20)
  return apiSuccess({ items: items.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })) })
})
