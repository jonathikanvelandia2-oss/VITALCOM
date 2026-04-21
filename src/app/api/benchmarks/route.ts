import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { computeBenchmarks } from '@/lib/benchmarks/helpers'

export const dynamic = 'force-dynamic'

// GET /api/benchmarks — percentiles comunidad + tu ubicación
export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  const payload = await computeBenchmarks(session.id)
  return apiSuccess(payload)
})
