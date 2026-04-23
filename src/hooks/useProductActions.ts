'use client'

// V36 — Hooks React Query para las acciones del detalle de producto.
// Envuelve los 4 endpoints de /api/products/[id]/* con estados de loading,
// error y cache. Diseñado para que el UI se sienta instantáneo.

import { useMutation, useQuery } from '@tanstack/react-query'

async function postJson<T>(url: string, body: unknown = {}): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error en la acción')
  return json.data as T
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar')
  return json.data as T
}

// ── Sugerir ángulos (determinista, rápido) ─────────────
export type SuggestAnglesResult = {
  productId: string
  angles: Array<{
    key: string
    title: string
    hook: string
    whenToUse: string
  }>
}

export function useSuggestAngles(productId: string) {
  return useMutation<SuggestAnglesResult, Error, void>({
    mutationFn: () => postJson(`/api/products/${productId}/suggest-angles`),
  })
}

// ── Generar copy IA ────────────────────────────────────
export type GenerateCopyInput = {
  angle: string
  platform?: 'instagram' | 'tiktok' | 'shopify' | 'whatsapp'
}

export type CopyVariant = {
  headline: string
  body: string
  cta: string
  hashtags: string[]
}

export type GenerateCopyResult = {
  productId: string
  angle: string
  platform: string
  variants: CopyVariant[]
  generatedWithLlm: boolean
}

export function useGenerateCopy(productId: string) {
  return useMutation<GenerateCopyResult, Error, GenerateCopyInput>({
    mutationFn: (input) => postJson(`/api/products/${productId}/generate-copy`, input),
  })
}

// ── Solicitar acceso ───────────────────────────────────
export type RequestAccessInput = {
  reason: 'PRICING' | 'SAMPLE' | 'EXCLUSIVE' | 'INFO'
  message?: string
}

export type RequestAccessResult = {
  threadId: string
  subject: string
  estimatedResponseHours: number
  createdAt: string
}

export function useRequestAccess(productId: string) {
  return useMutation<RequestAccessResult, Error, RequestAccessInput>({
    mutationFn: (input) => postJson(`/api/products/${productId}/request-access`, input),
  })
}

// ── Download pack (manifest) ───────────────────────────
export type DownloadManifest = {
  sku: string
  slug: string
  productName: string
  generatedAt: string
  description: string
  category: string | null
  sections: Array<{
    name: string
    items: Array<{ url: string; filename: string; type: string }>
  }>
  totals: { images: number; videos: number; docs: number }
}

export function useDownloadPack(productId: string | null) {
  return useQuery<DownloadManifest>({
    queryKey: ['product-download-pack', productId],
    queryFn: () => getJson(`/api/products/${productId}/download-pack`),
    enabled: Boolean(productId),
    staleTime: 5 * 60 * 1000, // 5 min
  })
}
