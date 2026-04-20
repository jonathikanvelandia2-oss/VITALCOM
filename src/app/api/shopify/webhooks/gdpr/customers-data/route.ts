import { handleShopifyWebhook } from '@/lib/integrations/shopify/webhook-helpers'

// ── POST /api/shopify/webhooks/gdpr/customers-data ─────
// OBLIGATORIO para cualquier app Shopify. Shopify lo invoca cuando un
// customer solicita una copia de sus datos (art. 15 GDPR).
//
// Política Vitalcom: NO guardamos datos personales del customer final
// del merchant más allá de lo estrictamente necesario para procesar
// el pedido (nombre, dirección, contacto). Esos datos están vinculados
// a la Order y se exportan/borran junto con ella.
//
// Respondemos 200 para que Shopify sepa que recibimos la solicitud.
// El fulfillment real (generar export) se hace vía email a soporte@vitalcom.co.

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return handleShopifyWebhook(req, async ({ shop, body }) => {
    const payload = body as {
      shop_id?: number
      shop_domain?: string
      customer?: { id?: number; email?: string }
      orders_requested?: number[]
    } | null

    console.info('[webhook:gdpr/customers-data] solicitud recibida', {
      shop,
      customerId: payload?.customer?.id,
      customerEmail: payload?.customer?.email,
      ordersCount: payload?.orders_requested?.length || 0,
    })

    // TODO (cuando haya equipo de soporte): notificar a soporte@vitalcom.co
    // con los datos del customer para generar export manual dentro de 30 días.
  })
}
