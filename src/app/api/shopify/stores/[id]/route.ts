import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/shopify/stores/[id] — Detalle de tienda ────
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const store = await prisma.shopifyStore.findUnique({
    where: { id },
    include: {
      syncedProducts: {
        include: { product: { select: { id: true, name: true, sku: true, precioComunidad: true, images: true } } },
        orderBy: { soldTotal: 'desc' },
      },
    },
  })

  if (!store) throw new Error('NOT_FOUND')
  if (store.userId !== session.id) throw new Error('FORBIDDEN')

  // Calcular métricas de la tienda
  const totalRevenue = store.syncedProducts.reduce(
    (sum, sp) => sum + sp.sellingPrice * sp.soldTotal, 0
  )
  const totalCost = store.syncedProducts.reduce(
    (sum, sp) => sum + sp.product.precioComunidad * sp.soldTotal, 0
  )
  const totalProfit = totalRevenue - totalCost
  const totalSold = store.syncedProducts.reduce((sum, sp) => sum + sp.soldTotal, 0)

  return apiSuccess({
    store: {
      id: store.id,
      shopDomain: store.shopDomain,
      storeName: store.storeName,
      status: store.status,
      plan: store.plan,
      productsCount: store.productsCount,
      connectedAt: store.connectedAt,
      lastSyncAt: store.lastSyncAt,
    },
    products: store.syncedProducts.map((sp) => ({
      id: sp.id,
      productId: sp.productId,
      name: sp.product.name,
      sku: sp.product.sku,
      image: sp.product.images[0] ?? null,
      sellingPrice: sp.sellingPrice,
      costPrice: sp.product.precioComunidad,
      margin: sp.sellingPrice > 0
        ? Math.round(((sp.sellingPrice - sp.product.precioComunidad) / sp.sellingPrice) * 100)
        : 0,
      soldTotal: sp.soldTotal,
      status: sp.status,
      lastSyncAt: sp.lastSyncAt,
    })),
    metrics: {
      totalRevenue,
      totalProfit,
      totalSold,
      syncedCount: store.syncedProducts.length,
      avgMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
    },
  })
})

// ── PATCH /api/shopify/stores/[id] — Actualizar tienda ──
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const store = await prisma.shopifyStore.findUnique({ where: { id } })
  if (!store) throw new Error('NOT_FOUND')
  if (store.userId !== session.id) throw new Error('FORBIDDEN')

  const body = await req.json()
  const allowedFields = ['storeName', 'plan', 'status']
  const updateData: any = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) updateData[key] = body[key]
  }

  const updated = await prisma.shopifyStore.update({
    where: { id },
    data: updateData,
  })

  return apiSuccess(updated)
})

// ── DELETE /api/shopify/stores/[id] — Desconectar tienda ─
export const DELETE = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const store = await prisma.shopifyStore.findUnique({ where: { id } })
  if (!store) throw new Error('NOT_FOUND')
  if (store.userId !== session.id) throw new Error('FORBIDDEN')

  // Eliminar syncs y luego la tienda
  await prisma.productSync.deleteMany({ where: { shopifyStoreId: id } })
  await prisma.shopifyStore.delete({ where: { id } })

  return apiSuccess({ deleted: true })
})
