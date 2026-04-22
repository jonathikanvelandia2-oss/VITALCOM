// V35 — GET /api/admin/community/pulse
// Vista CEO: distribución + top movers + at-risk + cobertura.
// Role requerido: SUPERADMIN / ADMIN / MANAGER_AREA
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { getCommunityPulse } from '@/lib/community/pulse-service'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  await requireRole('MANAGER_AREA')
  const pulse = await getCommunityPulse()
  return apiSuccess(pulse)
})
