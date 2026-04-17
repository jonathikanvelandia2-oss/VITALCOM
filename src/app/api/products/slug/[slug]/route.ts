import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { ProductRepository } from '@/lib/repositories/product-repository'

type Ctx = { params: Promise<{ slug: string }> }

// ── GET /api/products/slug/[slug] — Producto por slug (público) ──
export const GET = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const { slug } = await ctx!.params

  const product = await ProductRepository.findBySlug(slug)
  if (!product || !product.active) throw new Error('NOT_FOUND')

  return apiSuccess(product)
})
