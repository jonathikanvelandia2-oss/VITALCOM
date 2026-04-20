import { prisma } from '@/lib/db/prisma'
import { handleShopifyWebhook } from '@/lib/integrations/shopify/webhook-helpers'

// ── POST /api/shopify/webhooks/gdpr/customers-redact ───
// OBLIGATORIO. Shopify invoca esto 48h después de que un customer
// solicita borrado (art. 17 GDPR — "derecho al olvido").
//
// Anonimizamos los datos personales en las Orders vinculadas:
// nombre → "Cliente eliminado", email/phone/dirección → vacío.
// Los montos y SKUs se conservan para analítica del merchant y
// cumplimiento fiscal (obligatorio retener facturación 5 años).

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return handleShopifyWebhook(req, async ({ shop, body }) => {
    const payload = body as {
      shop_id?: number
      customer?: { id?: number; email?: string; phone?: string }
      orders_to_redact?: number[]
    } | null

    if (!payload?.customer?.email && !payload?.orders_to_redact?.length) {
      console.info('[webhook:gdpr/customers-redact] sin datos a redactar', { shop })
      return
    }

    const orderExternalRefs = (payload.orders_to_redact || []).map(String)
    const customerEmail = payload.customer?.email?.toLowerCase().trim()

    // Buscar orders por externalRef (id Shopify) o por email del customer
    const whereClauses: any[] = []
    if (orderExternalRefs.length > 0) {
      whereClauses.push({ externalRef: { in: orderExternalRefs } })
    }
    if (customerEmail) {
      whereClauses.push({ customerEmail })
    }

    if (whereClauses.length === 0) return

    const redacted = await prisma.order.updateMany({
      where: { OR: whereClauses, source: 'DROPSHIPPER' },
      data: {
        customerName: 'Cliente eliminado',
        customerEmail: 'redacted@gdpr.local',
        customerPhone: null,
        customerAddress: null,
      },
    })

    console.info('[webhook:gdpr/customers-redact] orders anonimizadas', {
      shop,
      count: redacted.count,
    })
  })
}
