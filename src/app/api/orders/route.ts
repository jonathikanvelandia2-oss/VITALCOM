import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireRole, requireSession } from '@/lib/auth/session'
import { createOrderSchema, orderFiltersSchema } from '@/lib/api/schemas/order'
import { Prisma } from '@prisma/client'

// ── GET /api/orders — Listado paginado con filtros ──────
// Staff ve todos, comunidad ve solo los suyos
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams)
  const filters = orderFiltersSchema.parse(params)

  const where: Prisma.OrderWhereInput = {}

  // Comunidad/Dropshipper solo ve sus propios pedidos
  const isStaff = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(session.role)
  if (!isStaff) {
    where.userId = session.id
  }

  if (filters.search) {
    where.OR = [
      { number: { contains: filters.search, mode: 'insensitive' } },
      { customerName: { contains: filters.search, mode: 'insensitive' } },
      { customerEmail: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.status) where.status = filters.status
  if (filters.source) where.source = filters.source
  if (filters.country) where.country = filters.country

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { id: true, sku: true, name: true } } } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [filters.sort]: filters.order },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.order.count({ where }),
  ])

  return apiSuccess({
    orders,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit),
    },
  })
})

// ── POST /api/orders — Crear pedido ─────────────────────
// Auto-genera número VC-CO-20260414-0001
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const body = await req.json()
  const data = createOrderSchema.parse(body)

  // Generar número de pedido único
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const countToday = await prisma.order.count({
    where: {
      number: { startsWith: `VC-${data.country}-${today}` },
    },
  })
  const number = `VC-${data.country}-${today}-${String(countToday + 1).padStart(4, '0')}`

  // Calcular subtotal desde items
  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const total = subtotal + data.shipping

  // Verificar que todos los productos existen
  const productIds = data.items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: { id: true },
  })
  if (products.length !== productIds.length) {
    return apiError('Uno o más productos no existen o están inactivos', 400, 'INVALID_PRODUCTS')
  }

  const order = await prisma.order.create({
    data: {
      number,
      userId: session.id,
      source: data.source,
      country: data.country,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      subtotal,
      shipping: data.shipping,
      total,
      notes: data.notes,
      externalRef: data.externalRef,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        })),
      },
    },
    include: {
      items: { include: { product: { select: { id: true, sku: true, name: true } } } },
    },
  })

  return apiSuccess(order, 201)
})
