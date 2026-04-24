'use client'

// V38 — Hooks de canales Vitalcom.
// Community: lee canales agrupados + registra clicks.
// Admin: CRUD + analytics.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data as T
}

// ── Community: grupos de canales ──────────────────────
export type ChannelPublic = {
  id: string
  type: 'STAFF_DM' | 'COMMUNITY_GROUP' | 'BROADCAST_LIST' | 'ANNOUNCEMENTS'
  area: string | null
  label: string
  description: string | null
  icon: string | null
  country: string | null
  order: number
  resolvedUrl: string | null
}

export type ChannelGroupPublic = {
  key: 'groups' | 'staff' | 'announcements'
  label: string
  description: string
  channels: ChannelPublic[]
}

export function useChannels(params: { country?: string; type?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.country) qs.set('country', params.country)
  if (params.type) qs.set('type', params.type)

  return useQuery<{ country: string | null; groups: ChannelGroupPublic[]; total: number }>({
    queryKey: ['channels', params],
    queryFn: () => fetchJson(`/api/channels?${qs.toString()}`),
    staleTime: 60_000,
  })
}

export function useLogChannelClick(channelId: string) {
  return useMutation({
    mutationFn: () =>
      fetchJson(`/api/channels/${channelId}/click`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
  })
}

// ── Admin ─────────────────────────────────────────────
export type ChannelAdmin = {
  id: string
  type: 'STAFF_DM' | 'COMMUNITY_GROUP' | 'BROADCAST_LIST' | 'ANNOUNCEMENTS'
  area: string | null
  label: string
  description: string | null
  phone: string | null
  inviteUrl: string | null
  defaultMessage: string | null
  icon: string | null
  country: string | null
  active: boolean
  order: number
  analytics: {
    total: number
    last7Days: number
    last30Days: number
    lastClickAt: string | null
  }
  createdAt: string
  updatedAt: string
}

export function useAdminChannels() {
  return useQuery<{ items: ChannelAdmin[] }>({
    queryKey: ['admin-channels'],
    queryFn: () => fetchJson('/api/admin/channels'),
    staleTime: 30_000,
  })
}

export type ChannelInput = {
  type: ChannelAdmin['type']
  area?: string | null
  label: string
  description?: string | null
  phone?: string | null
  inviteUrl?: string | null
  defaultMessage?: string | null
  icon?: string | null
  country?: string | null
  active?: boolean
  order?: number
}

export function useCreateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ChannelInput) =>
      fetchJson('/api/admin/channels', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-channels'] })
      qc.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUpdateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChannelInput> }) =>
      fetchJson(`/api/admin/channels/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-channels'] })
      qc.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/channels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-channels'] })
      qc.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}
