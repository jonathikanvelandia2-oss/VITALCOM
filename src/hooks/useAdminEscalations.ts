'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatAgent } from './useVitaChat'

export type EscalationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type EscalationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type EscalationArea = 'DIRECCION' | 'MARKETING' | 'COMERCIAL' | 'ADMINISTRATIVA' | 'LOGISTICA' | 'CONTABILIDAD'

export type EscalationTicket = {
  id: string
  fromAgent: ChatAgent
  toArea: EscalationArea
  priority: EscalationPriority
  status: EscalationStatus
  reason: string
  summary: string | null
  draftResponse: string | null
  resolution: string | null
  replyToUser: string | null
  createdAt: string
  resolvedAt: string | null
  user: { id: string; name: string | null; email: string; country: string | null }
  thread: { id: string; title: string | null; agentName: ChatAgent }
  assignee: { id: string; name: string | null } | null
}

export type EscalationThreadMessage = {
  id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  createdAt: string
  confidence: number | null
  source: string | null
  model: string | null
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useAdminEscalations(filter?: { status?: EscalationStatus; area?: EscalationArea }) {
  const params = new URLSearchParams()
  if (filter?.status) params.set('status', filter.status)
  if (filter?.area) params.set('area', filter.area)
  const qs = params.toString()

  return useQuery<{
    summary: { open: number; inProgress: number; resolved: number }
    items: EscalationTicket[]
  }>({
    queryKey: ['admin-escalations', filter?.status, filter?.area],
    queryFn: () => fetchJson(`/api/admin/escalations${qs ? '?' + qs : ''}`),
    refetchInterval: 30_000,
  })
}

export function useAdminEscalation(id: string | null) {
  return useQuery<EscalationTicket & {
    thread: EscalationTicket['thread'] & { messages: EscalationThreadMessage[] }
  }>({
    queryKey: ['admin-escalation', id],
    queryFn: () => fetchJson(`/api/admin/escalations/${id}`),
    enabled: Boolean(id),
  })
}

export function useResolveEscalation() {
  const qc = useQueryClient()
  return useMutation<
    { resolved: boolean; ticketId: string },
    Error,
    { id: string; resolution: string; replyToUser?: string }
  >({
    mutationFn: ({ id, resolution, replyToUser }) =>
      fetchJson(`/api/admin/escalations/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, replyToUser }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-escalations'] })
      qc.invalidateQueries({ queryKey: ['admin-escalation', data.ticketId] })
    },
  })
}
