'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type AppliedSource = 'MEDIA_BUYER' | 'STORE_OPTIMIZER' | 'CREATIVE_MAKER'
export type ImpactKind = 'savings' | 'revenue' | 'margin' | 'retention'

export type AppliedActionItem = {
  id: string
  source: AppliedSource
  actionType: string
  title: string
  product?: { id: string; name: string; images: string[]; slug?: string } | null
  estimatedImpactUsd: number
  estimatedImpactKind: ImpactKind | null
  estimatedRationale: string | null
  realizedImpactUsd: number | null
  appliedAt: string
}

export type ImpactData = {
  period: { days: number; from: string }
  totals: {
    allTimeApplied: number
    appliedInPeriod: number
    estimatedImpactUsd: number
    realizedImpactUsd: number
    savingsUsd: number
    revenueUsd: number
    marginUsd: number
  }
  bySource: Array<{
    source: AppliedSource
    count: number
    estimatedImpactUsd: number
    realizedImpactUsd: number
  }>
  byType: Array<{
    actionType: string
    count: number
    estimatedImpactUsd: number
  }>
  topActions: AppliedActionItem[]
  timeline: AppliedActionItem[]
  daily: Array<{ day: string; estimated: number; count: number }>
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useImpact(days: 7 | 30 | 90 = 30) {
  return useQuery<ImpactData>({
    queryKey: ['impact', days],
    queryFn: () => fetchJson(`/api/ai/impact?days=${days}`),
  })
}

export function useRecomputeImpact() {
  const qc = useQueryClient()
  return useMutation<{ processed: number; updated: number }, Error, void>({
    mutationFn: () => fetchJson('/api/ai/impact/recompute', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['impact'] }),
  })
}
