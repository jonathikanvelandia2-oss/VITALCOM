// V32 — GET /api/health — mi score propio
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { upsertUserHealthScore } from '@/lib/health/service'
import { guardRateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

// Si no hay snapshot, computamos al vuelo
export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  let score = await prisma.userHealthScore.findUnique({
    where: { userId: session.id },
  })

  if (!score) {
    const result = await upsertUserHealthScore(session.id)
    if (!result) return apiError('No se pudo calcular', 500, 'HEALTH_ERROR')
    score = await prisma.userHealthScore.findUnique({ where: { userId: session.id } })
  }
  if (!score) return apiError('No disponible', 404, 'NOT_FOUND')

  return apiSuccess({
    score: score.score,
    segment: score.segment,
    breakdown: score.breakdown,
    previousScore: score.previousScore,
    scoreDelta: score.scoreDelta,
    previousSegment: score.previousSegment,
    computedAt: score.computedAt.toISOString(),
  })
})

// POST — recalcula a demanda (para "Refrescar mi score")
export const POST = withErrorHandler(async () => {
  const session = await requireSession()

  // 5 recálculos / 10min — el cron diario ya corre, esto es solo refresh manual
  const blocked = guardRateLimit(`health:refresh:${session.id}`, { maxRequests: 5, windowMs: 10 * 60_000 })
  if (blocked) return blocked

  const result = await upsertUserHealthScore(session.id)
  if (!result) return apiError('No se pudo calcular', 500, 'HEALTH_ERROR')
  return apiSuccess({
    score: result.score,
    segment: result.segment,
    breakdown: result.breakdown,
    reasons: result.reasons,
  })
})
