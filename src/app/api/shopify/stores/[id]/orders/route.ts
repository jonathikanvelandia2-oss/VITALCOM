import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/shopify/stores/[id]/orders — Pedidos de la tienda ─
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: storeId } = await ctx!.params

  const store = await prisma.shopifyStore.findUnique({ where: { id: storeId } })
  if (!store) throw new Error('NOT_FOUND')
  if (store.userId !== session.id) throw new Error('FORBIDDEN')

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || undefined
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '20'))

  // Pedidos del usuario vinculados con source DROPSHIPPER
  const where: any = { userId: session.id, source: 'DROPSHIPPER' }
  if (status) where.status = status

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: { select: { name: true, sku: true, images: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  // Calcular ganancia por pedido
  const mapped = await Promise.all(orders.map(async (o) => {
    // Buscar precio de costo de cada producto
    let totalCost = 0
    for (const item of o.items) {
      const sync = await prisma.productSync.findFirst({
        where: { shopifyStoreId: storeId, productId: item.productId },
      })
      totalCost += item.product ? (await prisma.product.findUnique({ where: { id: item.productId }, select: { precioComunidad: true } }))?.precioComunidad ?? 0 * item.quantity : 0
    }

    return {
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      customerCity: o.customerAddress,
      status: o.status,
      items: o.items.map((i) => ({
        name: i.product.name,
        sku: i.product.sku,
        qty: i.quantity,
        price: i.unitPrice,
      })),
      subtotal: o.subtotal,
      shipping: o.shipping,
      total: o.total,
      profit: o.total - totalCost - o.shipping,
      trackingCode: o.trackingCode,
      carrier: o.carrier,
      createdAt: o.createdAt,
    }
  }))

  return apiSuccess({
    orders: mapped,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})
