// V32 — GET /api/admin/health — listado de health scores (solo admin)
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole, UserHealthSegment } from '@prisma/client'

export const dynamic = 'force-dynamic'

function isAdmin(role: UserRole | null | undefined): boolean {
  return role === UserRole.ADMIN
    || role === UserRole.SUPERADMIN
    || role === UserRole.MANAGER_AREA
}

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  if (!isAdmin(session.role as UserRole)) {
    return apiError('Solo admins', 403, 'FORBIDDEN')
  }

  const url = new URL(req.url)
  const segment = url.searchParams.get('segment') as UserHealthSegment | null
  const limit = Math.min(200, Number(url.searchParams.get('limit') ?? 100))

  const rows = await prisma.userHealthScore.findMany({
    where: segment ? { segment } : undefined,
    orderBy: [{ score: 'asc' }],
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true, country: true, role: true },
      },
    },
  })

  // Resumen por segmento
  const counts = await prisma.userHealthScore.groupBy({
    by: ['segment'],
    _count: { _all: true },
  })

  const countsMap = counts.reduce((acc, c) => {
    acc[c.segment] = c._count._all
    return acc
  }, {} as Record<UserHealthSegment, number>)

  return apiSuccess({
    items: rows.map(r => ({
      id: r.id,
      userId: r.userId,
      score: r.score,
      segment: r.segment,
      scoreDelta: r.scoreDelta,
      previousSegment: r.previousSegment,
      breakdown: r.breakdown,
      computedAt: r.computedAt.toISOString(),
      lastRetentionTriggerAt: r.lastRetentionTriggerAt?.toISOString() ?? null,
      user: r.user,
    })),
    counts: {
      NEW: countsMap.NEW ?? 0,
      ACTIVE: countsMap.ACTIVE ?? 0,
      AT_RISK: countsMap.AT_RISK ?? 0,
      CHURNED: countsMap.CHURNED ?? 0,
    },
  })
})
