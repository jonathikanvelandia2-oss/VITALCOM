'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ── V29 — Hooks para WhatsApp Templates + Broadcasts + A/B ──

export type WaTemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
export type WaTemplateStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISABLED'

export type WaTemplate = {
  id: string
  accountId: string
  metaName: string
  category: WaTemplateCategory
  language: string
  headerType: string | null
  headerContent: string | null
  bodyText: string
  footerText: string | null
  buttons: unknown
  variables: unknown
  status: WaTemplateStatus
  metaTemplateId: string | null
  rejectionReason: string | null
  timesSent: number
  timesOpened: number
  timesClicked: number
  timesBlocked: number
  fallbackTemplateId: string | null
  purpose: string
  variantGroup: string | null
  weight: number
  createdAt: string
  updatedAt: string
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data as T
}

// ── Templates ──
export function useWaTemplates(accountId: string | null) {
  return useQuery<{ items: WaTemplate[] }>({
    queryKey: ['wa-templates', accountId],
    queryFn: () => fetchJson(`/api/whatsapp/templates?accountId=${accountId}`),
    enabled: Boolean(accountId),
    refetchInterval: 60_000,
  })
}

export function useCreateWaTemplate() {
  const qc = useQueryClient()
  return useMutation<
    { id: string },
    Error,
    {
      accountId: string
      metaName: string
      category: WaTemplateCategory
      language?: string
      purpose: string
      bodyText: string
      headerType?: string
      footerText?: string
      variantGroup?: string
      weight?: number
      fallbackTemplateId?: string
    }
  >({
    mutationFn: (body) => fetchJson('/api/whatsapp/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-templates'] }),
  })
}

export function useUpdateWaTemplate() {
  const qc = useQueryClient()
  return useMutation<{ id: string }, Error, { id: string; data: Partial<WaTemplate> }>({
    mutationFn: ({ id, data }) => fetchJson(`/api/whatsapp/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-templates'] }),
  })
}

export function useDeleteWaTemplate() {
  const qc = useQueryClient()
  return useMutation<{ deleted: boolean }, Error, string>({
    mutationFn: (id) => fetchJson(`/api/whatsapp/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-templates'] }),
  })
}

// ── A/B stats ──
export type AbStatsRow = {
  templateId: string
  metaName: string
  weight: number
  sent: number
  opened: number
  clicked: number
  blocked: number
  broadcastSent: number
  broadcastDelivered: number
  broadcastRead: number
  broadcastFailed: number
}

export function useAbStats(accountId: string | null, variantGroup: string | null) {
  return useQuery<{ variantGroup: string; stats: AbStatsRow[] }>({
    queryKey: ['wa-ab-stats', accountId, variantGroup],
    queryFn: () => fetchJson(`/api/whatsapp/templates/ab-stats?accountId=${accountId}&variantGroup=${variantGroup}`),
    enabled: Boolean(accountId && variantGroup),
  })
}

// ── Broadcasts ──
export type BroadcastStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type BroadcastSummary = {
  id: string
  name: string
  templateName: string
  status: BroadcastStatus
  totalRecipients: number
  sentCount: number
  failedCount: number
  variantGroup: string | null
  scheduledFor: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  account: { id: string; name: string; displayPhone: string }
}

export function useBroadcasts(accountId?: string) {
  const qs = accountId ? `?accountId=${accountId}` : ''
  return useQuery<{ items: BroadcastSummary[] }>({
    queryKey: ['wa-broadcasts', accountId ?? null],
    queryFn: () => fetchJson(`/api/whatsapp/broadcasts${qs}`),
    refetchInterval: 10_000,
  })
}

export function useBroadcast(id: string | null) {
  return useQuery<{
    broadcast: BroadcastSummary
    statusCounts: Record<string, number>
    variants: Array<{ key: string; counts: Record<string, number> }>
  }>({
    queryKey: ['wa-broadcast', id],
    queryFn: () => fetchJson(`/api/whatsapp/broadcasts/${id}`),
    enabled: Boolean(id),
    refetchInterval: 5_000,
  })
}

export function useCreateBroadcast() {
  const qc = useQueryClient()
  return useMutation<
    { id: string },
    Error,
    {
      accountId: string
      name: string
      templateName: string
      languageCode?: string
      bodyVariables?: string[]
      segmentFilter: Record<string, unknown>
      variantGroup?: string
      scheduledFor?: string
    }
  >({
    mutationFn: (body) => fetchJson('/api/whatsapp/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-broadcasts'] }),
  })
}

export function useExecuteBroadcast() {
  const qc = useQueryClient()
  return useMutation<{ started: boolean; broadcastId: string }, Error, string>({
    mutationFn: (id) => fetchJson(`/api/whatsapp/broadcasts/${id}/execute`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-broadcasts'] }),
  })
}

export function usePreviewBroadcast() {
  return useMutation<
    { total: number; sample: Array<{ firstName: string | null; phoneMasked: string }> },
    Error,
    { accountId: string; segmentFilter: Record<string, unknown> }
  >({
    mutationFn: (body) => fetchJson('/api/whatsapp/broadcasts/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  })
}
