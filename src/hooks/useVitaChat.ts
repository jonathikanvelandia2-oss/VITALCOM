'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ── Hooks para el chat universal IA (V26) ────────────────
// Orchestrator: clasifica + rutea a uno de los 9 agentes + persona + P&G

export type ChatAgent =
  | 'VITA'
  | 'MENTOR_FINANCIERO'
  | 'BLUEPRINT_ANALYST'
  | 'CEO_ADVISOR'
  | 'MEDIA_BUYER'
  | 'CREATIVO_MAKER'
  | 'OPTIMIZADOR_TIENDA'
  | 'SOPORTE_IA'
  | 'ESCALATE_HUMAN'

export type ChatMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export type ThreadSummary = {
  id: string
  title: string
  agent: ChatAgent
  channel: string
  escalated: boolean
  lastMessageAt: string
  messageCount: number
  preview: string
}

export type ThreadMessage = {
  id: string
  role: ChatMessageRole
  content: string
  confidence: number | null
  source: string | null
  createdAt: string
}

export type ThreadDetail = {
  id: string
  agent: ChatAgent
  title: string | null
  escalated: boolean
  messages: ThreadMessage[]
}

export type ChatSendResponse = {
  response: string
  agent: ChatAgent
  threadId: string
  messageId: string
  confidence: number
  escalated: boolean
  escalationTicketId?: string
  costUsd: number
  latencyMs: number
  source: 'cache' | 'llm' | 'rules' | 'escalation'
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useChatThreads() {
  return useQuery<{ items: ThreadSummary[] }>({
    queryKey: ['vita-chat', 'threads'],
    queryFn: () => fetchJson('/api/ai/chat/threads'),
    staleTime: 30_000,
  })
}

export function useChatThread(threadId: string | null) {
  return useQuery<ThreadDetail>({
    queryKey: ['vita-chat', 'thread', threadId],
    queryFn: () => fetchJson(`/api/ai/chat/threads/${threadId}`),
    enabled: Boolean(threadId),
    staleTime: 5_000,
  })
}

export function useSendChat() {
  const qc = useQueryClient()
  return useMutation<ChatSendResponse, Error, {
    message: string
    threadId?: string
    forceAgent?: ChatAgent
  }>({
    mutationFn: (payload) => fetchJson('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['vita-chat', 'threads'] })
      qc.invalidateQueries({ queryKey: ['vita-chat', 'thread', data.threadId] })
    },
  })
}

export const AGENT_LABELS: Record<ChatAgent, string> = {
  VITA: 'VITA',
  MENTOR_FINANCIERO: 'Mentor Financiero',
  BLUEPRINT_ANALYST: 'Blueprint Analyst',
  CEO_ADVISOR: 'CEO Advisor',
  MEDIA_BUYER: 'Media Buyer',
  CREATIVO_MAKER: 'Creativo Maker',
  OPTIMIZADOR_TIENDA: 'Optimizador Tienda',
  SOPORTE_IA: 'Soporte IA',
  ESCALATE_HUMAN: 'Equipo Humano',
}

export const AGENT_COLORS: Record<ChatAgent, string> = {
  VITA: '#C6FF3C',
  MENTOR_FINANCIERO: '#FFB800',
  BLUEPRINT_ANALYST: '#3CC6FF',
  CEO_ADVISOR: '#FF4757',
  MEDIA_BUYER: '#B388FF',
  CREATIVO_MAKER: '#FF6BCB',
  OPTIMIZADOR_TIENDA: '#C6FF3C',
  SOPORTE_IA: '#8B9BA8',
  ESCALATE_HUMAN: '#FF4757',
}
