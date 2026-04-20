import { NextResponse } from 'next/server'
import { verifyWebhookHmac, isValidShopDomain } from './hmac'

// ── Helpers compartidos para webhooks de Shopify ───────
// Todos los webhooks siguen el mismo patrón:
// 1. Leer body RAW (antes de JSON.parse — HMAC es del raw)
// 2. Verificar X-Shopify-Hmac-Sha256
// 3. Validar shop domain del header
// 4. Parsear JSON y pasar al handler

export type ShopifyWebhookContext = {
  shop: string
  topic: string
  webhookId: string
  body: unknown
}

export type WebhookHandler = (ctx: ShopifyWebhookContext) => Promise<void>

export async function handleShopifyWebhook(
  req: Request,
  handler: WebhookHandler
): Promise<Response> {
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
  const shop = req.headers.get('x-shopify-shop-domain') || ''
  const topic = req.headers.get('x-shopify-topic') || ''
  const webhookId = req.headers.get('x-shopify-webhook-id') || ''

  if (!isValidShopDomain(shop)) {
    return new NextResponse('Invalid shop', { status: 401 })
  }

  // Body RAW para verificación HMAC
  const rawBody = await req.text()

  if (!verifyWebhookHmac(rawBody, hmacHeader)) {
    console.warn('[shopify/webhook] HMAC verification failed', { shop, topic, webhookId })
    return new NextResponse('Invalid HMAC', { status: 401 })
  }

  let body: unknown = null
  if (rawBody) {
    try {
      body = JSON.parse(rawBody)
    } catch {
      // GDPR webhooks pueden venir vacíos — válido.
    }
  }

  try {
    await handler({ shop, topic, webhookId, body })
  } catch (err) {
    // Shopify reintenta si devolvemos >=500. Si es un error permanente del
    // lado nuestro (parse, data malformada), devolvemos 200 para cortar retries
    // pero loggeamos el error.
    console.error('[shopify/webhook] handler error', { shop, topic, err })
    // Reintentable (fallo temporal de BD, timeout): 500 para que Shopify reintente.
    if (err instanceof Error && err.message.includes('RETRYABLE')) {
      return new NextResponse('Retryable error', { status: 500 })
    }
  }

  // Siempre 200 al final: Shopify espera <5s y considerará fallo si no.
  return NextResponse.json({ received: true }, { status: 200 })
}
