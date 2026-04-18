import { prisma } from '@/lib/db/prisma'
import { cache, CACHE_TTL, CACHE_TAGS } from '@/lib/cache/memory-cache'
import type { Prisma } from '@prisma/client'

// ── Repository de pedidos con cache ──────────────────────
// Pedidos cambian de estado frecuentemente → TTL short por default.
// Las listas admin se cachean más tiempo porque filtran por estado.

type ListOrdersParams = {
  where: Prisma.OrderWhereInput
  orderBy: Prisma.OrderOrderByWithRelationInput
  skip: number
  take: number
}

function listKey(p: ListOrdersParams): string {
  return `orders:list:${JSON.stringify({
    w: p.where,
    o: p.orderBy,
    s: p.skip,
    t: p.take,
  })}`
}

export const OrderRepository = {
  async list(params: ListOrdersParams) {
    return cache.remember(
      listKey(params),
      async () => {
        const [orders, total] = await Promise.all([
          prisma.order.findMany({
            where: params.where,
            include: {
              items: { include: { product: { select: { id: true, sku: true, name: true } } } },
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: params.orderBy,
            skip: params.skip,
            take: params.take,
          }),
          prisma.order.count({ where: params.where }),
        ])
        return { orders, total }
      },
      { ttlMs: CACHE_TTL.short, tags: [CACHE_TAGS.orders] },
    )
  },

  async findById(id: string) {
    return cache.remember(
      `orders:id:${id}`,
      async () =>
        prisma.order.findUnique({
          where: { id },
          include: {
            items: { include: { product: { select: { id: true, sku: true, name: true, images: true } } } },
            user: { select: { id: true, name: true, email: true } },
          },
        }),
      { ttlMs: CACHE_TTL.short, tags: [CACHE_TAGS.orders] },
    )
  },

  /** Pedidos del usuario — lista personal. */
  async findByUser(userId: string, limit = 20) {
    return cache.remember(
      `orders:user:${userId}:${limit}`,
      async () =>
        prisma.order.findMany({
          where: { userId },
          include: {
            items: { include: { product: { select: { id: true, name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      { ttlMs: CACHE_TTL.short, tags: [CACHE_TAGS.orders] },
    )
  },

  /** Conteo de pedidos de un usuario — para generar número incremental. */
  async countForToday(country: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    // Este count NO se cachea — debe ser siempre preciso para generar números únicos
    return prisma.order.count({
      where: { number: { startsWith: `VC-${country}-${today}` } },
    })
  },

  invalidateAll(): number {
    return cache.invalidateTag(CACHE_TAGS.orders)
  },

  /** Invalida un pedido específico + listas relacionadas (admin + usuario). */
  invalidateOne(id: string, userId?: string | null): void {
    cache.delete(`orders:id:${id}`)
    cache.invalidatePrefix('orders:list:')
    if (userId) cache.invalidatePrefix(`orders:user:${userId}`)
  },
}
