import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/admin/bots ─────────────────────────────────
// Lista últimas corridas de bots + estadísticas agregadas.
// Solo admin/superadmin.

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  if (!['SUPERADMIN', 'ADMIN', 'MANAGER_AREA'].includes(session.role)) {
    return apiError('No autorizado', 403, 'FORBIDDEN')
  }

  const url = new URL(req.url)
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7'), 1), 90)
  const from = new Date(Date.now() - days * 86400000)

  const [runs, byBot] = await Promise.all([
    prisma.botRun.findMany({
      where: { startedAt: { gte: from } },
      orderBy: { startedAt: 'desc' },
      take: 50,
    }),
    prisma.botRun.groupBy({
      by: ['bot', 'status'],
      where: { startedAt: { gte: from } },
      _count: true,
      _sum: {
        usersProcessed: true,
        itemsAffected: true,
        notifsCreated: true,
        errors: true,
      },
    }),
  ])

  return apiSuccess({
    period: { days, from: from.toISOString() },
    runs,
    byBot,
  })
})
