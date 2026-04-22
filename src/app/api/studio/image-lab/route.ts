// V33 — POST /api/studio/image-lab — ejecuta una operación IA sobre un asset
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { rateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/security/rate-limit'
import { runImageLab, IMAGE_LAB_MOCK_MODE } from '@/lib/studio/image-lab'
import { IMAGE_LAB_COSTS } from '@/lib/studio/helpers'

export const dynamic = 'force-dynamic'

const schema = z.object({
  sourceAssetId: z.string().min(1),
  operation: z.enum(
    Object.keys(IMAGE_LAB_COSTS) as [keyof typeof IMAGE_LAB_COSTS, ...Array<keyof typeof IMAGE_LAB_COSTS>],
  ),
  params: z.record(z.unknown()).optional(),
  persistAsNewAsset: z.boolean().optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  // Rate limit: 20 ops/min por usuario — protege Cloudinary + Replicate
  const limit = rateLimit(`imagelab:${session.id}`, { maxRequests: 20, windowMs: 60_000 })
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: 'Demasiadas operaciones · espera 1 min', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitHeaders(limit) },
    )
  }

  const body = await req.json()
  const data = schema.parse(body)

  const result = await runImageLab({
    sourceAssetId: data.sourceAssetId,
    operation: data.operation,
    params: data.params ?? {},
    createdBy: session.id,
    persistAsNewAsset: data.persistAsNewAsset,
  })

  return apiSuccess({ ...result, mockMode: IMAGE_LAB_MOCK_MODE })
})
