import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { expireStaleMediaBuyer } from '@/lib/ai/recommendation-helpers'

export const dynamic = 'force-dynamic'

// ── GET /api/ai/media-buyer ──────────────────────────────
// Lista recomendaciones activas (PENDING) del usuario, ordenadas por prioridad.
// Expira automáticamente las que pasaron su expiresAt.

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const includeHistory = url.searchParams.get('history') === 'true'

  await expireStaleMediaBuyer(session.id)

  const recs = await prisma.campaignRecommendation.findMany({
    where: {
      userId: session.id,
      ...(includeHistory ? {} : { status: 'PENDING' }),
    },
    include: {
      campaign: { select: { id: true, name: true, status: true } },
      account: { select: { id: true, platform: true, accountName: true, currency: true } },
    },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  // Conteo rápido por status
  const counts = await prisma.campaignRecommendation.groupBy({
    by: ['status'],
    where: { userId: session.id },
    _count: true,
  })

  return apiSuccess({
    items: recs,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
  })
})
