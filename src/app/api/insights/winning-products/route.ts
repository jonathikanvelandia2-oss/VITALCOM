import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { InsightsRepository } from '@/lib/repositories/insights-repository'
import { periodSchema } from '@/lib/api/schemas/finance'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ── GET /api/insights/winning-products ───────────────────
// Ranking de productos ganadores en la comunidad (cross-user).
// Cualquier VITALCOMMER logueado puede ver esto.
const limitSchema = z.coerce.number().int().positive().max(50).default(10)

export const GET = withErrorHandler(async (req: Request) => {
  await requireSession()

  const url = new URL(req.url)
  const period = periodSchema.parse(url.searchParams.get('period') ?? '30d')
  const limit = limitSchema.parse(url.searchParams.get('limit') ?? 10)

  const [products, stats] = await Promise.all([
    InsightsRepository.getWinningProducts(period, limit),
    InsightsRepository.getCommunityStats(period),
  ])

  return apiSuccess({ period, products, stats })
})
