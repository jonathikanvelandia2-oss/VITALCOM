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

/** Lista de tareas del usuario */
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetcher('/api/tasks'),
  })
}

/** Crear tarea */
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description?: string; priority?: string; dueDate?: string }) =>
      mutator('/api/tasks', 'POST', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

/** Actualizar tarea */
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; title?: string; status?: string; priority?: string }) =>
      mutator('/api/tasks', 'PATCH', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

/** Eliminar tarea */
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutator('/api/tasks', 'DELETE', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
