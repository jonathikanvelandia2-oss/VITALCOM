import { prisma } from '@/lib/db/prisma'

// ── Helpers compartidos para los 3 agentes IA ────────────
// Consolida los patrones de expiración + dedup que antes estaban
// duplicados en MediaBuyer.generate, OptimizadorTienda.generate y
// CommandCenter.refresh. Single source of truth.

/** Marca como EXPIRED todas las PENDING vencidas del usuario. */
export async function expireStaleMediaBuyer(userId: string) {
  return prisma.campaignRecommendation.updateMany({
    where: { userId, status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  })
}

export async function expireStaleStoreOptimizer(userId: string) {
  return prisma.storeOptimization.updateMany({
    where: { userId, status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  })
}

/** Dedup por (type, campaignId) para MediaBuyer. Retorna Set de keys ya vistos. */
export async function seenMediaBuyerKeys(userId: string): Promise<Set<string>> {
  const existing = await prisma.campaignRecommendation.findMany({
    where: { userId, status: 'PENDING' },
    select: { type: true, campaignId: true },
  })
  return new Set(existing.map((e) => `${e.type}:${e.campaignId ?? 'none'}`))
}

/** Dedup por (type, productId) para OptimizadorTienda. */
export async function seenStoreOptimizerKeys(userId: string): Promise<Set<string>> {
  const existing = await prisma.storeOptimization.findMany({
    where: { userId, status: 'PENDING' },
    select: { type: true, productId: true },
  })
  return new Set(existing.map((e) => `${e.type}:${e.productId ?? 'none'}`))
}

export const MEDIA_BUYER_EXPIRY_MS = 72 * 3600 * 1000          // 72h
export const STORE_OPTIMIZER_EXPIRY_MS = 14 * 24 * 3600 * 1000 // 14d
