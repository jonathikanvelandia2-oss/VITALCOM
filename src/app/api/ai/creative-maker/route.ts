import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/ai/creative-maker ───────────────────────────
// Lista creativos del usuario. Filtros: productId, angle, platform, favoritos.

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const productId = url.searchParams.get('productId')
  const angle = url.searchParams.get('angle')
  const platform = url.searchParams.get('platform')
  const favorites = url.searchParams.get('favorites') === 'true'

  const creatives = await prisma.adCreative.findMany({
    where: {
      userId: session.id,
      ...(productId ? { productId } : {}),
      ...(angle ? { angle: angle as any } : {}),
      ...(platform ? { platform: platform as any } : {}),
      ...(favorites ? { isFavorite: true } : {}),
    },
    include: {
      product: { select: { id: true, name: true, slug: true, images: true } },
    },
    orderBy: [{ isFavorite: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  })

  const counts = await prisma.adCreative.groupBy({
    by: ['angle'],
    where: { userId: session.id },
    _count: true,
  })

  return apiSuccess({
    items: creatives,
    counts: Object.fromEntries(counts.map((c) => [c.angle, c._count])),
  })
})
