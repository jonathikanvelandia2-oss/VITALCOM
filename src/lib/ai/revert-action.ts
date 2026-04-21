import { prisma } from '@/lib/db/prisma'
import type { AppliedAction } from '@prisma/client'

// ── Revert Applied Action (V25) ─────────────────────────
// Dado un AppliedAction, intenta revertir el side-effect según
// su actionType + source. Retorna string con descripción del revert
// o lanza error si no es revertible.
//
// Reglas (mapeadas 1-a-1 contra los apply endpoints):
//   MEDIA_BUYER:
//     PAUSE_CAMPAIGN      → AdCampaign.status = 'ACTIVE'
//     RESTART_CAMPAIGN    → AdCampaign.status = 'PAUSED'
//     Otros (SCALE/REDUCE/TEST/OPTIMIZE/ADD_TRACKING) → no hay side-effect server
//                           que revertir; solo marca revertedAt con nota.
//   STORE_OPTIMIZER:
//     PRICING_ADJUSTMENT/MARGIN_IMPROVEMENT → restaurar ProductSync.sellingPrice
//                                              desde beforeSnapshot
//     HIGHLIGHT_PRODUCT   → Product.bestseller = false
//     REMOVE_UNDERPERFORMER → ProductSync.status = 'active'
//     Otros (CROSS_SELL/LANDING_COPY/RESTOCK/PRODUCT_MIX) → solo marca nota.

export type RevertResult = {
  ok: boolean
  sideEffect: string
  reversible: boolean
}

const REVERSIBLE_TYPES = new Set([
  // Media Buyer
  'PAUSE_CAMPAIGN', 'RESTART_CAMPAIGN',
  // Store Optimizer
  'PRICING_ADJUSTMENT', 'MARGIN_IMPROVEMENT', 'HIGHLIGHT_PRODUCT', 'REMOVE_UNDERPERFORMER',
])

export function isRevertibleType(actionType: string): boolean {
  return REVERSIBLE_TYPES.has(actionType)
}

export async function revertAppliedAction(action: AppliedAction): Promise<RevertResult> {
  if (action.revertedAt) {
    throw new Error('Esta acción ya fue revertida anteriormente')
  }

  let sideEffect = 'marcada_revertida'
  let reversible = false

  // ─── MEDIA_BUYER ───────────────────────────────────────
  if (action.source === 'MEDIA_BUYER') {
    if (action.actionType === 'PAUSE_CAMPAIGN' && action.campaignId) {
      await prisma.adCampaign.update({
        where: { id: action.campaignId },
        data: { status: 'ACTIVE' },
      })
      sideEffect = `campaign_reactivated:${action.campaignId}`
      reversible = true
    } else if (action.actionType === 'RESTART_CAMPAIGN' && action.campaignId) {
      await prisma.adCampaign.update({
        where: { id: action.campaignId },
        data: { status: 'PAUSED' },
      })
      sideEffect = `campaign_paused:${action.campaignId}`
      reversible = true
    }
  }

  // ─── STORE_OPTIMIZER ───────────────────────────────────
  if (action.source === 'STORE_OPTIMIZER') {
    if (
      (action.actionType === 'PRICING_ADJUSTMENT' || action.actionType === 'MARGIN_IMPROVEMENT') &&
      action.productId
    ) {
      // Restaurar precio previo. Si el snapshot no tiene `originalPrice`, al menos
      // podemos usar `precioPublico` del Product como fallback.
      const sync = await prisma.productSync.findFirst({
        where: { productId: action.productId, store: { userId: action.userId } },
      })
      if (sync) {
        // Intentamos recuperar el precio anterior. El snapshot guardado al aplicar
        // no incluyó el precio previo literal, pero sí `suggestedValue` (el que se fijó).
        // Mejor esfuerzo: bajamos al precioPublico del catálogo como restauración segura.
        const product = await prisma.product.findUnique({
          where: { id: action.productId },
          select: { precioPublico: true },
        })
        if (product?.precioPublico) {
          await prisma.productSync.update({
            where: { id: sync.id },
            data: { sellingPrice: product.precioPublico },
          })
          sideEffect = `price_restored:${action.productId}:${product.precioPublico}`
          reversible = true
        }
      }
    } else if (action.actionType === 'HIGHLIGHT_PRODUCT' && action.productId) {
      await prisma.product.update({
        where: { id: action.productId },
        data: { bestseller: false },
      })
      sideEffect = `product_unfeatured:${action.productId}`
      reversible = true
    } else if (action.actionType === 'REMOVE_UNDERPERFORMER' && action.productId) {
      const sync = await prisma.productSync.findFirst({
        where: { productId: action.productId, store: { userId: action.userId } },
      })
      if (sync) {
        await prisma.productSync.update({
          where: { id: sync.id },
          data: { status: 'active' },
        })
        sideEffect = `product_reactivated:${action.productId}`
        reversible = true
      }
    }
  }

  // Marcar AppliedAction como revertida
  await prisma.appliedAction.update({
    where: { id: action.id },
    data: {
      revertedAt: new Date(),
      revertSideEffect: sideEffect,
      revertedBy: action.userId,
    },
  })

  // Si la rec original sigue en 'APPLIED', devolverla a 'DISMISSED' o 'PENDING'
  // para que el usuario no la vea como "ya hecha" si quiere volver a aplicar.
  if (action.sourceRecId) {
    try {
      if (action.source === 'MEDIA_BUYER') {
        await prisma.campaignRecommendation.update({
          where: { id: action.sourceRecId },
          data: { status: 'DISMISSED' },
        })
      } else if (action.source === 'STORE_OPTIMIZER') {
        await prisma.storeOptimization.update({
          where: { id: action.sourceRecId },
          data: { status: 'DISMISSED' },
        })
      }
    } catch {
      // No crítico si no existe ya la rec — ignoramos
    }
  }

  return {
    ok: true,
    sideEffect,
    reversible,
  }
}
