import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

// ── POST /api/notifications/read-all ───────────────────
// Marca todas las no leídas del usuario como leídas.
export const POST = withErrorHandler(async () => {
  const session = await requireSession()

  const result = await prisma.notification.updateMany({
    where: { userId: session.id, read: false },
    data: { read: true },
  })

  return apiSuccess({ updated: result.count })
})
