// V27 — Webhook Shopify (orders/create, checkouts/update)
// ═══════════════════════════════════════════════════════════
// Verifica HMAC SHA256 del SHOPIFY_WEBHOOK_SECRET.
// Idempotencia via WebhookEvent @unique(source, externalId).

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { startWorkflow } from '@/lib/flows/workflow-engine'
import { rateLimitWebhook, getClientKey } from '@/lib/security/rate-limit-webhook'
import { WaWorkflowTrigger } from '@prisma/client'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmacHeader))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const rate = rateLimitWebhook(getClientKey(req, 'shopify'))
  if (!rate.allowed) {
    return new NextResponse('Too many requests', { status: 429 })
  }

  const rawBody = await req.text()
  const hmac = req.headers.get('x-shopify-hmac-sha256')

  if (!verifyShopifyHmac(rawBody, hmac)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const eventId = req.headers.get('x-shopify-webhook-id')
  const topic = req.headers.get('x-shopify-topic') ?? 'unknown'
  const shopDomain = req.headers.get('x-shopify-shop-domain')

  if (eventId) {
    // Dedup
    const existing = await prisma.webhookEvent.findUnique({
      where: { source_externalId: { source: 'shopify', externalId: eventId } },
    })
    if (existing) return NextResponse.json({ deduped: true })

    await prisma.webhookEvent.create({
      data: {
        source: 'shopify',
        externalId: eventId,
        topic,
      },
    }).catch(() => {})
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad JSON', { status: 400 })
  }

  // Procesamiento async
  processShopifyEvent(topic, shopDomain, payload).catch(err => {
    console.error('[webhooks/shopify] processing failed:', err)
  })

  return NextResponse.json({ received: true })
}

async function processShopifyEvent(
  topic: string,
  shopDomain: string | null,
  payload: unknown,
): Promise<void> {
  if (!shopDomain) return

  // Buscar tienda Shopify conectada
  const store = await prisma.shopifyStore.findUnique({
    where: { shopDomain },
  })
  if (!store) {
    console.warn('[webhooks/shopify] no ShopifyStore for domain', shopDomain)
    return
  }

  if (topic === 'orders/create') {
    await handleOrderCreated(store.userId, payload as ShopifyOrderPayload)
  } else if (topic === 'checkouts/update' || topic === 'checkouts/create') {
    await handleCheckoutUpdate(store.userId, payload as ShopifyCheckoutPayload)
  }
}

interface ShopifyOrderPayload {
  id: number
  order_number?: number
  total_price?: string
  customer?: { first_name?: string; last_name?: string; email?: string; phone?: string }
  phone?: string
  shipping_address?: { address1?: string; city?: string; province?: string; country?: string; phone?: string }
  line_items?: Array<{ title: string; quantity: number; price: string; image?: { src: string } }>
}

interface ShopifyCheckoutPayload {
  id: number
  token?: string
  abandoned_checkout_url?: string
  customer?: { first_name?: string; last_name?: string; email?: string; phone?: string }
  phone?: string
  total_price?: string
  presentment_currency?: string
  line_items?: Array<{ title: string; quantity: number; price: string; image?: { src: string } }>
}

async function handleOrderCreated(userId: string, order: ShopifyOrderPayload): Promise<void> {
  // Buscar workflows AUTO_CONFIRMATION activos del userId
  const phone = order.shipping_address?.phone ?? order.customer?.phone ?? order.phone
  if (!phone) {
    console.log('[webhooks/shopify] order sin teléfono, skip')
    return
  }

  const workflows = await prisma.waWorkflow.findMany({
    where: {
      userId,
      isActive: true,
      triggerType: WaWorkflowTrigger.ORDER_CREATED,
    },
  })

  for (const wf of workflows) {
    const account = wf.accountId
      ? await prisma.whatsappAccount.findUnique({ where: { id: wf.accountId } })
      : await prisma.whatsappAccount.findFirst({ where: { userId, isActive: true } })
    if (!account) continue

    const phoneE164 = normalizePhone(phone)

    const contact = await prisma.whatsappContact.upsert({
      where: { accountId_phoneE164: { accountId: account.id, phoneE164 } },
      create: {
        accountId: account.id,
        phoneE164,
        firstName: order.customer?.first_name ?? order.shipping_address?.address1?.split(' ')[0],
        lastName: order.customer?.last_name,
        email: order.customer?.email,
        shippingAddress: order.shipping_address?.address1,
        shippingCity: order.shipping_address?.city,
        shippingState: order.shipping_address?.province,
      },
      update: {
        firstName: order.customer?.first_name,
        shippingAddress: order.shipping_address?.address1,
        shippingCity: order.shipping_address?.city,
      },
    })

    const firstItem = order.line_items?.[0]

    await startWorkflow({
      workflowId: wf.id,
      contactId: contact.id,
      orderId: String(order.id),
      initialContext: {
        order_id: order.id,
        order_number: order.order_number,
        order_total: order.total_price,
        product_name: firstItem?.title,
        product_image_url: firstItem?.image?.src,
      },
    }).catch(err => console.error('[shopify→workflow] failed:', err))
  }
}

async function handleCheckoutUpdate(userId: string, checkout: ShopifyCheckoutPayload): Promise<void> {
  const phone = checkout.customer?.phone ?? checkout.phone
  if (!phone || !checkout.abandoned_checkout_url) return

  const account = await prisma.whatsappAccount.findFirst({
    where: { userId, isActive: true },
  })
  if (!account) return

  const phoneE164 = normalizePhone(phone)

  await prisma.abandonedCart.upsert({
    where: { shopifyCartId: String(checkout.id) },
    create: {
      accountId: account.id,
      phoneE164,
      firstName: checkout.customer?.first_name,
      shopifyCartId: String(checkout.id),
      checkoutUrl: checkout.abandoned_checkout_url,
      items: (checkout.line_items ?? []) as unknown as object,
      totalValue: Number(checkout.total_price ?? 0),
      currency: checkout.presentment_currency ?? 'USD',
      expiresAt: new Date(Date.now() + 72 * 3_600_000),
    },
    update: {
      checkoutUrl: checkout.abandoned_checkout_url,
      totalValue: Number(checkout.total_price ?? 0),
    },
  })
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  return '+' + digits
}
