'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// V33 — hooks del Product Studio

export type AssetStatus = 'DRAFT' | 'APPROVED' | 'FEATURED' | 'ARCHIVED' | 'REJECTED'
export type AssetType =
  | 'HERO' | 'GALLERY' | 'LIFESTYLE' | 'PRODUCT_ONLY' | 'PACK_SHOT' | 'MOCKUP'
  | 'REVIEW_PHOTO' | 'BEFORE_AFTER' | 'UGC_CLIP' | 'REEL_MASTER' | 'VIDEO_CUT'
  | 'LANDING_HERO' | 'EBOOK' | 'BRAND_MANUAL' | 'CERTIFICATE' | 'INGREDIENT_INFO'

export type SalesAngle =
  | 'PAIN' | 'ASPIRATION' | 'SOCIAL_PROOF' | 'EXPERT' | 'TESTIMONIAL'
  | 'TRANSFORMATION' | 'FEAR' | 'CURIOSITY' | 'EDUCATIONAL' | 'SCARCITY' | 'PRICE_ANCHOR'

export interface ProductAsset {
  id: string
  productId: string
  type: AssetType
  angle: SalesAngle | null
  format: string
  cloudinaryUrl: string | null
  cloudinaryId: string | null
  width: number | null
  height: number | null
  durationSec: number | null
  originalMime: string
  title: string | null
  caption: string | null
  altText: string | null
  heroRank: number | null
  status: AssetStatus
  quality: 'A_PREMIUM' | 'B_STANDARD' | 'C_ACCEPTABLE' | 'UNRATED'
  driveFolderPath: string
  driveFolderType: string
  driveLastSyncAt: string | null
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
  product?: {
    id: string
    name: string
    slug: string
    sku: string
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data as T
}

// ── Community: assets de un producto ──────────────────
export function useProductAssets(productId: string | null) {
  return useQuery<{ items: ProductAsset[] }>({
    queryKey: ['product-assets', productId],
    queryFn: () => fetchJson(`/api/catalog/products/${productId}/assets`),
    enabled: Boolean(productId),
    refetchInterval: 60_000,
  })
}

// ── Admin: listado de assets con filtros ──────────────
export function useAdminAssets(status?: AssetStatus | null, productId?: string | null) {
  const qs = new URLSearchParams()
  if (status) qs.set('status', status)
  if (productId) qs.set('productId', productId)
  return useQuery<{
    items: ProductAsset[]
    counts: Record<AssetStatus, number>
  }>({
    queryKey: ['admin-assets', status, productId],
    queryFn: () => fetchJson(`/api/admin/assets?${qs.toString()}`),
    refetchInterval: 30_000,
  })
}

export function useUpdateAsset() {
  const qc = useQueryClient()
  return useMutation<
    { updated: boolean },
    Error,
    {
      id: string
      data: {
        status?: AssetStatus
        type?: AssetType
        angle?: SalesAngle | null
        altText?: string
        caption?: string
        heroRank?: number | null
        rejectionReason?: string
      }
    }
  >({
    mutationFn: ({ id, data }) =>
      fetchJson(`/api/admin/assets/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assets'] })
      qc.invalidateQueries({ queryKey: ['product-assets'] })
    },
  })
}

export function useArchiveAsset() {
  const qc = useQueryClient()
  return useMutation<{ archived: boolean }, Error, string>({
    mutationFn: (id: string) => fetchJson(`/api/admin/assets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assets'] })
      qc.invalidateQueries({ queryKey: ['product-assets'] })
    },
  })
}

// ── Drive sync status/trigger ─────────────────────────
export function useDriveSyncStatus() {
  return useQuery<{
    mockMode: boolean
    latest: {
      id: string
      status: string
      startedAt: string
      finishedAt: string | null
      filesScanned: number
      filesNew: number
      filesUpdated: number
      filesFailed: number
      errorLog?: unknown
    } | null
  }>({
    queryKey: ['drive-sync-status'],
    queryFn: () => fetchJson('/api/drive/sync/status'),
    refetchInterval: 10_000,
  })
}

export function useTriggerDriveSync() {
  const qc = useQueryClient()
  return useMutation<
    {
      syncRunId: string
      scanned: number
      created: number
      updated: number
      unchanged: number
      failed: number
      mockMode: boolean
    },
    Error,
    void
  >({
    mutationFn: () =>
      fetchJson('/api/drive/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive-sync-status'] })
      qc.invalidateQueries({ queryKey: ['admin-assets'] })
    },
  })
}

// ── Image Lab ─────────────────────────────────────────
export type ImageLabOp =
  | 'UPSCALE' | 'REMOVE_BG' | 'REPLACE_BG' | 'OVERLAY_TEXT' | 'OVERLAY_BADGE'
  | 'COLOR_ADJUST' | 'GENERATE_VARIANT' | 'AUTO_CROP' | 'WATERMARK'

export function useRunImageLab() {
  const qc = useQueryClient()
  return useMutation<
    {
      resultUrl: string
      resultAssetId?: string
      editId: string
      costUsd: number
      durationMs: number
      mockMode: boolean
    },
    Error,
    {
      sourceAssetId: string
      operation: ImageLabOp
      params?: Record<string, unknown>
      persistAsNewAsset?: boolean
    }
  >({
    mutationFn: data =>
      fetchJson('/api/studio/image-lab', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assets'] })
    },
  })
}

// ── UGC Scriptwriter ──────────────────────────────────
export function useGenerateUgc() {
  return useMutation<
    {
      packageId: string
      output: Record<string, unknown>
      costUsd: number
      llmModel: string
    },
    Error,
    {
      productId: string
      angle: SalesAngle
      persona: string
      platform: 'instagram_reel' | 'tiktok' | 'youtube_shorts'
      durationSec: 15 | 30 | 60
      country?: 'CO' | 'EC' | 'GT' | 'CL'
    }
  >({
    mutationFn: data =>
      fetchJson('/api/studio/ugc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      }),
  })
}

// Meta para UI
export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  HERO: 'Hero',
  GALLERY: 'Galería',
  LIFESTYLE: 'Lifestyle',
  PRODUCT_ONLY: 'Producto solo',
  PACK_SHOT: 'Pack shot',
  MOCKUP: 'Mockup',
  REVIEW_PHOTO: 'Reseña',
  BEFORE_AFTER: 'Antes/Después',
  UGC_CLIP: 'UGC',
  REEL_MASTER: 'Reel',
  VIDEO_CUT: 'Video cut',
  LANDING_HERO: 'Landing hero',
  EBOOK: 'E-book',
  BRAND_MANUAL: 'Manual marca',
  CERTIFICATE: 'Certificado',
  INGREDIENT_INFO: 'Ingredientes',
}

export const ASSET_STATUS_META: Record<
  AssetStatus,
  { label: string; color: string }
> = {
  DRAFT:    { label: 'Pendiente', color: '#FFB800' },
  APPROVED: { label: 'Aprobado',  color: '#3CC6FF' },
  FEATURED: { label: 'Destacado', color: '#C6FF3C' },
  ARCHIVED: { label: 'Archivado', color: '#8B9BA8' },
  REJECTED: { label: 'Rechazado', color: '#FF4757' },
}
