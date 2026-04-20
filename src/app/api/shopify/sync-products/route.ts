import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { ShopifyClient, type ShopifyProductInput } from '@/lib/integrations/shopify/client'
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/security/rate-limit'
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

  const results: SyncResult[] = []

  for (const product of products) {
    try {
      const sellingPrice =
        data.sellingPrices?.[product.id] ??
        product.precioPublico ??
        product.precioComunidad

      // Verificar si ya está sincronizado
      const existing = await prisma.productSync.findUnique({
        where: {
          shopifyStoreId_productId: {
            shopifyStoreId: store.id,
            productId: product.id,
          },
        },
      })

      const input: ShopifyProductInput = {
        title: product.name,
        body_html: product.description || '',
        vendor: product.marca || 'Vitalcom',
        product_type: product.category || 'Suplemento',
        tags: (product.tags || []).join(', '),
        status: 'active',
        images: (product.images || []).slice(0, 5).map((src) => ({ src })),
        variants: [
          {
            price: sellingPrice.toFixed(2),
            sku: product.sku,
            inventory_management: 'shopify',
            inventory_quantity: 100, // placeholder hasta webhook de stock
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
      console.error('[sync-products] fallo en producto', { sku: product.sku, err: message })
      results.push({ productId: product.id, sku: product.sku, ok: false, error: message })
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
