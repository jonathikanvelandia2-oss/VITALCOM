// V39 — GET /api/inbox/assignable?area=COMERCIAL
// Lista usuarios que pueden ser asignados a un hilo — staff con area match.

import { z } from 'zod'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession, isStaff } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  area: z.enum(['DIRECCION', 'MARKETING', 'COMERCIAL', 'ADMINISTRATIVA', 'LOGISTICA', 'CONTABILIDAD']).optional(),
})

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  if (!isStaff(session.role)) return apiError('Solo staff', 403, 'FORBIDDEN')

  const url = new URL(req.url)
  const data = querySchema.parse({ area: url.searchParams.get('area') || undefined })

  // Staff asignable: SUPERADMIN/ADMIN siempre; MANAGER/EMPLOYEE si matchea área.
  // El área filtrada permite asignar a quienes trabajan en esa área + los admin.
  const where = data.area
    ? {
        active: true,
        OR: [
          { role: { in: ['SUPERADMIN' as const, 'ADMIN' as const] } },
          { AND: [{ role: { in: ['MANAGER_AREA' as const, 'EMPLOYEE' as const] } }, { area: data.area }] },
        ],
      }
    : {
        active: true,
        role: { in: ['SUPERADMIN' as const, 'ADMIN' as const, 'MANAGER_AREA' as const, 'EMPLOYEE' as const] },
      }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, area: true, role: true, avatar: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    take: 100,
  })

  return apiSuccess({ items: users })
})
