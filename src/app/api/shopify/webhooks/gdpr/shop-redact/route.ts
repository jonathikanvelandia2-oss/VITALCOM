import { prisma } from '@/lib/db/prisma'
import { handleShopifyWebhook } from '@/lib/integrations/shopify/webhook-helpers'

// ── POST /api/shopify/webhooks/gdpr/shop-redact ────────
// OBLIGATORIO. Shopify invoca 48h después de desinstalación si el
// merchant ya no tiene plan activo. Debemos borrar TODOS los datos
// de la tienda (tokens, ProductSync).
//
// No borramos las Orders (fiscal: 5 años mínimo en Colombia) pero
// anonimizamos datos personales asociados.

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return handleShopifyWebhook(req, async ({ shop, body }) => {
    const payload = body as { shop_id?: number; shop_domain?: string } | null
    const shopDomain = payload?.shop_domain || shop

    const store = await prisma.shopifyStore.findUnique({
      where: { shopDomain },
      select: { id: true },
    })

    if (!store) {
      console.info('[webhook:gdpr/shop-redact] tienda no encontrada', { shop })
      return
    }

    // Borrar ProductSync (cascada por onDelete: Cascade en schema)
    // Borrar ShopifyStore (con esto cae todo el vínculo merchant→Vitalcom).
    // Nota: las Orders NO se borran (retención fiscal 5 años en CO/EC/GT/CL).
    // La anonimización per-customer se gestiona vía gdpr/customers-redact.
    await prisma.$transaction([
      prisma.productSync.deleteMany({ where: { shopifyStoreId: store.id } }),
      prisma.shopifyStore.delete({ where: { id: store.id } }),
    ])

    console.info('[webhook:gdpr/shop-redact] tienda y sync borrados', { shop })
  })
}
