'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateOrderInput, UpdateOrderStatusInput, OrderFilters } from '@/lib/api/schemas/order'

// ── Hooks de pedidos — React Query ──────────────────────

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar pedidos')
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

/** Listado paginado de pedidos con filtros */
export function useOrders(filters: Partial<OrderFilters> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetcher(`/api/orders?${params}`),
  })
}

/** Detalle de un pedido */
export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetcher(`/api/orders/${id}`),
    enabled: !!id,
  })
}

/** Crear pedido */
export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrderInput) => mutator('/api/orders', 'POST', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['orders-stats'] })
    },
  })
}

/** Cambiar estado de pedido */
export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusInput }) =>
      mutator(`/api/orders/${id}`, 'PATCH', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order'] })
      qc.invalidateQueries({ queryKey: ['orders-stats'] })
      qc.invalidateQueries({ queryKey: ['pnl'] })
    },
  })
}

/** Despachar pedido via Dropi — solo staff */
export function useFulfillOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutator(`/api/orders/${id}/fulfill`, 'POST'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order'] })
      qc.invalidateQueries({ queryKey: ['orders-stats'] })
    },
  })
}

/** Cancelar pedido (dueño o staff) — shortcut de useUpdateOrderStatus */
export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      mutator(`/api/orders/${id}`, 'PATCH', { status: 'CANCELLED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order'] })
      qc.invalidateQueries({ queryKey: ['orders-stats'] })
      qc.invalidateQueries({ queryKey: ['pnl'] })
    },
  })
}

/** KPIs de pedidos del usuario (o globales si es staff) */
export function useOrdersStats() {
  return useQuery({
    queryKey: ['orders-stats'],
    queryFn: () => fetcher('/api/orders/stats'),
    staleTime: 30 * 1000,
  })
}
