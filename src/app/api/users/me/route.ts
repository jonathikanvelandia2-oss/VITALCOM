import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
})

// ── GET /api/users/me — Mi perfil completo ──────────────
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      country: true,
      area: true,
      avatar: true,
      phone: true,
      whatsapp: true,
      level: true,
      points: true,
      bio: true,
      verified: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          orders: true,
          courseProgress: true,
        },
      },
    },
  })

  if (!user) throw new Error('NOT_FOUND')

  // Calcular likes recibidos en todos los posts del usuario
  const likesReceived = await prisma.post.aggregate({
    where: { authorId: session.id },
    _sum: { likes: true },
  })

  // Posición en ranking
  const rankPosition = await prisma.user.count({
    where: {
      active: true,
      role: { in: ['COMMUNITY', 'DROPSHIPPER'] },
      points: { gt: user.points },
    },
  })

  return apiSuccess({
    ...user,
    postCount: user._count.posts,
    commentCount: user._count.comments,
    orderCount: user._count.orders,
    coursesCompleted: user._count.courseProgress,
    likesReceived: likesReceived._sum.likes ?? 0,
    rankPosition: rankPosition + 1,
    _count: undefined,
  })
})

// ── PATCH /api/users/me — Actualizar perfil ─────────────
export const PATCH = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const body = await req.json()
  const data = updateProfileSchema.parse(body)

  const updated = await prisma.user.update({
    where: { id: session.id },
    data,
    select: {
      id: true,
      name: true,
      bio: true,
      avatar: true,
      phone: true,
      whatsapp: true,
    },
  })

  return apiSuccess(updated)
})
