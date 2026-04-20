'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ── Hooks de notificaciones in-app ────────────────────

export type Notification = {
  id: string
  type: 'ORDER_STATUS' | 'ORDER_NEW' | 'INBOX_MESSAGE' | 'INBOX_ASSIGNED' |
        'COMMUNITY_LIKE' | 'COMMUNITY_REPLY' | 'STORE_CONNECTED' | 'SYSTEM'
  title: string
  body: string | null
  link: string | null
  meta: Record<string, unknown> | null
  read: boolean
  createdAt: string
}

type ListResponse = {
  items: Notification[]
  nextCursor: string | null
  unreadCount: number
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

/** Lista de notificaciones con polling de 30s. */
export function useNotifications() {
  return useQuery<ListResponse>({
    queryKey: ['notifications'],
    queryFn: () => fetchJson('/api/notifications?limit=15'),
    refetchInterval: 30000,
  })
}

/** Marcar como leída. */
export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

/** Marcar todas como leídas. */
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fetchJson('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
