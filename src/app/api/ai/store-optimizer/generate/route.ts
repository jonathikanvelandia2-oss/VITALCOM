import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { generateOptimizations } from '@/lib/ai/agents/store-optimizer'
import {
  expireStaleStoreOptimizer,
  seenStoreOptimizerKeys,
  STORE_OPTIMIZER_EXPIRY_MS,
} from '@/lib/ai/recommendation-helpers'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/store-optimizer/generate ────────────────
// Analiza catálogo + ventas + tienda del usuario y crea nuevas
// recomendaciones. Deduplica contra PENDING existentes.

export const POST = withErrorHandler(async () => {
  const session = await requireSession()

  const [{ optimizations }] = await Promise.all([
    generateOptimizations(session.id),
    expireStaleStoreOptimizer(session.id),
  ])

  const seen = await seenStoreOptimizerKeys(session.id)

  const expiresAt = new Date(Date.now() + STORE_OPTIMIZER_EXPIRY_MS)
  const toCreate = optimizations.filter((r) => !seen.has(`${r.type}:${r.productId ?? 'none'}`))

  if (toCreate.length > 0) {
    await prisma.storeOptimization.createMany({
      data: toCreate.map((r) => ({
        userId: session.id,
        productId: r.productId,
        type: r.type,
        title: r.title,
        reasoning: r.reasoning,
        actionLabel: r.actionLabel,
        suggestedValue: r.suggestedValue,
        suggestedText: r.suggestedText,
        suggestedData: r.suggestedData as any,
        priority: r.priority,
        confidence: r.confidence,
        salesLast30: r.metrics.salesLast30,
        revenueLast30: r.metrics.revenueLast30,
        marginPct: r.metrics.marginPct,
        stockLevel: r.metrics.stockLevel,
        conversionRate: r.metrics.conversionRate,
        expiresAt,
      })),
    })
  }

  return apiSuccess({
    created: toCreate.length,
    total: optimizations.length,
    deduped: optimizations.length - toCreate.length,
  })
})
