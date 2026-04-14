import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { connectStoreSchema } from '@/lib/api/schemas/shopify'

// ── GET /api/shopify/stores — Tiendas del usuario ───────
export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const stores = await prisma.shopifyStore.findMany({
    where: { userId: session.id },
    include: {
      syncedProducts: {
        include: { product: { select: { id: true, name: true, sku: true, precioComunidad: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const mapped = stores.map((s) => ({
    id: s.id,
    shopDomain: s.shopDomain,
    storeName: s.storeName,
    status: s.status,
    plan: s.plan,
    productsCount: s.productsCount,
    syncedProducts: s.syncedProducts.length,
    connectedAt: s.connectedAt,
    lastSyncAt: s.lastSyncAt,
    createdAt: s.createdAt,
  }))

  return apiSuccess({ stores: mapped })
})

// ── POST /api/shopify/stores — Conectar tienda ─────────
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = connectStoreSchema.parse(body)

  // Verificar que el dominio no esté registrado
  const existing = await prisma.shopifyStore.findUnique({
    where: { shopDomain: data.shopDomain },
  })
  if (existing) throw new Error('DOMAIN_TAKEN')

  const store = await prisma.shopifyStore.create({
    data: {
      userId: session.id,
      shopDomain: data.shopDomain,
      storeName: data.storeName,
      plan: data.plan || 'Basic',
      status: 'active',
      connectedAt: new Date(),
    },
  })

  return apiSuccess(store, 201)
})
