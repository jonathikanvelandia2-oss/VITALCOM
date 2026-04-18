import { prisma } from '@/lib/db/prisma'
import { cache, CACHE_TTL } from '@/lib/cache/memory-cache'
import {
  calculatePnL,
  getPnLTimeseries,
  getProfitabilityByProduct,
  type Period,
} from '@/lib/finance/pnl-service'
import type { FinanceCategory, FinanceType, FinanceSource, Prisma } from '@prisma/client'

// ── FinanceRepository con cache ──────────────────────────
// Tag "finance:{userId}" para invalidar todo el P&L de un user.

const TAG = (userId: string) => `finance:${userId}`

type CreateEntryInput = {
  userId: string
  date?: Date
  type: FinanceType
  category: FinanceCategory
  amount: number
  currency?: string
  description?: string
  source?: FinanceSource
  relatedOrderId?: string
  relatedProductId?: string
  metadata?: Prisma.InputJsonValue
}

export const FinanceRepository = {
  /** P&L consolidado del usuario en un periodo. */
  async getPnL(userId: string, period: Period = '30d') {
    return cache.remember(
      `finance:pnl:${userId}:${period}`,
      () => calculatePnL(userId, period),
      { ttlMs: CACHE_TTL.medium, tags: [TAG(userId)] },
    )
  },

  /** Time series diario de ingresos/egresos. */
  async getTimeseries(userId: string, days = 30) {
    return cache.remember(
      `finance:timeseries:${userId}:${days}`,
      () => getPnLTimeseries(userId, days),
      { ttlMs: CACHE_TTL.medium, tags: [TAG(userId)] },
    )
  },

  /** Productos más rentables para el dropshipper. */
  async getProfitability(userId: string, period: Period = '30d', limit = 10) {
    return cache.remember(
      `finance:profitability:${userId}:${period}:${limit}`,
      () => getProfitabilityByProduct(userId, period, limit),
      { ttlMs: CACHE_TTL.medium, tags: [TAG(userId)] },
    )
  },

  /** Lista paginada de entries (para ver/editar manualmente). */
  async listEntries(
    userId: string,
    opts: { type?: FinanceType; category?: FinanceCategory; limit?: number; offset?: number } = {},
  ) {
    const { type, category, limit = 50, offset = 0 } = opts
    return cache.remember(
      `finance:entries:${userId}:${JSON.stringify(opts)}`,
      async () =>
        prisma.financeEntry.findMany({
          where: { userId, ...(type ? { type } : {}), ...(category ? { category } : {}) },
          orderBy: { date: 'desc' },
          skip: offset,
          take: limit,
        }),
      { ttlMs: CACHE_TTL.short, tags: [TAG(userId)] },
    )
  },

  async createEntry(input: CreateEntryInput) {
    const entry = await prisma.financeEntry.create({
      data: {
        userId: input.userId,
        date: input.date ?? new Date(),
        type: input.type,
        category: input.category,
        amount: input.amount,
        currency: input.currency ?? 'COP',
        description: input.description,
        source: input.source ?? 'MANUAL',
        relatedOrderId: input.relatedOrderId,
        relatedProductId: input.relatedProductId,
        metadata: input.metadata,
      },
    })
    this.invalidateUser(input.userId)
    return entry
  },

  async updateEntry(id: string, userId: string, data: Partial<CreateEntryInput>) {
    const updated = await prisma.financeEntry.update({
      where: { id },
      data: {
        date: data.date,
        type: data.type,
        category: data.category,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        source: data.source,
      },
    })
    this.invalidateUser(userId)
    return updated
  },

  async deleteEntry(id: string, userId: string) {
    await prisma.financeEntry.delete({ where: { id } })
    this.invalidateUser(userId)
  },

  /** Crea entries automáticos cuando una orden se entrega. Idempotente. */
  async recordOrderDelivery(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, precioCosto: true } },
          },
        },
      },
    })
    if (!order || !order.userId) return
    const userId = order.userId

    // Evitar duplicados: eliminar entries previas de esta orden (si las hay)
    await prisma.financeEntry.deleteMany({
      where: {
        userId,
        relatedOrderId: orderId,
        source: { in: ['ORDER_REVENUE', 'ORDER_COGS', 'ORDER_SHIPPING'] },
      },
    })

    // Ingreso por venta
    await prisma.financeEntry.create({
      data: {
        userId,
        date: new Date(),
        type: 'INGRESO',
        category: 'VENTA',
        amount: order.total,
        currency: 'COP',
        description: `Venta pedido ${order.number}`,
        source: 'ORDER_REVENUE',
        relatedOrderId: orderId,
      },
    })

    // COGS — suma de (precioCosto × cantidad) de cada item
    const cogs = order.items.reduce((sum, item) => {
      const unitCost = item.product.precioCosto ?? 0
      return sum + unitCost * item.quantity
    }, 0)
    if (cogs > 0) {
      await prisma.financeEntry.create({
        data: {
          userId,
          date: new Date(),
          type: 'EGRESO',
          category: 'COSTO_PRODUCTO',
          amount: cogs,
          currency: 'COP',
          description: `Costo producto pedido ${order.number}`,
          source: 'ORDER_COGS',
          relatedOrderId: orderId,
        },
      })
    }

    // Envío
    if (order.shipping > 0) {
      await prisma.financeEntry.create({
        data: {
          userId,
          date: new Date(),
          type: 'EGRESO',
          category: 'ENVIO',
          amount: order.shipping,
          currency: 'COP',
          description: `Envío pedido ${order.number}`,
          source: 'ORDER_SHIPPING',
          relatedOrderId: orderId,
        },
      })
    }

    this.invalidateUser(userId)
  },

  /** Cuando una orden se cancela, elimina los entries auto generados. */
  async recordOrderCancellation(orderId: string) {
    const entries = await prisma.financeEntry.findMany({
      where: {
        relatedOrderId: orderId,
        source: { in: ['ORDER_REVENUE', 'ORDER_COGS', 'ORDER_SHIPPING'] },
      },
      select: { id: true, userId: true },
    })
    if (entries.length === 0) return

    const userId = entries[0].userId
    await prisma.financeEntry.deleteMany({
      where: { id: { in: entries.map((e) => e.id) } },
    })
    this.invalidateUser(userId)
  },

  /** Cuando una orden se devuelve, genera entry de DEVOLUCION. */
  async recordOrderReturn(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, total: true, number: true },
    })
    if (!order?.userId) return

    await prisma.financeEntry.create({
      data: {
        userId: order.userId,
        type: 'EGRESO',
        category: 'DEVOLUCION',
        amount: order.total,
        currency: 'COP',
        description: `Devolución pedido ${order.number}`,
        source: 'ORDER_RETURN',
        relatedOrderId: orderId,
      },
    })
    this.invalidateUser(order.userId)
  },

  invalidateUser(userId: string): number {
    return cache.invalidateTag(TAG(userId))
  },
}
