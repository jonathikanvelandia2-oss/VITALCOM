import { prisma } from '@/lib/db/prisma'
import type { BotResult } from './types'

// ── StockBot ─────────────────────────────────────────────
// Recorre stock CO bajo (<20u) y para cada dropshipper que
// está vendiendo ese producto en sus últimos 30d crea una
// Notification AI_ACTION con link a /optimizador. Dedup por
// (productId, userId) en las últimas 24h.

const LOW_STOCK_THRESHOLD = 20

export async function runStockBot(): Promise<BotResult> {
  const lowStock = await prisma.stock.findMany({
    where: { country: 'CO', quantity: { lt: LOW_STOCK_THRESHOLD, gt: 0 } },
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  })

  if (lowStock.length === 0) {
    return {
      usersProcessed: 0,
      itemsAffected: 0,
      notifsCreated: 0,
      errors: 0,
      summary: 'Sin productos en stock bajo — todo ok.',
    }
  }

  const from30 = new Date(Date.now() - 30 * 86400000)
  const cutoff24 = new Date(Date.now() - 24 * 3600 * 1000)

  let usersProcessed = 0
  let notifsCreated = 0
  let errors = 0
  const errorLog: Array<{ userId?: string; message: string }> = []
  const usersSeen = new Set<string>()

  for (const stock of lowStock) {
    // Dropshippers que han vendido este producto en 30d
    const sellers = await prisma.order.findMany({
      where: {
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: from30 },
        userId: { not: null },
        items: { some: { productId: stock.productId } },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    for (const s of sellers) {
      if (!s.userId) continue
      usersSeen.add(s.userId)

      try {
        // Dedup: ya hay notif AI_ACTION reciente sobre este producto?
        const existing = await prisma.notification.findFirst({
          where: {
            userId: s.userId,
            type: 'AI_ACTION',
            createdAt: { gte: cutoff24 },
            meta: { path: ['productId'], equals: stock.productId },
          },
          select: { id: true },
        })
        if (existing) continue

        await prisma.notification.create({
          data: {
            userId: s.userId,
            type: 'AI_ACTION',
            title: `⚠️ Stock bajo: "${stock.product.name}"`,
            body: `Quedan ${stock.quantity} unidades en CO de un producto que estás vendiendo. Asegura reposición antes que se agote.`,
            link: '/optimizador',
            meta: {
              productId: stock.productId,
              sku: stock.product.sku,
              quantity: stock.quantity,
              bot: 'STOCK_BOT',
              priority: 88,
            },
          },
        })
        notifsCreated++
      } catch (err) {
        errors++
        errorLog.push({
          userId: s.userId,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  usersProcessed = usersSeen.size

  return {
    usersProcessed,
    itemsAffected: lowStock.length,
    notifsCreated,
    errors,
    errorLog,
    summary: `${lowStock.length} productos en stock bajo · ${usersProcessed} dropshippers notificados · ${notifsCreated} notifs creadas.`,
  }
}
