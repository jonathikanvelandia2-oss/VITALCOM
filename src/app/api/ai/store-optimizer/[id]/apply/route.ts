import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/store-optimizer/[id]/apply ──────────────
// Ejecuta la acción sugerida y marca la recomendación como APPLIED.
// Side effects por tipo:
//  - PRICING_ADJUSTMENT / MARGIN_IMPROVEMENT → update ProductSync.sellingPrice
//  - HIGHLIGHT_PRODUCT → update Product.bestseller = true
//  - REMOVE_UNDERPERFORMER → ProductSync.status = 'inactive'
//  - Otros (CROSS_SELL/LANDING_COPY/RESTOCK_URGENT/PRODUCT_MIX) → solo marcar

export const POST = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params

  const rec = await prisma.storeOptimization.findFirst({
    where: { id, userId: session.id, status: 'PENDING' },
    include: { product: true },
  })
  if (!rec) return apiError('Recomendación no encontrada o ya aplicada', 404, 'NOT_FOUND')

  let sideEffect: string | null = null

  // Ajustar precio → actualizar ProductSync del usuario para ese producto
  if ((rec.type === 'PRICING_ADJUSTMENT' || rec.type === 'MARGIN_IMPROVEMENT')
      && rec.productId && rec.suggestedValue) {
    const sync = await prisma.productSync.findFirst({
      where: {
        productId: rec.productId,
        store: { userId: session.id },
      },
    })
    if (sync) {
      await prisma.productSync.update({
        where: { id: sync.id },
        data: { sellingPrice: rec.suggestedValue },
      })
      sideEffect = `price_updated:${rec.productId}:${rec.suggestedValue}`
    }
  }

  // Destacar producto → marcar bestseller
  if (rec.type === 'HIGHLIGHT_PRODUCT' && rec.productId) {
    await prisma.product.update({
      where: { id: rec.productId },
      data: { bestseller: true },
    })
    sideEffect = `product_featured:${rec.productId}`
  }

  // Remover underperformer → desactivar sync
  if (rec.type === 'REMOVE_UNDERPERFORMER' && rec.productId) {
    const sync = await prisma.productSync.findFirst({
      where: {
        productId: rec.productId,
        store: { userId: session.id },
      },
    })
    if (sync) {
      await prisma.productSync.update({
        where: { id: sync.id },
        data: { status: 'inactive' },
      })
      sideEffect = `product_deactivated:${rec.productId}`
    }
  }

  const updated = await prisma.storeOptimization.update({
    where: { id },
    data: { status: 'APPLIED', appliedAt: new Date() },
  })

  return apiSuccess({ optimization: updated, sideEffect })
})
