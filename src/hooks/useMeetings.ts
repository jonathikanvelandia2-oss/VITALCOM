'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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

/** Lista de reuniones del usuario */
export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: () => fetcher('/api/meetings'),
  })
}

/** Crear reunión */
export function useCreateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; date: string; duration?: number; link?: string; type?: string }) =>
      mutator('/api/meetings', 'POST', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })
}

/** Actualizar reunión */
export function useUpdateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; status?: string; title?: string; link?: string }) =>
      mutator('/api/meetings', 'PATCH', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })
}

/** Eliminar reunión */
export function useDeleteMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutator('/api/meetings', 'DELETE', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })
}
