'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type RecommendationType =
  | 'PAUSE_CAMPAIGN'
  | 'SCALE_BUDGET'
  | 'REDUCE_BUDGET'
  | 'TEST_CREATIVE'
  | 'TEST_AUDIENCE'
  | 'OPTIMIZE_BID'
  | 'RESTART_CAMPAIGN'
  | 'ADD_TRACKING'

export type RecommendationStatus = 'PENDING' | 'APPLIED' | 'DISMISSED' | 'EXPIRED'

export type CampaignRecommendation = {
  id: string
  userId: string
  campaignId: string | null
  accountId: string | null
  type: RecommendationType
  status: RecommendationStatus
  priority: number
  title: string
  reasoning: string
  actionLabel: string
  suggestedValue: number | null
  roas: number | null
  spend: number | null
  revenue: number | null
  clicks: number | null
  conversions: number | null
  impressions: number | null
  confidence: number | null
  appliedAt: string | null
  dismissedAt: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
  campaign?: { id: string; name: string; status: string } | null
  account?: { id: string; platform: string; accountName: string | null; currency: string } | null
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useMediaBuyerRecs(includeHistory = false) {
  return useQuery<{ items: CampaignRecommendation[]; counts: Record<string, number> }>({
    queryKey: ['media-buyer-recs', includeHistory],
    queryFn: () => fetchJson(`/api/ai/media-buyer${includeHistory ? '?history=true' : ''}`),
  })
}

export function useGenerateMediaBuyerRecs() {
  const qc = useQueryClient()
  return useMutation<
    { created: number; total: number; deduped: number },
    Error,
    { days?: number } | void
  >({
    mutationFn: (input) =>
      fetchJson(`/api/ai/media-buyer/generate${input?.days ? `?days=${input.days}` : ''}`, {
        method: 'POST',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-buyer-recs'] }),
  })
}

export function useApplyMediaBuyerRec() {
  const qc = useQueryClient()
  return useMutation<
    { recommendation: CampaignRecommendation; sideEffect: string | null },
    Error,
    string
  >({
    mutationFn: (id) =>
      fetchJson(`/api/ai/media-buyer/${id}/apply`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-buyer-recs'] })
      qc.invalidateQueries({ queryKey: ['ad-campaigns'] })
      qc.invalidateQueries({ queryKey: ['ads-overview'] })
    },
  })
}

export function useDismissMediaBuyerRec() {
  const qc = useQueryClient()
  return useMutation<CampaignRecommendation, Error, string>({
    mutationFn: (id) =>
      fetchJson(`/api/ai/media-buyer/${id}/dismiss`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-buyer-recs'] }),
  })
}
