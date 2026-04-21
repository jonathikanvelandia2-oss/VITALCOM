import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { generateMorningBrief } from '@/lib/ai/morning-brief'

export const dynamic = 'force-dynamic'

// ── GET /api/ai/morning-brief ────────────────────────────
// Brief del día on-demand. La misma data que envía el bot
// como notificación a las 8AM, pero accesible cuando el
// dropshipper visita /brief.

export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  const brief = await generateMorningBrief(session.id)
  return apiSuccess(brief)
})
