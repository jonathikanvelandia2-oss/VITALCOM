'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ConnectStoreInput, SyncMultipleInput, UpdateSyncInput } from '@/lib/api/schemas/shopify'

// ── Hooks de Shopify — React Query ──────────────────────

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

/** Lista de tiendas del usuario */
export function useMyStores() {
  return useQuery({
    queryKey: ['shopify', 'stores'],
    queryFn: () => fetcher('/api/shopify/stores'),
  })
}

/** Detalle de una tienda con productos y métricas */
export function useStoreDetail(storeId: string | null) {
  return useQuery({
    queryKey: ['shopify', 'store', storeId],
    queryFn: () => fetcher(`/api/shopify/stores/${storeId}`),
    enabled: !!storeId,
  })
}

/** Productos sincronizados de una tienda */
export function useStoreSyncs(storeId: string | null) {
  return useQuery({
    queryKey: ['shopify', 'syncs', storeId],
    queryFn: () => fetcher(`/api/shopify/stores/${storeId}/sync`),
    enabled: !!storeId,
  })
}

/** Pedidos de la tienda */
export function useStoreOrders(storeId: string | null, filters: { status?: string; page?: number } = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.page) params.set('page', String(filters.page))

  return useQuery({
    queryKey: ['shopify', 'orders', storeId, filters],
    queryFn: () => fetcher(`/api/shopify/stores/${storeId}/orders?${params}`),
    enabled: !!storeId,
  })
}

/** Métricas de la tienda */
export function useStoreMetrics(storeId: string | null, days = 30) {
  return useQuery({
    queryKey: ['shopify', 'metrics', storeId, days],
    queryFn: () => fetcher(`/api/shopify/stores/${storeId}/metrics?days=${days}`),
    enabled: !!storeId,
  })
}

/** Conectar nueva tienda */
export function useConnectStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ConnectStoreInput) => mutator('/api/shopify/stores', 'POST', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopify', 'stores'] }),
  })
}

/** Importar productos a la tienda */
export function useSyncProducts(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SyncMultipleInput) => mutator(`/api/shopify/stores/${storeId}/sync`, 'POST', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopify', 'syncs', storeId] })
      qc.invalidateQueries({ queryKey: ['shopify', 'store', storeId] })
    },
  })
}

/** Actualizar sync de producto */
export function useUpdateSync(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateSyncInput & { syncId: string }) =>
      mutator(`/api/shopify/stores/${storeId}/sync`, 'PATCH', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopify', 'syncs', storeId] })
    },
  })
}

/** Desconectar tienda */
export function useDisconnectStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (storeId: string) => mutator(`/api/shopify/stores/${storeId}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopify', 'stores'] }),
  })
}
