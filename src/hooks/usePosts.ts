'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreatePostInput, PostFilters, CreateCommentInput } from '@/lib/api/schemas/post'

// ── Hooks de posts y comentarios — React Query ─────────

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

/** Feed paginado de posts */
export function usePosts(filters: Partial<PostFilters> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => fetcher(`/api/posts?${params}`),
  })
}

/** Detalle de un post con comentarios */
export function usePost(id: string | null) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => fetcher(`/api/posts/${id}`),
    enabled: !!id,
  })
}

/** Crear post */
export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePostInput) => mutator('/api/posts', 'POST', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

/** Toggle like en un post */
export function useToggleLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => mutator(`/api/posts/${postId}/like`, 'POST'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post'] })
    },
  })
}

/** Comentarios de un post */
export function useComments(postId: string | null) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetcher(`/api/posts/${postId}/comments`),
    enabled: !!postId,
  })
}

/** Crear comentario */
export function useCreateComment(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCommentInput) => mutator(`/api/posts/${postId}/comments`, 'POST', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
      qc.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })
}

/** Eliminar post */
export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutator(`/api/posts/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}
