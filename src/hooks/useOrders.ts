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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
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
    },
  })
}
