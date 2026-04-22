import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { handleShopifyWebhook } from '@/lib/integrations/shopify/webhook-helpers'
import { captureException, captureWarning } from '@/lib/observability'

// ── POST /api/shopify/webhooks/orders-create ───────────
// Shopify envía cada nuevo pedido. Creamos una Order en Vitalcom
// con source=DROPSHIPPER para que LOGISTICA lo procese.

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return handleShopifyWebhook(req, async ({ shop, body }) => {
    const order = body as ShopifyOrderPayload | null
    if (!order || !order.id) {
      captureWarning('[webhook:orders-create] payload vacío o sin id', {
        route: '/api/shopify/webhooks/orders-create',
      })
      return
    }

    const store = await prisma.shopifyStore.findUnique({
      where: { shopDomain: shop },
      select: { id: true, userId: true },
    })
    if (!store) {
      captureWarning('[webhook:orders-create] tienda no registrada', {
        route: '/api/shopify/webhooks/orders-create',
        extra: { shop },
      })
      return
    }

    const externalRef = String(order.id)

    // Idempotencia: si ya procesamos este pedido, salir.
    const existing = await prisma.order.findFirst({
      where: { externalRef, source: 'DROPSHIPPER' },
      select: { id: true },
    })
    if (existing) return

    const country = inferCountry(order.shipping_address?.country_code)
    const subtotal = Number(order.subtotal_price || 0)
    const shipping = Number(order.total_shipping_price_set?.shop_money?.amount || 0)
    const total = Number(order.total_price || 0)

    // Batch lookup de productos por SKU — evita N+1 si el pedido trae
    // muchos line_items (antes hacía un findUnique por ítem).
    const items = Array.isArray(order.line_items) ? order.line_items : []
    const skus = Array.from(
      new Set(items.map(i => i.sku).filter((s): s is string => Boolean(s))),
    )
    const products = skus.length
      ? await prisma.product.findMany({
          where: { sku: { in: skus } },
          select: { id: true, sku: true },
        })
      : []
    const bySku = new Map(products.map(p => [p.sku, p.id]))

    const itemsToCreate: Array<{
      productId: string
      quantity: number
      unitPrice: number
      total: number
    }> = []

    for (const item of items) {
      if (!item.sku) continue
      const productId = bySku.get(item.sku)
      if (!productId) continue
      const qty = Number(item.quantity || 1)
      const unitPrice = Number(item.price || 0)
      itemsToCreate.push({
        productId,
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
      })
    }

    if (itemsToCreate.length === 0) {
      captureWarning('[webhook:orders-create] ningún SKU Vitalcom encontrado en el pedido', {
        route: '/api/shopify/webhooks/orders-create',
        extra: { shop, orderId: externalRef },
      })
      return
    }

    const customerName = [order.customer?.first_name, order.customer?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Cliente Shopify'

    // Crear con retry en caso de colisión de number (dos webhooks
    // simultáneos pueden querer asignar el mismo). P2002 = unique constraint.
    await createOrderWithRetry({
      country,
      data: {
        userId: store.userId,
        source: 'DROPSHIPPER',
        country,
        status: 'PENDING',
        customerName,
        customerEmail: order.customer?.email || order.email || 'no-email@shopify.com',
        customerPhone: order.customer?.phone || order.shipping_address?.phone || null,
        customerAddress: formatAddress(order.shipping_address),
        subtotal,
        shipping,
        total,
        externalRef,
        notes: order.note || null,
        items: { create: itemsToCreate },
      },
    })
  })
}

// Genera number + intenta crear Order. Si falla por unique constraint
// en `number` (dos webhooks compiten por el mismo slot), reintenta con
// un contador incrementado. Máx 5 intentos.
async function createOrderWithRetry(params: {
  country: 'CO' | 'EC' | 'GT' | 'CL'
  data: Omit<Prisma.OrderUncheckedCreateInput, 'number'>
}) {
  const { country, data } = params
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  for (let attempt = 0; attempt < 5; attempt++) {
    const countToday = await prisma.order.count({
      where: { country, createdAt: { gte: startOfDay } },
    })
    const seq = countToday + 1 + attempt
    const number = `VC-${country}-${todayStr}-${String(seq).padStart(4, '0')}`
    try {
      await prisma.order.create({ data: { ...data, number } })
      return
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError
        && err.code === 'P2002'
      ) {
        continue // colisión, siguiente slot
      }
      captureException(err, {
        route: '/api/shopify/webhooks/orders-create',
        tags: { stage: 'create-order' },
        extra: { attempt, number },
      })
      throw err
    }
  }
  throw new Error('No se pudo asignar número único de pedido tras 5 intentos')
}

function inferCountry(code?: string): 'CO' | 'EC' | 'GT' | 'CL' {
  const c = (code || 'CO').toUpperCase()
  if (c === 'CO' || c === 'EC' || c === 'GT' || c === 'CL') return c
  return 'CO'
}

function formatAddress(addr: ShopifyAddress | undefined): string | null {
  if (!addr) return null
  return [addr.address1, addr.address2, addr.city, addr.province, addr.country, addr.zip]
    .filter(Boolean)
    .join(', ')
}

// ── Tipos mínimos del payload Shopify ─────────────────
// Shopify manda muchos más campos; aquí solo los que usamos.

type ShopifyAddress = {
  address1?: string
  address2?: string
  city?: string
  province?: string
  country?: string
  country_code?: string
  zip?: string
  phone?: string
}

type ShopifyLineItem = {
  sku?: string
  quantity?: number
  price?: string | number
  title?: string
}

type ShopifyOrderPayload = {
  id: number | string
  email?: string
  note?: string
  subtotal_price?: string | number
  total_price?: string | number
  total_shipping_price_set?: { shop_money?: { amount?: string | number } }
  line_items?: ShopifyLineItem[]
  customer?: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
  }
  shipping_address?: ShopifyAddress
}
