import { cache, CACHE_TTL, CACHE_TAGS } from '@/lib/cache/memory-cache'
import { getWinningProducts, getCommunityStats } from '@/lib/insights/winning-products'
import type { Period } from '@/lib/finance/pnl-service'

// ── InsightsRepository — datos agregados de toda la comunidad ──
// Tags: 'insights' (invalidar todo) + 'orders' (invalida cuando cambian órdenes)
// TTL medio porque cambian con cada orden entregada; no es crítico ver datos
// 5min atrasados para un ranking global.

const TAG = 'insights'

export const InsightsRepository = {
  /** Top N productos ganadores agregados desde todas las órdenes. */
  async getWinningProducts(period: Period = '30d', limit = 10) {
    return cache.remember(
      `insights:winning:${period}:${limit}`,
      () => getWinningProducts(period, limit),
      { ttlMs: CACHE_TTL.medium, tags: [TAG, CACHE_TAGS.orders] },
    )
  },

  /** Stats agregadas de la comunidad (órdenes, revenue, dropshippers activos). */
  async getCommunityStats(period: Period = '30d') {
    return cache.remember(
      `insights:stats:${period}`,
      () => getCommunityStats(period),
      { ttlMs: CACHE_TTL.medium, tags: [TAG, CACHE_TAGS.orders] },
    )
  },

  invalidate(): number {
    return cache.invalidateTag(TAG)
  },
}
