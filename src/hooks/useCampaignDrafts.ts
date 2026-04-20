'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type DraftStatus = 'DRAFT' | 'READY' | 'LAUNCHED' | 'PAUSED' | 'ARCHIVED'
export type CampaignObjective = 'CONVERSIONS' | 'TRAFFIC' | 'REACH' | 'LEADS' | 'ENGAGEMENT' | 'MESSAGES'
export type AdPlatform = 'META' | 'TIKTOK' | 'GOOGLE' | 'OTHER'

export type CampaignDraft = {
  id: string
  userId: string
  productId: string | null
  name: string
  platform: AdPlatform
  objective: CampaignObjective
  status: DraftStatus
  step: number
  targetCountry: 'CO' | 'EC' | 'GT' | 'CL' | null
  ageMin: number | null
  ageMax: number | null
  gender: string | null
  interests: string[]
  placements: string[]
  headline: string | null
  primaryText: string | null
  description: string | null
  cta: string | null
  imageUrl: string | null
  videoUrl: string | null
  landingUrl: string | null
  dailyBudget: number | null
  totalBudget: number | null
  durationDays: number | null
  startDate: string | null
  launchedCampaignId: string | null
  externalId: string | null
  launchNotes: string | null
  createdAt: string
  updatedAt: string
  product?: {
    id: string
    sku: string
    name: string
    images: string[]
    precioComunidad: number
    precioPublico?: number
    description?: string | null
    videoUrl?: string | null
    benefits?: unknown
  } | null
}

export type CampaignDraftPatch = Partial<{
  name: string
  productId: string | null
  platform: AdPlatform
  objective: CampaignObjective
  status: DraftStatus
  step: number
  targetCountry: 'CO' | 'EC' | 'GT' | 'CL' | null
  ageMin: number | null
  ageMax: number | null
  gender: string | null
  interests: string[]
  placements: string[]
  headline: string | null
  primaryText: string | null
  description: string | null
  cta: string | null
  imageUrl: string | null
  videoUrl: string | null
  landingUrl: string | null
  dailyBudget: number | null
  totalBudget: number | null
  durationDays: number | null
  startDate: string | null
}>

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useCampaignDrafts(status?: DraftStatus) {
  return useQuery<{ items: CampaignDraft[] }>({
    queryKey: ['campaign-drafts', status ?? 'all'],
    queryFn: () => fetchJson(`/api/campaigns/drafts${status ? `?status=${status}` : ''}`),
  })
}

export function useCampaignDraft(id?: string) {
  return useQuery<CampaignDraft>({
    queryKey: ['campaign-draft', id],
    queryFn: () => fetchJson(`/api/campaigns/drafts/${id}`),
    enabled: !!id,
  })
}

export function useCreateCampaignDraft() {
  const qc = useQueryClient()
  return useMutation<CampaignDraft, Error, { name: string; productId?: string; platform?: AdPlatform }>({
    mutationFn: (data) =>
      fetchJson('/api/campaigns/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-drafts'] }),
  })
}

export function useUpdateCampaignDraft() {
  const qc = useQueryClient()
  return useMutation<CampaignDraft, Error, { id: string; data: CampaignDraftPatch }>({
    mutationFn: ({ id, data }) =>
      fetchJson(`/api/campaigns/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['campaign-drafts'] })
      qc.invalidateQueries({ queryKey: ['campaign-draft', id] })
    },
  })
}

export function useDeleteCampaignDraft() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => fetchJson(`/api/campaigns/drafts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-drafts'] }),
  })
}

export function useLaunchCampaignDraft() {
  const qc = useQueryClient()
  return useMutation<
    { draft: CampaignDraft; linkedCampaignId: string | null; oauthConnected: boolean },
    Error,
    string
  >({
    mutationFn: (id) =>
      fetchJson(`/api/campaigns/drafts/${id}/launch`, { method: 'POST' }),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['campaign-drafts'] })
      qc.invalidateQueries({ queryKey: ['campaign-draft', id] })
      qc.invalidateQueries({ queryKey: ['ad-campaigns'] })
    },
  })
}

export function useSuggestCreative() {
  return useMutation<
    { suggestion: { headline: string; primaryText: string; description: string } },
    Error,
    string
  >({
    mutationFn: (id) =>
      fetchJson(`/api/campaigns/drafts/${id}/suggest`, { method: 'POST' }),
  })
}
