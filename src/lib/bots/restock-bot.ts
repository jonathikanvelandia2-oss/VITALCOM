import { prisma } from '@/lib/db/prisma'
import type { BotResult } from './types'

// ── RestockBot ───────────────────────────────────────────
// Agrega demanda de 30 días contra stock actual y calcula
// "días de cobertura". Notifica a los admins (SUPERADMIN +
// ADMIN + MANAGER_AREA con area=LOGISTICA) cuando algún
// producto tiene menos de 14 días de cobertura.

const COVERAGE_DAYS_THRESHOLD = 14
const MIN_SALES_TO_CONSIDER = 5

export async function runRestockBot(): Promise<BotResult> {
  const from30 = new Date(Date.now() - 30 * 86400000)
  const cutoff24 = new Date(Date.now() - 24 * 3600 * 1000)

  // Ventas de los últimos 30d por producto (items agregados)
  const sales = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: from30 },
      },
    },
    _sum: { quantity: true },
  })

  const criticalProducts: Array<{
    productId: string
    name: string
    sku: string
    stock: number
    dailySales: number
    coverageDays: number
  }> = []

  for (const s of sales) {
    const qty = s._sum.quantity ?? 0
    if (qty < MIN_SALES_TO_CONSIDER) continue

    const dailySales = qty / 30
    const stock = await prisma.stock.findFirst({
      where: { productId: s.productId, country: 'CO' },
      include: { product: { select: { name: true, sku: true } } },
    })
    if (!stock || stock.quantity === 0) continue

    const coverageDays = stock.quantity / dailySales
    if (coverageDays < COVERAGE_DAYS_THRESHOLD) {
      criticalProducts.push({
        productId: s.productId,
        name: stock.product.name,
        sku: stock.product.sku,
        stock: stock.quantity,
        dailySales: Math.round(dailySales * 10) / 10,
        coverageDays: Math.round(coverageDays),
      })
    }
  }

  if (criticalProducts.length === 0) {
    return {
      usersProcessed: 0,
      itemsAffected: 0,
      notifsCreated: 0,
      errors: 0,
      summary: 'Todo el catálogo tiene cobertura >14 días.',
    }
  }

  // Notificar admins
  const admins = await prisma.user.findMany({
    where: {
      active: true,
      OR: [
        { role: 'SUPERADMIN' },
        { role: 'ADMIN' },
        { role: 'MANAGER_AREA', area: 'LOGISTICA' },
      ],
    },
    select: { id: true },
  })

  let notifsCreated = 0
  let errors = 0
  const errorLog: Array<{ userId?: string; message: string }> = []

  // Top 5 más críticos en el body
  const top = criticalProducts.sort((a, b) => a.coverageDays - b.coverageDays).slice(0, 5)
  const body = top
    .map((p) => `• ${p.name} (${p.sku}): ${p.stock}u · ${p.coverageDays}d de cobertura`)
    .join('\n')

  for (const admin of admins) {
    try {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: admin.id,
          type: 'SYSTEM',
          createdAt: { gte: cutoff24 },
          meta: { path: ['bot'], equals: 'RESTOCK_BOT' },
        },
      })
      if (existing) continue

      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM',
          title: `📦 Restock urgente: ${criticalProducts.length} producto(s)`,
          body: `Productos con menos de 14 días de cobertura:\n${body}${criticalProducts.length > 5 ? `\n…y ${criticalProducts.length - 5} más` : ''}`,
          link: '/admin/stock',
          meta: {
            bot: 'RESTOCK_BOT',
            critical: criticalProducts.length,
            top: top.map((p) => p.productId),
          },
        },
      })
      notifsCreated++
    } catch (err) {
      errors++
      errorLog.push({
        userId: admin.id,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    usersProcessed: admins.length,
    itemsAffected: criticalProducts.length,
    notifsCreated,
    errors,
    errorLog,
    summary: `${criticalProducts.length} productos críticos · ${notifsCreated} admins notificados.`,
  }
}
