import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

// ── GET /api/community/ranking — Top 50 por puntos ─────
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 100)
  const country = url.searchParams.get('country') || undefined

  const where: any = {
    active: true,
    role: { in: ['COMMUNITY', 'DROPSHIPPER'] },
  }
  if (country) where.country = country

  const ranking = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      avatar: true,
      level: true,
      points: true,
      country: true,
      _count: { select: { posts: true } },
    },
    orderBy: { points: 'desc' },
    take: limit,
  })

  // Posición del usuario actual
  const myRank = await prisma.user.count({
    where: { ...where, points: { gt: (await prisma.user.findUnique({ where: { id: session.id }, select: { points: true } }))?.points ?? 0 } },
  })

  const mapped = ranking.map((u, i) => ({
    position: i + 1,
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    level: u.level,
    points: u.points,
    country: u.country,
    postCount: u._count.posts,
  }))

  return apiSuccess({
    ranking: mapped,
    myPosition: myRank + 1,
    total: await prisma.user.count({ where }),
  })
})
