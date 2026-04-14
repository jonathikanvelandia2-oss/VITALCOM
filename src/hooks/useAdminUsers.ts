'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateUserInput, UpdateUserInput, UserFilters } from '@/lib/api/schemas/user'

// ── Hooks de gestión de usuarios (admin) — React Query ──

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

/** Lista paginada de usuarios con filtros */
export function useAdminUsers(filters: Partial<UserFilters> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: ['adminUsers', filters],
    queryFn: () => fetcher(`/api/admin/users?${params}`),
  })
}

/** Detalle de usuario con historial */
export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: ['adminUser', id],
    queryFn: () => fetcher(`/api/admin/users/${id}`),
    enabled: !!id,
  })
}

/** Crear usuario (staff) */
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserInput) => mutator('/api/admin/users', 'POST', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  })
}

/** Actualizar usuario */
export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      mutator(`/api/admin/users/${id}`, 'PATCH', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminUsers'] })
      qc.invalidateQueries({ queryKey: ['adminUser'] })
    },
  })
}

/** Desactivar usuario (soft delete) */
export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutator(`/api/admin/users/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  })
}
