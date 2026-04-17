import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

type Ctx = { params: Promise<{ slug: string }> }

// ── GET /api/products/slug/[slug] — Producto por slug (público) ──
export const GET = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const { slug } = await ctx!.params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      stock: true,
    },
  })

  if (!product || !product.active) throw new Error('NOT_FOUND')

  return apiSuccess(product)
})
