'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProductFilters, CreateProductInput, UpdateProductInput } from '@/lib/api/schemas/product'

// ── Hooks de productos — React Query ────────────────────

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar datos')
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

/** Listado paginado de productos con filtros */
export function useProducts(filters: Partial<ProductFilters> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetcher(`/api/products?${params}`),
  })
}

/** Detalle de un producto por ID */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetcher(`/api/products/${id}`),
    enabled: !!id,
  })
}

/** Crear producto */
export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProductInput) => mutator('/api/products', 'POST', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

/** Actualizar producto */
export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      mutator(`/api/products/${id}`, 'PUT', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product'] })
    },
  })
}

/** Desactivar producto (soft delete) */
export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutator(`/api/products/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
