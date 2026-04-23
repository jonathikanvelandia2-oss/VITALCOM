// V36 — GET /api/products/[id]/download-pack
// Devuelve el manifest de descarga con todos los assets aprobados del
// producto, organizados en secciones listas para que el dropshipper las
// importe a su Shopify. El frontend consume el JSON y genera los links.

import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AssetStatus } from '@prisma/client'
import { buildDownloadManifest, type AssetLike, type ProductLike } from '@/lib/catalog/product-detail'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  await requireSession()
  const { id } = await ctx!.params

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      sku: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      images: true,
      precioComunidad: true,
      precioPublico: true,
      precioPrivado: true,
      ingredients: true,
      benefits: true,
      howToUse: true,
      testimonials: true,
      active: true,
    },
  })

  if (!product || !product.active) {
    return apiError('Producto no encontrado', 404, 'NOT_FOUND')
  }

  const rawAssets = await prisma.productAsset.findMany({
    where: {
      productId: id,
      status: { in: [AssetStatus.APPROVED, AssetStatus.FEATURED] },
    },
    orderBy: [{ status: 'desc' }, { heroRank: 'asc' }, { createdAt: 'desc' }],
  })

  const assets: AssetLike[] = rawAssets.map((a) => ({
    id: a.id,
    type: a.type,
    angle: a.angle,
    cloudinaryUrl: a.cloudinaryUrl,
    originalMime: a.originalMime,
    title: a.title,
    altText: a.altText,
    caption: a.caption,
    heroRank: a.heroRank,
    status: a.status,
    quality: a.quality,
    width: a.width,
    height: a.height,
    durationSec: a.durationSec,
  }))

  const productLike: ProductLike = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    images: product.images,
    precioComunidad: product.precioComunidad,
    precioPublico: product.precioPublico,
    precioPrivado: product.precioPrivado,
    ingredients: product.ingredients,
    benefits: product.benefits,
    howToUse: product.howToUse,
    testimonials: product.testimonials,
  }

  const manifest = buildDownloadManifest(productLike, assets)
  return apiSuccess(manifest)
})
