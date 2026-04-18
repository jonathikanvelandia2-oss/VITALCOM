import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { computeBlueprint } from '@/lib/blueprint/blueprint-service'
import { runBlueprintAnalyst } from '@/lib/ai/agents/blueprint-analyst'
import { cache, CACHE_TTL } from '@/lib/cache/memory-cache'
import { rateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ── GET /api/blueprint — Diagnóstico 0-100 + 5 acciones semanales ──
// Rate-limited: 20 req/hora. Cache 10min por usuario+periodo.
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const rl = rateLimit(`blueprint:${session.id}`, { maxRequests: 20, windowMs: 60 * 60 * 1000 })
  if (!rl.success) {
    return apiError('Demasiadas solicitudes. Espera un momento.', 429, 'RATE_LIMIT')
  }

  const url = new URL(req.url)
  const period = (url.searchParams.get('period') ?? '30d') as '7d' | '30d' | '90d'

  const cacheKey = `blueprint:${session.id}:${period}`
  const cached = cache.get<any>(cacheKey)
  if (cached) return apiSuccess(cached)

  const diagnostic = await computeBlueprint(session.id, period)
  const actions = await runBlueprintAnalyst(diagnostic)

  const payload = {
    diagnostic,
    actions,
    generatedAt: new Date().toISOString(),
  }

  cache.set(cacheKey, payload, { ttlMs: CACHE_TTL.long, tags: [`finance:${session.id}`, 'blueprint'] })

  return apiSuccess(payload)
})
