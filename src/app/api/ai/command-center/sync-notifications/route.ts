import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { syncCriticalToNotifications } from '@/lib/ai/notify-critical'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/command-center/sync-notifications ───────
// Sync pasivo — mueve las acciones críticas existentes al bell
// de notificaciones sin disparar agentes. Dedup 24h por actionId.
// Usado por el hook que hace polling pasivo cada ~5 min.

export const POST = withErrorHandler(async () => {
  const session = await requireSession()
  const res = await syncCriticalToNotifications(session.id)
  return apiSuccess(res)
})
