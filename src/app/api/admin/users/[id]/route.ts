import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { updateUserSchema } from '@/lib/api/schemas/user'

type Ctx = { params: Promise<{ id: string }> }

// ── Segmentación CRM ───────────────────────────────────
// VIP:       totalSpent >= 2 000 000 COP (o equivalente)
// ACTIVE:    pedido en últimos 60 días
// AT_RISK:   algún pedido previo pero nada en >60 días
// NEW:       creado <30 días sin pedidos aún
// INACTIVE:  sin pedidos nunca y cuenta >30 días
function computeSegment(input: {
  totalSpent: number
  lastOrderAt: Date | null
  createdAt: Date
  orderCount: number
}): { code: string; label: string } {
  const { totalSpent, lastOrderAt, createdAt, orderCount } = input
  const now = Date.now()
  const daysSinceLastOrder = lastOrderAt
    ? Math.floor((now - lastOrderAt.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const daysSinceSignup = Math.floor((now - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  if (totalSpent >= 2_000_000) return { code: 'VIP', label: 'VIP' }
  if (daysSinceLastOrder !== null && daysSinceLastOrder <= 60) return { code: 'ACTIVE', label: 'Activo' }
  if (orderCount > 0 && daysSinceLastOrder !== null && daysSinceLastOrder > 60) return { code: 'AT_RISK', label: 'En riesgo' }
  if (daysSinceSignup <= 30 && orderCount === 0) return { code: 'NEW', label: 'Nuevo' }
  return { code: 'INACTIVE', label: 'Inactivo' }
}

// ── GET /api/admin/users/[id] — Detalle de usuario 360° ─
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

  const [recentOrders, totalSpent, allOrders] = await Promise.all([
    prisma.order.findMany({
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
    }),
    prisma.order.aggregate({
      where: { userId: id, status: { notIn: ['CANCELLED', 'RETURNED'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { userId: id, status: { notIn: ['CANCELLED'] } },
      select: {
        createdAt: true,
        total: true,
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, images: true } },
          },
        },
      },
    }),
  ])

  // Productos favoritos (por uds compradas)
  const productMap: Record<string, { id: string; sku: string; name: string; image: string | null; units: number; revenue: number }> = {}
  for (const order of allOrders) {
    for (const item of order.items) {
      const pid = item.product.id
      productMap[pid] ??= {
        id: pid,
        sku: item.product.sku,
        name: item.product.name,
        image: item.product.images[0] ?? null,
        units: 0,
        revenue: 0,
      }
      productMap[pid].units += item.quantity
      productMap[pid].revenue += item.total
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)

  const lifetimeValue = totalSpent._sum.total ?? 0
  const completedOrders = totalSpent._count
  const avgTicket = completedOrders > 0 ? Math.round(lifetimeValue / completedOrders) : 0

  const lastOrderAt = allOrders.length > 0
    ? allOrders.reduce((acc, o) => (o.createdAt > acc ? o.createdAt : acc), allOrders[0].createdAt)
    : null
  const firstOrderAt = allOrders.length > 0
    ? allOrders.reduce((acc, o) => (o.createdAt < acc ? o.createdAt : acc), allOrders[0].createdAt)
    : null

  const segment = computeSegment({
    totalSpent: lifetimeValue,
    lastOrderAt,
    createdAt: user.createdAt,
    orderCount: user._count.orders,
  })

  return apiSuccess({
    ...user,
    orderCount: user._count.orders,
    postCount: user._count.posts,
    commentCount: user._count.comments,
    _count: undefined,
    recentOrders,
    lifetimeValue,
    totalSpent: lifetimeValue, // compat con UI existente
    completedOrders,
    avgTicket,
    topProducts,
    firstOrderAt,
    lastOrderAt,
    segment,
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
