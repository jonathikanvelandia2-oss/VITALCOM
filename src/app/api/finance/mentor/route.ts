import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { FinanceRepository } from '@/lib/repositories/finance-repository'
import { runMentorFinanciero } from '@/lib/ai/agents/mentor-financiero'
import { cache, CACHE_TTL } from '@/lib/cache/memory-cache'
import { rateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ── GET /api/finance/mentor — Insights del MentorFinanciero ──
// Rate-limited: 20 req/hora/usuario. Cache de 10min por usuario+periodo.
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const rl = rateLimit(`mentor:${session.id}`, { maxRequests: 20, windowMs: 60 * 60 * 1000 })
  if (!rl.success) {
    return apiError('Demasiadas solicitudes. Espera un momento.', 429, 'RATE_LIMIT')
  }

  const url = new URL(req.url)
  const period = (url.searchParams.get('period') ?? '30d') as '7d' | '30d' | '90d'

  const cacheKey = `mentor:${session.id}:${period}`
  const cached = cache.get<any>(cacheKey)
  if (cached) return apiSuccess(cached)

  const summary = await FinanceRepository.getPnL(session.id, period)
  const insights = await runMentorFinanciero(summary)

  const payload = { insights, period, generatedAt: new Date().toISOString() }
  cache.set(cacheKey, payload, { ttlMs: CACHE_TTL.long, tags: [`finance:${session.id}`] })

  return apiSuccess(payload)
})
