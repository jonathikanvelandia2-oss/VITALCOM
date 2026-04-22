// V34 — GET /api/insights/me/history — últimos N insights del usuario
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { getInsightHistory } from '@/lib/insights/service'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const rawLimit = Number(url.searchParams.get('limit') ?? '8')
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 8, 1), 52)
  const items = await getInsightHistory(session.id, limit)
  return apiSuccess({ items })
})
