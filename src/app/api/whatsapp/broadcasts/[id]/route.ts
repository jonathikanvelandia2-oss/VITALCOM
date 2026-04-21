// V29 — GET /api/whatsapp/broadcasts/[id] con stats
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getBroadcastStats } from '@/lib/whatsapp/broadcast-runner'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()

  const broadcast = await prisma.whatsappBroadcast.findFirst({
    where: { id: ctx.params.id, account: { userId: session.id } },
  })
  if (!broadcast) return apiError('Broadcast no encontrado', 404, 'NOT_FOUND')

  const stats = await getBroadcastStats(ctx.params.id)

  return apiSuccess({
    ...stats,
    broadcast: {
      ...stats.broadcast,
      createdAt: stats.broadcast.createdAt.toISOString(),
      updatedAt: stats.broadcast.updatedAt.toISOString(),
      scheduledFor: stats.broadcast.scheduledFor?.toISOString() ?? null,
      startedAt: stats.broadcast.startedAt?.toISOString() ?? null,
      completedAt: stats.broadcast.completedAt?.toISOString() ?? null,
    },
  })
})
