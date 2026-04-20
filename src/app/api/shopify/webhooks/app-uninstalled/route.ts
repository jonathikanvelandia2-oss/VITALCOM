import { prisma } from '@/lib/db/prisma'
import { handleShopifyWebhook } from '@/lib/integrations/shopify/webhook-helpers'

// ── POST /api/shopify/webhooks/app-uninstalled ─────────
// Cuando el merchant desinstala la app, invalidamos su token y marcamos
// la tienda como desconectada. No borramos el registro histórico: mantener
// el log de conexión previa es útil para la comunidad / soporte.

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return handleShopifyWebhook(req, async ({ shop }) => {
    await prisma.shopifyStore.updateMany({
      where: { shopDomain: shop },
      data: {
        accessToken: null,
        status: 'disconnected',
      },
    })
    console.info('[webhook:app-uninstalled] tienda desconectada', { shop })
  })
}
