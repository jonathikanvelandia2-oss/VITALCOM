'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type HistorySource = 'MEDIA_BUYER' | 'STORE_OPTIMIZER' | 'CREATIVE_MAKER'

export type HistoryItem = {
  id: string
  source: HistorySource
  actionType: string
  title: string
  product: { id: string; name: string; images: string[]; slug: string } | null
  campaign: { id: string; name: string; status: string } | null
  beforeSnapshot: Record<string, unknown>
  estimatedImpactUsd: number | null
  estimatedImpactKind: string | null
  estimatedRationale: string | null
  realizedImpactUsd: number | null
  appliedAt: string
  revertedAt: string | null
  revertSideEffect: string | null
  reversible: boolean
}

export type HistoryResponse = {
  period: { days: number; from: string }
  summary: { total: number; reverted: number; active: number }
  items: HistoryItem[]
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useActionHistory(params: {
  source?: HistorySource | null
  status?: 'applied' | 'reverted' | 'all'
  days?: number
} = {}) {
  const qs = new URLSearchParams()
  if (params.source) qs.set('source', params.source)
  if (params.status) qs.set('status', params.status)
  if (params.days) qs.set('days', String(params.days))

  const queryKey = ['action-history', params.source ?? 'all', params.status ?? 'all', params.days ?? 60]

  return useQuery<HistoryResponse>({
    queryKey,
    queryFn: () => fetchJson(`/api/ai/history?${qs.toString()}`),
    refetchInterval: 60_000,
  })
}

export function useRevertAction() {
  const qc = useQueryClient()
  return useMutation<{ reverted: HistoryItem; result: { sideEffect: string; reversible: boolean } }, Error, string>({
    mutationFn: (id) => fetchJson(`/api/ai/history/${id}/revert`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-history'] })
      qc.invalidateQueries({ queryKey: ['impact'] })
      qc.invalidateQueries({ queryKey: ['command-center'] })
    },
  })
}
