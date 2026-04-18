import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { cache } from '@/lib/cache/memory-cache'

// ── GET /api/admin/cache-stats — Estadísticas del cache ──
// Acceso: ADMIN o superior
export const GET = withErrorHandler(async () => {
  await requireRole('ADMIN')
  return apiSuccess(cache.getStats())
})

// ── DELETE /api/admin/cache-stats — Limpia todo el cache ──
// Útil tras cargas masivas de datos
export const DELETE = withErrorHandler(async () => {
  await requireRole('ADMIN')
  cache.clear()
  return apiSuccess({ cleared: true })
})
