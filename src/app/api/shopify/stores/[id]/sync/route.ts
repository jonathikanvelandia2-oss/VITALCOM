import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { syncProductSchema, syncMultipleSchema, updateSyncSchema } from '@/lib/api/schemas/shopify'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/shopify/stores/[id]/sync — Productos sincronizados ─
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: storeId } = await ctx!.params

  const store = await prisma.shopifyStore.findUnique({ where: { id: storeId } })
  if (!store) throw new Error('NOT_FOUND')
  if (store.userId !== session.id) throw new Error('FORBIDDEN')

  const syncs = await prisma.productSync.findMany({
    where: { shopifyStoreId: storeId },
    include: {
      product: {
        select: { id: true, name: true, sku: true, precioComunidad: true, precioPublico: true, images: true, category: true },
      },
    },
    orderBy: { soldTotal: 'desc' },
  })

  const products = syncs.map((s) => ({
    id: s.id,
    productId: s.productId,
    name: s.product.name,
    sku: s.product.sku,
    image: s.product.images[0] ?? null,
    category: s.product.category,
    sellingPrice: s.sellingPrice,
    costPrice: s.product.precioComunidad,
    precioPublico: s.product.precioPublico,
    margin: s.sellingPrice > 0
      ? Math.round(((s.sellingPrice - s.product.precioComunidad) / s.sellingPrice) * 100)
      : 0,
    soldTotal: s.soldTotal,
    status: s.status,
    shopifyProductId: s.shopifyProductId,
    lastSyncAt: s.lastSyncAt,
  }))

  return apiSuccess({ products, total: products.length })
})

// ── POST /api/shopify/stores/[id]/sync — Importar productos ─
export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: storeId } = await ctx!.params

  const store = await prisma.shopifyStore.findUnique({ where: { id: storeId } })
  if (!store) throw new Error('NOT_FOUND')
  if (store.userId !== session.id) throw new Error('FORBIDDEN')

  const body = await req.json()
  const data = syncMultipleSchema.parse(body)

  // Verificar que los productos existen
  const productIds = data.products.map((p) => p.productId)
  const existing = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: { id: true },
  })
  const validIds = new Set(existing.map((p) => p.id))

  // Crear syncs solo para productos válidos y no duplicados
  const results = []
  for (const p of data.products) {
    if (!validIds.has(p.productId)) continue

    const sync = await prisma.productSync.upsert({
      where: {
        shopifyStoreId_productId: { shopifyStoreId: storeId, productId: p.productId },
      },
      update: {
        sellingPrice: p.sellingPrice,
        status: 'active',
        lastSyncAt: new Date(),
      },
      create: {
        shopifyStoreId: storeId,
        productId: p.productId,
        shopifyProductId: p.shopifyProductId ?? `sp_${Date.now()}`,
        shopifyVariantId: p.shopifyVariantId,
        sellingPrice: p.sellingPrice,
        status: 'active',
      },
    })
    results.push(sync)
  }

  // Actualizar contador de productos en la tienda
  const totalSynced = await prisma.productSync.count({ where: { shopifyStoreId: storeId } })
  await prisma.shopifyStore.update({
    where: { id: storeId },
    data: { productsCount: totalSynced, lastSyncAt: new Date() },
  })

  return apiSuccess({ synced: results.length, total: totalSynced }, 201)
})

// ── PATCH /api/shopify/stores/[id]/sync — Actualizar sync ─
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: storeId } = await ctx!.params

  const store = await prisma.shopifyStore.findUnique({ where: { id: storeId } })
  if (!store) throw new Error('NOT_FOUND')
  if (store.userId !== session.id) throw new Error('FORBIDDEN')

  const body = await req.json()
  const { syncId, ...updates } = body
  const data = updateSyncSchema.parse(updates)

  if (!syncId) throw new Error('NOT_FOUND')

  const sync = await prisma.productSync.update({
    where: { id: syncId },
    data: { ...data, lastSyncAt: new Date() },
  })

  return apiSuccess(sync)
})
