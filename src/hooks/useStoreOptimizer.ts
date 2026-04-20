'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type OptimizationType =
  | 'HIGHLIGHT_PRODUCT'
  | 'PRICING_ADJUSTMENT'
  | 'LANDING_COPY'
  | 'CROSS_SELL'
  | 'PRODUCT_MIX'
  | 'MARGIN_IMPROVEMENT'
  | 'RESTOCK_URGENT'
  | 'REMOVE_UNDERPERFORMER'

export type OptimizationStatus = 'PENDING' | 'APPLIED' | 'DISMISSED' | 'EXPIRED'

export type StoreOptimization = {
  id: string
  userId: string
  productId: string | null
  type: OptimizationType
  status: OptimizationStatus
  priority: number
  title: string
  reasoning: string
  actionLabel: string
  suggestedValue: number | null
  suggestedText: string | null
  suggestedData: Record<string, unknown> | null
  salesLast30: number | null
  revenueLast30: number | null
  marginPct: number | null
  stockLevel: number | null
  conversionRate: number | null
  confidence: number | null
  appliedAt: string | null
  dismissedAt: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
  product?: {
    id: string
    name: string
    sku: string
    images: string[]
    slug: string
    precioPublico: number
  } | null
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useStoreOptimizations(filter?: { type?: OptimizationType; history?: boolean }) {
  const params = new URLSearchParams()
  if (filter?.type) params.set('type', filter.type)
  if (filter?.history) params.set('history', 'true')
  const q = params.toString()
  return useQuery<{
    items: StoreOptimization[]
    counts: Record<string, number>
    byType: Record<string, number>
  }>({
    queryKey: ['store-optimizations', filter],
    queryFn: () => fetchJson(`/api/ai/store-optimizer${q ? `?${q}` : ''}`),
  })
}

export function useGenerateOptimizations() {
  const qc = useQueryClient()
  return useMutation<{ created: number; total: number; deduped: number }, Error, void>({
    mutationFn: () => fetchJson('/api/ai/store-optimizer/generate', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-optimizations'] }),
  })
}

export function useApplyOptimization() {
  const qc = useQueryClient()
  return useMutation<
    { optimization: StoreOptimization; sideEffect: string | null },
    Error,
    string
  >({
    mutationFn: (id) => fetchJson(`/api/ai/store-optimizer/${id}/apply`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-optimizations'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['shopify-stores'] })
    },
  })
}

export function useDismissOptimization() {
  const qc = useQueryClient()
  return useMutation<StoreOptimization, Error, string>({
    mutationFn: (id) => fetchJson(`/api/ai/store-optimizer/${id}/dismiss`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-optimizations'] }),
  })
}
