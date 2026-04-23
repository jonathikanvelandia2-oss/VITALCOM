// V36 — POST /api/products/[id]/suggest-angles
// Devuelve 3 ángulos psicológicos sugeridos para el producto, usando el
// helper determinista. Sin LLM por defecto — rápido, gratis, reejecutable.

import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { guardRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { prisma } from '@/lib/db/prisma'
import { suggestAnglesForProduct } from '@/lib/catalog/product-detail'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const blocked = guardRateLimit(`suggest-angles:${session.id}`, RATE_LIMITS.api)
  if (blocked) return blocked

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

  const angles = suggestAnglesForProduct(product, 3)
  return apiSuccess({ productId: id, angles })
})
