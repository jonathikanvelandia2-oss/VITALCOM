// V33 — GET /api/admin/assets — lista de assets con filtros (staff only)
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AssetStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')
  const url = new URL(req.url)
  const status = url.searchParams.get('status') as AssetStatus | null
  const productId = url.searchParams.get('productId')
  const limit = Math.min(200, Number(url.searchParams.get('limit') ?? 50))

  const where: Record<string, unknown> = {}
  if (status && Object.values(AssetStatus).includes(status)) where.status = status
  if (productId) where.productId = productId

  const [items, counts] = await Promise.all([
    prisma.productAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: { select: { id: true, name: true, slug: true, sku: true } },
      },
    }),
    prisma.productAsset.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const countsByStatus = counts.reduce((acc, c) => {
    acc[c.status] = c._count._all
    return acc
  }, {} as Record<string, number>)

  return apiSuccess({
    items: items.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      driveLastSyncAt: a.driveLastSyncAt?.toISOString() ?? null,
      reviewedAt: a.reviewedAt?.toISOString() ?? null,
    })),
    counts: {
      DRAFT: countsByStatus.DRAFT ?? 0,
      APPROVED: countsByStatus.APPROVED ?? 0,
      FEATURED: countsByStatus.FEATURED ?? 0,
      ARCHIVED: countsByStatus.ARCHIVED ?? 0,
      REJECTED: countsByStatus.REJECTED ?? 0,
    },
  })
})
