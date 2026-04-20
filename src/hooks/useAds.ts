'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type AdPlatform = 'META' | 'TIKTOK' | 'GOOGLE' | 'OTHER'

export type AdAccount = {
  id: string
  platform: AdPlatform
  accountId: string
  accountName: string | null
  currency: string
  connected: boolean
  lastSyncAt: string | null
  campaignCount: number
  spendCount: number
  totalSpend: number
  totalClicks: number
  totalConversions: number
  createdAt: string
}

export type AdCampaign = {
  id: string
  accountId: string
  accountPlatform: AdPlatform
  accountName: string | null
  name: string
  objective: string | null
  status: string
  startDate: string | null
  endDate: string | null
  totalSpend: number
  totalClicks: number
  totalConversions: number
}

export type AdSpendEntry = {
  id: string
  date: string
  spend: number
  impressions: number | null
  clicks: number | null
  conversions: number | null
  source: string
  notes: string | null
  account: { id: string; platform: AdPlatform; name: string | null; currency: string }
  campaign: { id: string; name: string } | null
}

export type AdsOverview = {
  period: { days: number; from: string }
  kpis: {
    totalSpend: number
    totalClicks: number
    totalImpressions: number
    totalConversions: number
    totalRevenue: number
    orderCount: number
    roas: number
    cpc: number
    ctr: number
    cpa: number
  }
  byPlatform: Array<{ platform: AdPlatform; spend: number; clicks: number; conversions: number; share: number }>
  dailySpend: Array<{ day: string; spend: number }>
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useAdAccounts() {
  return useQuery<{ items: AdAccount[] }>({
    queryKey: ['ad-accounts'],
    queryFn: () => fetchJson('/api/ads/accounts'),
  })
}

export function useCreateAdAccount() {
  const qc = useQueryClient()
  return useMutation<
    unknown,
    Error,
    { platform: AdPlatform; accountId: string; accountName?: string; currency?: string }
  >({
    mutationFn: (data) =>
      fetchJson('/api/ads/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ad-accounts'] })
      qc.invalidateQueries({ queryKey: ['ads-overview'] })
    },
  })
}

export function useDeleteAdAccount() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => fetchJson(`/api/ads/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ad-accounts'] })
      qc.invalidateQueries({ queryKey: ['ads-overview'] })
    },
  })
}

export function useAdCampaigns(accountId?: string) {
  return useQuery<{ items: AdCampaign[] }>({
    queryKey: ['ad-campaigns', accountId ?? null],
    queryFn: () => fetchJson(`/api/ads/campaigns${accountId ? `?accountId=${accountId}` : ''}`),
  })
}

export function useCreateAdCampaign() {
  const qc = useQueryClient()
  return useMutation<
    unknown,
    Error,
    { accountId: string; name: string; objective?: string; status?: string; startDate?: string; endDate?: string }
  >({
    mutationFn: (data) =>
      fetchJson('/api/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-campaigns'] }),
  })
}

export function useAdSpend(params?: { accountId?: string; from?: string; to?: string }) {
  const q = new URLSearchParams()
  if (params?.accountId) q.set('accountId', params.accountId)
  if (params?.from) q.set('from', params.from)
  if (params?.to) q.set('to', params.to)
  const qs = q.toString()
  return useQuery<{ items: AdSpendEntry[] }>({
    queryKey: ['ad-spend', params ?? null],
    queryFn: () => fetchJson(`/api/ads/spend${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateAdSpend() {
  const qc = useQueryClient()
  return useMutation<
    unknown,
    Error,
    {
      accountId: string
      campaignId?: string | null
      date: string
      spend: number
      impressions?: number
      clicks?: number
      conversions?: number
      notes?: string
    }
  >({
    mutationFn: (data) =>
      fetchJson('/api/ads/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ad-spend'] })
      qc.invalidateQueries({ queryKey: ['ads-overview'] })
      qc.invalidateQueries({ queryKey: ['ad-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-pnl'] })
      qc.invalidateQueries({ queryKey: ['finance-entries'] })
    },
  })
}

export function useDeleteAdSpend() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => fetchJson(`/api/ads/spend/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ad-spend'] })
      qc.invalidateQueries({ queryKey: ['ads-overview'] })
      qc.invalidateQueries({ queryKey: ['ad-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-pnl'] })
    },
  })
}

export function useAdsOverview(days: 7 | 30 | 90 = 30) {
  return useQuery<AdsOverview>({
    queryKey: ['ads-overview', days],
    queryFn: () => fetchJson(`/api/ads/overview?days=${days}`),
  })
}
