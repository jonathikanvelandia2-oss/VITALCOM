import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { getCurrentMonthProgress } from '@/lib/goals/helpers'

export const dynamic = 'force-dynamic'

// GET /api/goals/current — meta del mes + progreso + proyección
export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  const progress = await getCurrentMonthProgress(session.id)
  return apiSuccess(progress)
})
