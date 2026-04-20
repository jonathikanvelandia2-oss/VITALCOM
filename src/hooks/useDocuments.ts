'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type AdminDocument = {
  id: string
  name: string
  folder: string
  type: string
  url: string
  size: number
  uploader: { id: string; name: string | null; avatar: string | null } | null
  createdAt: string
}

export type FolderStat = { name: string; count: number }

type ListResponse = { items: AdminDocument[]; folders: FolderStat[] }

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useDocuments(folder?: string) {
  const query = folder ? `?folder=${encodeURIComponent(folder)}` : ''
  return useQuery<ListResponse>({
    queryKey: ['documents', folder ?? null],
    queryFn: () => fetchJson(`/api/admin/documents${query}`),
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation<
    AdminDocument,
    Error,
    { name: string; folder: string; type: string; url: string; size: number }
  >({
    mutationFn: (data) =>
      fetchJson('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) =>
      fetchJson(`/api/admin/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}
