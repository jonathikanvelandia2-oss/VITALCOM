'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ── Hooks de comunidad: ranking y perfil — React Query ──

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

/** Ranking de comunidad */
export function useRanking(filters: { limit?: number; country?: string } = {}) {
  const params = new URLSearchParams()
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.country) params.set('country', filters.country)

  return useQuery({
    queryKey: ['ranking', filters],
    queryFn: () => fetcher(`/api/community/ranking?${params}`),
  })
}

/** Perfil del usuario actual */
export function useMyProfile() {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: () => fetcher('/api/users/me'),
  })
}

/** Actualizar perfil */
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string; bio?: string; avatar?: string; phone?: string; whatsapp?: string }) =>
      mutator('/api/users/me', 'PATCH', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myProfile'] }),
  })
}
