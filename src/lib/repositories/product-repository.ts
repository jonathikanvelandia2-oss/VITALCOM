import { prisma } from '@/lib/db/prisma'
import { cache, CACHE_TTL, CACHE_TAGS } from '@/lib/cache/memory-cache'
import type { Prisma } from '@prisma/client'

// ── Repository de productos con cache ────────────────────
// Centraliza queries de productos + invalidación automática.
// Usa CACHE_TTL.medium por default (5min) para datos de catálogo.

type ListParams = {
  where: Prisma.ProductWhereInput
  orderBy: Prisma.ProductOrderByWithRelationInput
  skip: number
  take: number
  includeStock?: boolean
}

function listCacheKey(p: ListParams): string {
  return `products:list:${JSON.stringify({
    w: p.where,
    o: p.orderBy,
    s: p.skip,
    t: p.take,
    is: p.includeStock,
  })}`
}

export const ProductRepository = {
  /** Lista paginada con cache. */
  async list(params: ListParams) {
    const key = listCacheKey(params)
    return cache.remember(
      key,
      async () => {
        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where: params.where,
            include: params.includeStock ? { stock: true } : undefined,
            orderBy: params.orderBy,
            skip: params.skip,
            take: params.take,
          }),
          prisma.product.count({ where: params.where }),
        ])
        return { products, total }
      },
      { ttlMs: CACHE_TTL.medium, tags: [CACHE_TAGS.products] },
    )
  },

  /** Lookup por id con cache. */
  async findById(id: string) {
    return cache.remember(
      `products:id:${id}`,
      async () =>
        prisma.product.findUnique({
          where: { id },
          include: { stock: true },
        }),
      { ttlMs: CACHE_TTL.medium, tags: [CACHE_TAGS.products] },
    )
  },

  /** Lookup por slug con cache (para landings públicas). */
  async findBySlug(slug: string) {
    return cache.remember(
      `products:slug:${slug}`,
      async () =>
        prisma.product.findUnique({
          where: { slug },
          include: { stock: true },
        }),
      { ttlMs: CACHE_TTL.long, tags: [CACHE_TAGS.products] },
    )
  },

  /** Productos activos top por salesCount — catálogo público. */
  async topSelling(limit = 20) {
    return cache.remember(
      `products:top:${limit}`,
      async () =>
        prisma.product.findMany({
          where: { active: true },
          orderBy: { salesCount: 'desc' },
          take: limit,
          include: { stock: true },
        }),
      { ttlMs: CACHE_TTL.long, tags: [CACHE_TAGS.products] },
    )
  },

  /** Invalida todo el cache de productos — llamar tras POST/PUT/DELETE. */
  invalidateAll(): number {
    return cache.invalidateTag(CACHE_TAGS.products)
  },

  /** Invalida solo un producto específico. */
  invalidateOne(id: string, slug?: string): void {
    cache.delete(`products:id:${id}`)
    if (slug) cache.delete(`products:slug:${slug}`)
    // Las listas también se invalidan porque contienen este item
    cache.invalidatePrefix('products:list:')
    cache.invalidatePrefix('products:top:')
  },
}
