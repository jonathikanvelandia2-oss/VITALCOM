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

/** Lista de recursos */
export function useResources(category?: string) {
  const params = category ? `?category=${category}` : ''
  return useQuery({
    queryKey: ['resources', category],
    queryFn: () => fetcher(`/api/resources${params}`),
  })
}

/** Registrar descarga de recurso */
export function useTrackDownload() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutator('/api/resources', 'PATCH', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })
}
