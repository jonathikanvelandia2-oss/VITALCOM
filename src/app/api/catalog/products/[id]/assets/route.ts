// V33 — GET /api/catalog/products/[id]/assets
// ═══════════════════════════════════════════════════════════
// Assets APPROVED/FEATURED del producto, ordenados por heroRank.
// Endpoint público-comunidad (cualquier user autenticado lo usa).

import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AssetStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  await requireSession()
  const { id: productId } = await ctx!.params

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, active: true },
  })
  if (!product || !product.active) {
    return apiError('Producto no encontrado', 404, 'NOT_FOUND')
  }

  const assets = await prisma.productAsset.findMany({
    where: {
      productId,
      status: { in: [AssetStatus.APPROVED, AssetStatus.FEATURED] },
    },
    orderBy: [
      { status: 'desc' }, // FEATURED antes que APPROVED
      { heroRank: 'asc' },
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      type: true,
      angle: true,
      format: true,
      cloudinaryUrl: true,
      width: true,
      height: true,
      durationSec: true,
      originalMime: true,
      title: true,
      caption: true,
      altText: true,
      heroRank: true,
      status: true,
      quality: true,
    },
  })

  return apiSuccess({ items: assets })
})
