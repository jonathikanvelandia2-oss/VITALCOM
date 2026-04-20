import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { createUserSchema, userFiltersSchema } from '@/lib/api/schemas/user'
import { hashPassword } from '@/lib/security/password'

// ── GET /api/admin/users — Lista de usuarios ────────────
// Acceso: ADMIN o superior
export const GET = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')

  const url = new URL(req.url)
  const filters = userFiltersSchema.parse({
    role: url.searchParams.get('role') || undefined,
    area: url.searchParams.get('area') || undefined,
    active: url.searchParams.get('active') || undefined,
    search: url.searchParams.get('search') || undefined,
    page: url.searchParams.get('page') || undefined,
    limit: url.searchParams.get('limit') || undefined,
  })

  const where: any = {}
  if (filters.role) where.role = filters.role
  if (filters.area) where.area = filters.area
  if (filters.active !== undefined) where.active = filters.active === 'true'
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const skip = (filters.page - 1) * filters.limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        area: true,
        avatar: true,
        phone: true,
        level: true,
        points: true,
        active: true,
        verified: true,
        createdAt: true,
        _count: { select: { orders: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: filters.limit,
    }),
    prisma.user.count({ where }),
  ])

  // LTV + último pedido en un solo groupBy (evita N+1).
  const userIds = users.map((u) => u.id)
  let spentByUser = new Map<string, number>()
  let lastOrderByUser = new Map<string, Date>()
  if (userIds.length > 0) {
    const orderAggs = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      _sum: { total: true },
      _max: { createdAt: true },
    })
    for (const agg of orderAggs) {
      if (!agg.userId) continue
      spentByUser.set(agg.userId, agg._sum.total ?? 0)
      if (agg._max.createdAt) lastOrderByUser.set(agg.userId, agg._max.createdAt)
    }
  }

  const mapped = users.map((u) => ({
    ...u,
    orderCount: u._count.orders,
    postCount: u._count.posts,
    _count: undefined,
    totalSpent: spentByUser.get(u.id) ?? 0,
    lastOrderAt: lastOrderByUser.get(u.id) ?? null,
  }))

  return apiSuccess({
    users: mapped,
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) },
  })
})

// ── POST /api/admin/users — Crear usuario (staff) ──────
// Acceso: ADMIN o superior
export const POST = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')

  const body = await req.json()
  const data = createUserSchema.parse(body)

  // Verificar email único
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    const { apiError } = await import('@/lib/api/response')
    return apiError('El email ya está registrado', 409, 'DUPLICATE_EMAIL')
  }

  const hashed = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashed,
      role: data.role,
      area: data.area,
      country: data.country,
      phone: data.phone,
      verified: true, // Staff creado por admin = verificado
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      area: true,
      country: true,
      active: true,
      createdAt: true,
    },
  })

  return apiSuccess(user, 201)
})
