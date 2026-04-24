// V39 — GET /api/inbox/stats
// KPIs operativos del inbox para el dashboard de staff.
// Respeta RBAC: MANAGER_AREA/EMPLOYEE ven stats de su área, ADMIN+ de todo.

import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession, isStaff } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { computeInboxStats, getDefaultAreaFilterFor, type ThreadLite } from '@/lib/inbox/helpers'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  if (!isStaff(session.role)) return apiError('Solo staff', 403, 'FORBIDDEN')

  const areaFilter = getDefaultAreaFilterFor({
    id: session.id,
    role: session.role,
    area: session.area,
  })

  const threads = await prisma.inboxThread.findMany({
    where: areaFilter ? { area: areaFilter } : {},
    select: {
      id: true,
      area: true,
      priority: true,
      resolved: true,
      assignedToId: true,
      firstResponseAt: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500, // cap razonable
  })

  const stats = computeInboxStats(threads as ThreadLite[])

  return apiSuccess({
    scope: areaFilter ?? 'ALL',
    stats,
  })
})
