// V34 — GET /api/insights/me — último insight del usuario
// POST /api/insights/me — fuerza regeneración (rate limited)
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { guardRateLimit } from '@/lib/security/rate-limit'
import { generateWeeklyInsight, getLatestInsight } from '@/lib/insights/service'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  // Si no existe insight para esta semana, generamos on-demand
  const existing = await getLatestInsight(session.id)

  const thisWeekStart = getThisWeekStart()
  const needsGenerate = !existing || existing.weekStart.getTime() < thisWeekStart.getTime()

  if (needsGenerate) {
    const generated = await generateWeeklyInsight({ userId: session.id, source: 'lazy' })
    if (!generated) {
      return apiError('No se pudo generar el insight', 500, 'GENERATE_FAILED')
    }
    return apiSuccess(generated)
  }

  return apiSuccess(existing)
})

export const POST = withErrorHandler(async () => {
  const session = await requireSession()

  // 3 regeneraciones por hora — protege costos + evita abuse de CPU
  const blocked = guardRateLimit(`insights:regen:${session.id}`, { maxRequests: 3, windowMs: 60 * 60_000 })
  if (blocked) return blocked

  const generated = await generateWeeklyInsight({ userId: session.id, source: 'manual' })
  if (!generated) {
    return apiError('No se pudo generar el insight', 500, 'GENERATE_FAILED')
  }
  return apiSuccess(generated)
})

function getThisWeekStart(): Date {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayOfWeek = d.getUTCDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - daysFromMonday)
  start.setUTCHours(0, 0, 0, 0)
  return start
}
