import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { expireStaleStoreOptimizer } from '@/lib/ai/recommendation-helpers'

export const dynamic = 'force-dynamic'

// ── GET /api/ai/store-optimizer ──────────────────────────
// Lista recomendaciones activas del optimizador de tienda.
// Expira las vencidas (>14d) on-the-fly.

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const includeHistory = url.searchParams.get('history') === 'true'
  const type = url.searchParams.get('type')

  await expireStaleStoreOptimizer(session.id)

  const where: Record<string, unknown> = { userId: session.id }
  if (!includeHistory) where.status = 'PENDING'
  if (type) where.type = type

  const items = await prisma.storeOptimization.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true, sku: true, images: true, slug: true, precioPublico: true },
      },
    },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  const counts = await prisma.storeOptimization.groupBy({
    by: ['status'],
    where: { userId: session.id },
    _count: true,
  })

  const byType = await prisma.storeOptimization.groupBy({
    by: ['type'],
    where: { userId: session.id, status: 'PENDING' },
    _count: true,
  })

  return apiSuccess({
    items,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
    byType: Object.fromEntries(byType.map((c) => [c.type, c._count])),
  })
})
