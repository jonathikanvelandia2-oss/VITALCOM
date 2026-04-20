'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type ActionSource =
  | 'MEDIA_BUYER'
  | 'STORE_OPTIMIZER'
  | 'CREATIVE_MAKER'
  | 'FINANCE_ALERT'

export type UnifiedAction = {
  id: string
  source: ActionSource
  sourceLabel: string
  sourceIcon: string
  link: string
  type: string
  title: string
  reasoning: string
  actionLabel: string
  priority: number
  confidence: number
  createdAt: string
  productName?: string | null
  productImage?: string | null
  metrics?: Record<string, number | null>
}

export type CommandCenterData = {
  actions: UnifiedAction[]
  groups: {
    critical: UnifiedAction[]
    high: UnifiedAction[]
    medium: UnifiedAction[]
    low: UnifiedAction[]
  }
  bySource: Record<ActionSource, number>
  totalPending: number
  kpis: {
    revenue30d: number
    adSpend30d: number
    netProfit30d: number
    netMarginPct: number
    roas: number
    orders30d: number
    conversions30d: number
    pendingOrders: number
    lowStockCount: number
    productsAvailable: number
    shopifyConnected: number
  }
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useCommandCenter() {
  return useQuery<CommandCenterData>({
    queryKey: ['command-center'],
    queryFn: () => fetchJson('/api/ai/command-center'),
    refetchInterval: 60_000,  // refresh pasivo cada 60s
  })
}

export function useRefreshCommandCenter() {
  const qc = useQueryClient()
  return useMutation<
    {
      mediaBuyer: { created: number; total: number }
      storeOptimizer: { created: number; total: number }
      totalNew: number
    },
    Error,
    void
  >({
    mutationFn: () => fetchJson('/api/ai/command-center/refresh', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['command-center'] })
      qc.invalidateQueries({ queryKey: ['media-buyer-recs'] })
      qc.invalidateQueries({ queryKey: ['store-optimizations'] })
    },
  })
}
