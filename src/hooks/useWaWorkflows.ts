'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ── V27 — Hooks para WhatsApp Workflows (no confundir con useWorkflows.ts de Luzitbot) ──

export type WaTriggerType =
  | 'ORDER_CREATED' | 'MESSAGE_RECEIVED' | 'NO_RESPONSE'
  | 'SCHEDULE' | 'WEBHOOK' | 'MANUAL'

export type WaStep = {
  id: string
  type: string
  config: Record<string, unknown>
  nextOnSuccess?: string
  nextOnFail?: string
  nextOnBranch?: Record<string, string>
}

export type WaWorkflowSummary = {
  id: string
  name: string
  purpose: string
  triggerType: WaTriggerType
  isActive: boolean
  useAiAdaptation: boolean
  account: { id: string; name: string; displayPhone: string } | null
  timesExecuted: number
  successCount: number
  failCount: number
  confidenceScore: number
  stepsCount: number
  updatedAt: string
  totalExecutions: number
}

export type WaWorkflowDetail = Omit<WaWorkflowSummary, 'stepsCount'> & {
  triggerConfig: Record<string, unknown>
  steps: WaStep[]
  usePersonalization: boolean
  avgDurationMin: number | null
  createdAt: string
  executions: Array<{
    id: string
    status: string
    currentStepId: string | null
    outcomeType: string | null
    startedAt: string
    completedAt: string | null
  }>
}

export type WhatsappAccountSummary = {
  id: string
  name: string
  displayPhone: string
  phoneNumberId: string
  wabaId: string
  quality: string | null
  messagingLimit: string | null
  isActive: boolean
  businessName: string | null
  logoUrl: string | null
  templatesCount: number
  conversationsCount: number
  workflowsCount: number
  contactsCount: number
  webhookVerifyToken: string
  createdAt: string
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data as T
}

// ── Workflows ──
export function useWaWorkflows(accountId?: string) {
  const qs = accountId ? `?accountId=${accountId}` : ''
  return useQuery<{ items: WaWorkflowSummary[] }>({
    queryKey: ['wa-workflows', accountId ?? null],
    queryFn: () => fetchJson(`/api/workflows${qs}`),
    refetchInterval: 30_000,
  })
}

export function useWaWorkflow(id: string | null) {
  return useQuery<WaWorkflowDetail>({
    queryKey: ['wa-workflow', id],
    queryFn: () => fetchJson(`/api/workflows/${id}`),
    enabled: Boolean(id),
  })
}

export function useUpdateWaWorkflow() {
  const qc = useQueryClient()
  return useMutation<{ id: string }, Error, { id: string; data: Partial<WaWorkflowDetail> }>({
    mutationFn: ({ id, data }) => fetchJson(`/api/workflows/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['wa-workflow', id] })
      qc.invalidateQueries({ queryKey: ['wa-workflows'] })
    },
  })
}

export function useDeleteWaWorkflow() {
  const qc = useQueryClient()
  return useMutation<{ deleted: boolean }, Error, string>({
    mutationFn: (id) => fetchJson(`/api/workflows/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-workflows'] }),
  })
}

export function useTestWaWorkflow() {
  return useMutation<
    { executionId: string },
    Error,
    { id: string; phoneE164?: string; contactId?: string; initialContext?: Record<string, unknown> }
  >({
    mutationFn: ({ id, ...body }) => fetchJson(`/api/workflows/${id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  })
}

export function useInstallPrebuilt() {
  const qc = useQueryClient()
  return useMutation<
    { installed: Array<{ key: string; id: string; name: string }>; total: number },
    Error,
    { accountId: string }
  >({
    mutationFn: (body) => fetchJson('/api/workflows/install-prebuilt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-workflows'] }),
  })
}

// ── Accounts ──
export function useWhatsappAccounts() {
  return useQuery<{ items: WhatsappAccountSummary[] }>({
    queryKey: ['wa-accounts'],
    queryFn: () => fetchJson('/api/whatsapp/accounts'),
  })
}

export function useCreateWhatsappAccount() {
  const qc = useQueryClient()
  return useMutation<
    { id: string; webhookVerifyToken: string },
    Error,
    { name: string; phoneNumberId: string; wabaId: string; displayPhone: string; accessToken: string; businessName?: string; logoUrl?: string }
  >({
    mutationFn: (body) => fetchJson('/api/whatsapp/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-accounts'] }),
  })
}
