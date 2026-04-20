import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/community/members ───────────────────────────
// Directorio para iniciar chat 1:1. Lista usuarios activos
// (comunidad + dropshippers + staff) excepto el propio.
// Query: ?q=<search>&limit=30

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '30'), 1), 100)

  const members = await prisma.user.findMany({
    where: {
      active: true,
      id: { not: session.id },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      level: true,
      points: true,
      country: true,
    },
    orderBy: [{ points: 'desc' }, { name: 'asc' }],
    take: limit,
  })

  return apiSuccess({
    items: members.map((m) => ({
      id: m.id,
      name: m.name ?? m.email.split('@')[0],
      avatar: m.avatar,
      role: m.role,
      level: m.level,
      points: m.points,
      country: m.country,
    })),
  })
})
