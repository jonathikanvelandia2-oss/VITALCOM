import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { updateUserSchema } from '@/lib/api/schemas/user'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/admin/users/[id] — Detalle de usuario ─────
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params

  const user = await prisma.user.findUnique({
    where: { id },
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
      active: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { orders: true, posts: true, comments: true } },
    },
  })

  if (!user) throw new Error('NOT_FOUND')

  // Historial de pedidos recientes
  const recentOrders = await prisma.order.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      country: true,
      createdAt: true,
    },
  })

  // Total comprado
  const totalSpent = await prisma.order.aggregate({
    where: { userId: id, status: { notIn: ['CANCELLED', 'RETURNED'] } },
    _sum: { total: true },
    _count: true,
  })

  return apiSuccess({
    ...user,
    orderCount: user._count.orders,
    postCount: user._count.posts,
    commentCount: user._count.comments,
    _count: undefined,
    recentOrders,
    totalSpent: totalSpent._sum.total ?? 0,
    completedOrders: totalSpent._count,
  })
})

// ── PATCH /api/admin/users/[id] — Actualizar usuario ───
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error('NOT_FOUND')

  const body = await req.json()
  const data = updateUserSchema.parse(body)

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      area: true,
      country: true,
      active: true,
      verified: true,
    },
  })

  return apiSuccess(updated)
})

// ── DELETE /api/admin/users/[id] — Desactivar usuario ──
// Soft delete: marca como inactive
export const DELETE = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error('NOT_FOUND')

  await prisma.user.update({
    where: { id },
    data: { active: false },
  })

  return apiSuccess({ deactivated: true })
})
