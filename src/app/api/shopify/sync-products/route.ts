import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { ShopifyClient, type ShopifyProductInput } from '@/lib/integrations/shopify/client'
import { rateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { captureException } from '@/lib/observability'
import { NextResponse } from 'next/server'

// ── POST /api/shopify/sync-products ────────────────────
// El dropshipper selecciona productos Vitalcom y los crea (o actualiza)
// en su tienda Shopify. Guarda la relación en ProductSync para sincronizar
// stock e inventario en el futuro.
//
// Body: { storeId, productIds: string[], sellingPrices?: Record<string,number> }

const syncSchema = z.object({
  storeId: z.string().min(1),
  productIds: z.array(z.string().min(1)).min(1).max(50),
  sellingPrices: z.record(z.string(), z.number().positive()).optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  // Rate limit: sincronizar es costoso, 3/min por usuario
  const limit = rateLimit(`shopify-sync:${session.id}`, {
    maxRequests: 3,
    windowMs: 60_000,
  })
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: 'Demasiadas sincronizaciones. Espera 1 minuto.', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const body = await req.json()
  const data = syncSchema.parse(body)

  const store = await prisma.shopifyStore.findFirst({
    where: { id: data.storeId, userId: session.id },
  })
  if (!store) return apiError('Tienda no encontrada', 404, 'STORE_NOT_FOUND')
  if (!store.accessToken || store.status !== 'active') {
    return apiError('Tienda no conectada o token inválido', 400, 'STORE_NOT_CONNECTED')
  }

  const client = ShopifyClient.fromStoredToken(store.shopDomain, store.accessToken)

  const products = await prisma.product.findMany({
    where: { id: { in: data.productIds }, active: true },
  })

  // Batch lookup de ProductSync existente (1 query vs N antes)
  const existingSyncs = await prisma.productSync.findMany({
    where: {
      shopifyStoreId: store.id,
      productId: { in: products.map(p => p.id) },
    },
  })
  const syncByProductId = new Map(existingSyncs.map(s => [s.productId, s]))

  // Batch lookup de Stock real en el país del dropshipper. Si no tiene
  // país asignado en su perfil, asumimos CO (sede principal).
  const userCountry = session.country ?? 'CO'
  const stocks = await prisma.stock.findMany({
    where: {
      productId: { in: products.map(p => p.id) },
      country: userCountry,
    },
    select: { productId: true, quantity: true },
  })
  const stockByProductId = new Map(stocks.map(s => [s.productId, s.quantity]))

  const results: SyncResult[] = []

  for (const product of products) {
    try {
      const sellingPrice =
        data.sellingPrices?.[product.id] ??
        product.precioPublico ??
        product.precioComunidad

      const existing = syncByProductId.get(product.id)
      const realStock = stockByProductId.get(product.id) ?? 0

      const input: ShopifyProductInput = {
        title: product.name,
        body_html: product.description || '',
        vendor: product.marca || 'Vitalcom',
        product_type: product.category || 'Suplemento',
        tags: (product.tags || []).join(', '),
        status: realStock > 0 ? 'active' : 'draft', // pausa si sin stock
        images: (product.images || []).slice(0, 5).map((src) => ({ src })),
        variants: [
          {
            price: sellingPrice.toFixed(2),
            sku: product.sku,
            inventory_management: 'shopify',
            inventory_quantity: realStock, // stock real del país del dropshipper
            weight: product.weight || undefined,
            weight_unit: 'g',
          },
        ],
      }

      let shopifyProduct
      if (existing) {
        shopifyProduct = await client.updateProduct(existing.shopifyProductId, input)
      } else {
        shopifyProduct = await client.createProduct(input)
      }

      const variantId = shopifyProduct.variants?.[0]?.id

      await prisma.productSync.upsert({
        where: {
          shopifyStoreId_productId: {
            shopifyStoreId: store.id,
            productId: product.id,
          },
        },
        create: {
          shopifyStoreId: store.id,
          productId: product.id,
          shopifyProductId: String(shopifyProduct.id),
          shopifyVariantId: variantId ? String(variantId) : null,
          sellingPrice,
          status: 'active',
          lastSyncAt: new Date(),
        },
        update: {
          shopifyProductId: String(shopifyProduct.id),
          shopifyVariantId: variantId ? String(variantId) : null,
          sellingPrice,
          status: 'active',
          lastSyncAt: new Date(),
        },
      })

      results.push({ productId: product.id, sku: product.sku, ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      captureException(err, {
        route: '/api/shopify/sync-products',
        userId: session.id,
        tags: { stage: 'per-product' },
        extra: { sku: product.sku, productId: product.id },
      })
      // El mensaje al cliente no filtra detalles — solo un indicador de fallo
      results.push({ productId: product.id, sku: product.sku, ok: false, error: 'sync_failed' })
    }
  }

  // Actualizar lastSyncAt de la tienda + counts
  const syncedCount = await prisma.productSync.count({ where: { shopifyStoreId: store.id } })
  await prisma.shopifyStore.update({
    where: { id: store.id },
    data: { lastSyncAt: new Date(), productsCount: syncedCount },
  })

  const succeeded = results.filter((r) => r.ok).length
  const failed = results.length - succeeded

  return apiSuccess({
    store: { id: store.id, shopDomain: store.shopDomain, syncedTotal: syncedCount },
    results,
    summary: { total: results.length, succeeded, failed },
  })
})

type SyncResult = {
  productId: string
  sku: string
  ok: boolean
  error?: string
}
