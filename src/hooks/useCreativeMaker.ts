'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type CreativeAngle =
  | 'BENEFIT'
  | 'PAIN_POINT'
  | 'SOCIAL_PROOF'
  | 'URGENCY'
  | 'LIFESTYLE'
  | 'TESTIMONIAL'
  | 'BEFORE_AFTER'
  | 'PROBLEM_SOLUTION'

export type CreativePlatform = 'META' | 'TIKTOK' | 'GOOGLE'
export type CreativeRatio = 'SQUARE' | 'PORTRAIT' | 'STORY' | 'LANDSCAPE'
export type CreativeStatus = 'GENERATING' | 'READY' | 'FAILED'

export type AdCreative = {
  id: string
  userId: string
  productId: string
  angle: CreativeAngle
  platform: CreativePlatform
  ratio: CreativeRatio
  status: CreativeStatus
  headline: string
  primaryText: string
  description: string | null
  cta: string | null
  hashtags: string[]
  imageUrl: string | null
  imagePrompt: string | null
  score: number
  reasoning: string | null
  isFavorite: boolean
  timesUsed: number
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
  product?: { id: string; name: string; slug: string; images: string[] } | null
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useCreatives(filters?: {
  productId?: string
  angle?: CreativeAngle
  platform?: CreativePlatform
  favorites?: boolean
}) {
  const params = new URLSearchParams()
  if (filters?.productId) params.set('productId', filters.productId)
  if (filters?.angle) params.set('angle', filters.angle)
  if (filters?.platform) params.set('platform', filters.platform)
  if (filters?.favorites) params.set('favorites', 'true')
  const qs = params.toString()
  return useQuery<{ items: AdCreative[]; counts: Record<string, number> }>({
    queryKey: ['creatives', filters],
    queryFn: () => fetchJson(`/api/ai/creative-maker${qs ? `?${qs}` : ''}`),
  })
}

export function useGenerateCreatives() {
  const qc = useQueryClient()
  return useMutation<
    { created: number; items: AdCreative[] },
    Error,
    {
      productId: string
      platform?: CreativePlatform
      angles?: CreativeAngle[]
      ratios?: CreativeRatio[]
    }
  >({
    mutationFn: (input) =>
      fetchJson('/api/ai/creative-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creatives'] }),
  })
}

export function useUpdateCreative() {
  const qc = useQueryClient()
  return useMutation<
    AdCreative,
    Error,
    {
      id: string
      isFavorite?: boolean
      headline?: string
      primaryText?: string
      description?: string
      cta?: string
    }
  >({
    mutationFn: ({ id, ...data }) =>
      fetchJson(`/api/ai/creative-maker/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creatives'] }),
  })
}

export function useDeleteCreative() {
  const qc = useQueryClient()
  return useMutation<{ id: string }, Error, string>({
    mutationFn: (id) =>
      fetchJson(`/api/ai/creative-maker/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['creatives'] }),
  })
}

export function useUseCreative() {
  const qc = useQueryClient()
  return useMutation<{ draftId: string }, Error, string>({
    mutationFn: (id) =>
      fetchJson(`/api/ai/creative-maker/${id}/use`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['creatives'] })
      qc.invalidateQueries({ queryKey: ['campaign-drafts'] })
    },
  })
}
