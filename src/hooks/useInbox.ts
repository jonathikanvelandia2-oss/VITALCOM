'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateThreadInput, CreateMessageInput, ThreadFilters } from '@/lib/api/schemas/inbox'

// ── Hooks de inbox interno — React Query ────────────────

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar')
  return json.data
}

async function mutator(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error en operación')
  return json.data
}

/** Lista de hilos con filtros */
export function useThreads(filters: Partial<ThreadFilters> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: ['threads', filters],
    queryFn: () => fetcher(`/api/inbox/threads?${params}`),
  })
}

/** Mensajes de un hilo */
export function useThreadMessages(threadId: string | null) {
  return useQuery({
    queryKey: ['threadMessages', threadId],
    queryFn: () => fetcher(`/api/inbox/threads/${threadId}/messages`),
    enabled: !!threadId,
    refetchInterval: 10000, // Polling cada 10s para simular tiempo real
  })
}

/** Crear hilo */
export function useCreateThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateThreadInput) => mutator('/api/inbox/threads', 'POST', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['threads'] }),
  })
}

/** Enviar mensaje en un hilo */
export function useSendMessage(threadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMessageInput) =>
      mutator(`/api/inbox/threads/${threadId}/messages`, 'POST', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threadMessages', threadId] })
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}
