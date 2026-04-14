'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { StockFilters, UpdateStockInput } from '@/lib/api/schemas/product'

// ── Hooks de stock — React Query ────────────────────────

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar stock')
  return json.data
}

/** Listado de stock con filtros */
export function useStock(filters: Partial<StockFilters> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: ['stock', filters],
    queryFn: () => fetcher(`/api/stock?${params}`),
  })
}

/** Actualizar stock (upsert) */
export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateStockInput) => {
      const res = await fetch('/api/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Error al actualizar stock')
      return json.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock'] }),
  })
}
