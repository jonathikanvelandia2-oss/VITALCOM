'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ── Hooks de chat 1:1 comunidad ─────────────────────────
// Polling corto (8s para mensajes activos, 15s para lista).

export type ChatParticipant = {
  id: string
  name: string
  avatar: string | null
  role: string
  level: number
}

export type Conversation = {
  id: string
  other: ChatParticipant
  lastPreview: string | null
  lastMessageAt: string
  unread: number
}

export type DirectMessage = {
  id: string
  body: string
  senderId: string
  readAt: string | null
  createdAt: string
}

export type Member = {
  id: string
  name: string
  avatar: string | null
  role: string
  level: number
  points: number
  country: string | null
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

/** Lista de conversaciones del usuario con polling de 15s. */
export function useConversations() {
  return useQuery<{ items: Conversation[]; totalUnread: number }>({
    queryKey: ['conversations'],
    queryFn: () => fetchJson('/api/community/conversations'),
    refetchInterval: 15000,
  })
}

/** Mensajes de una conversación con polling de 8s. */
export function useConversationMessages(conversationId: string | null) {
  return useQuery<{
    conversation: { id: string; other: ChatParticipant }
    messages: DirectMessage[]
    nextCursor: string | null
  }>({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => fetchJson(`/api/community/conversations/${conversationId}/messages?limit=50`),
    enabled: !!conversationId,
    refetchInterval: 8000,
  })
}

/** Inicia o encuentra una conversación con otro usuario. */
export function useStartConversation() {
  const qc = useQueryClient()
  return useMutation<Conversation, Error, string>({
    mutationFn: (otherUserId) =>
      fetchJson('/api/community/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

/** Envía un mensaje a una conversación. */
export function useSendDirectMessage(conversationId: string | null) {
  const qc = useQueryClient()
  return useMutation<DirectMessage, Error, string>({
    mutationFn: (body) =>
      fetchJson(`/api/community/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation-messages', conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/** Marca la conversación como leída (usado al abrirla manualmente). */
export function useMarkConversationRead() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (conversationId) =>
      fetchJson(`/api/community/conversations/${conversationId}/read`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/** Directorio de miembros para iniciar una conversación. */
export function useCommunityMembers(search: string) {
  return useQuery<{ items: Member[] }>({
    queryKey: ['community-members', search],
    queryFn: () =>
      fetchJson(`/api/community/members?limit=30${search ? `&q=${encodeURIComponent(search)}` : ''}`),
    staleTime: 20000,
  })
}
