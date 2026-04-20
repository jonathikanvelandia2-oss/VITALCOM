import { prisma } from '@/lib/db/prisma'
import { handleShopifyWebhook } from '@/lib/integrations/shopify/webhook-helpers'

// ── POST /api/shopify/webhooks/orders-create ───────────
// Shopify envía cada nuevo pedido. Creamos una Order en Vitalcom
// con source=DROPSHIPPER para que LOGISTICA lo procese.

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return handleShopifyWebhook(req, async ({ shop, body }) => {
    const order = body as ShopifyOrderPayload | null
    if (!order || !order.id) {
      console.warn('[webhook:orders-create] payload vacío o sin id')
      return
    }

    const store = await prisma.shopifyStore.findUnique({
      where: { shopDomain: shop },
      select: { id: true, userId: true },
    })
    if (!store) {
      console.warn('[webhook:orders-create] tienda no registrada', { shop })
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
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const countToday = await prisma.order.count({
      where: {
        country,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    })
    const number = `VC-${country}-${today}-${String(countToday + 1).padStart(4, '0')}`

    const subtotal = Number(order.subtotal_price || 0)
    const shipping = Number(order.total_shipping_price_set?.shop_money?.amount || 0)
    const total = Number(order.total_price || 0)

    // Mapear line_items a OrderItems — buscar producto Vitalcom por SKU
    const items = Array.isArray(order.line_items) ? order.line_items : []
    const itemsToCreate: Array<{
      productId: string
      quantity: number
      unitPrice: number
      total: number
    }> = []

    for (const item of items) {
      if (!item.sku) continue
      const product = await prisma.product.findUnique({
        where: { sku: item.sku },
        select: { id: true },
      })
      if (!product) continue
      const qty = Number(item.quantity || 1)
      const unitPrice = Number(item.price || 0)
      itemsToCreate.push({
        productId: product.id,
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
      })
    }

    if (itemsToCreate.length === 0) {
      console.warn('[webhook:orders-create] ningún SKU Vitalcom encontrado en el pedido', {
        shop,
        orderId: externalRef,
      })
      return
    }

    const customerName = [order.customer?.first_name, order.customer?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Cliente Shopify'

    await prisma.order.create({
      data: {
        number,
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
