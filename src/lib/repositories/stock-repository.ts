import { prisma } from '@/lib/db/prisma'
import { cache, CACHE_TTL, CACHE_TAGS } from '@/lib/cache/memory-cache'
import { ProductRepository } from '@/lib/repositories/product-repository'
import type { Prisma, Country } from '@prisma/client'

// ── Repository de stock con cache ────────────────────────
// Stock cambia más lento que productos (updates manuales, pedidos).
// TTL medium (5min) ya que writes vía upsert invalidan explícitamente.

type ListStockParams = {
  where: Prisma.StockWhereInput
  skip: number
  take: number
}

function listKey(p: ListStockParams): string {
  return `stock:list:${JSON.stringify({ w: p.where, s: p.skip, t: p.take })}`
}

export const StockRepository = {
  async list(params: ListStockParams) {
    return cache.remember(
      listKey(params),
      async () => {
        const [items, total] = await Promise.all([
          prisma.stock.findMany({
            where: params.where,
            include: {
              product: {
                select: { id: true, sku: true, name: true, category: true, active: true, images: true },
              },
            },
            orderBy: { product: { name: 'asc' } },
            skip: params.skip,
            take: params.take,
          }),
          prisma.stock.count({ where: params.where }),
        ])
        return { items, total }
      },
      { ttlMs: CACHE_TTL.medium, tags: [CACHE_TAGS.stock] },
    )
  },

  /** Stock de un producto específico por país. */
  async findByProduct(productId: string, country?: Country) {
    const key = `stock:product:${productId}:${country ?? 'all'}`
    return cache.remember(
      key,
      async () =>
        prisma.stock.findMany({
          where: { productId, ...(country ? { country } : {}) },
          orderBy: { country: 'asc' },
        }),
      { ttlMs: CACHE_TTL.short, tags: [CACHE_TAGS.stock] },
    )
  },

  /** Productos con stock bajo — para alertas en admin. */
  async lowStock(country: Country, threshold = 10) {
    return cache.remember(
      `stock:low:${country}:${threshold}`,
      async () =>
        prisma.stock.findMany({
          where: {
            country,
            quantity: { lt: threshold },
            product: { active: true },
          },
          include: {
            product: { select: { id: true, sku: true, name: true, category: true } },
          },
          orderBy: { quantity: 'asc' },
          take: 50,
        }),
      { ttlMs: CACHE_TTL.short, tags: [CACHE_TAGS.stock] },
    )
  },

  /** Invalida todo el cache de stock + productos (product response incluye stock). */
  invalidateAll(): number {
    const stockCount = cache.invalidateTag(CACHE_TAGS.stock)
    const productCount = cache.invalidateTag(CACHE_TAGS.products)
    return stockCount + productCount
  },

  /** Invalida stock de un producto específico — también invalida el producto. */
  invalidateProduct(productId: string, slug?: string): void {
    cache.invalidatePrefix(`stock:product:${productId}`)
    cache.invalidatePrefix('stock:list:')
    cache.invalidatePrefix('stock:low:')
    ProductRepository.invalidateOne(productId, slug)
  },
}
