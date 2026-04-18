'use client'

import { useQuery } from '@tanstack/react-query'

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar insights')
  return json.data
}

export type Period = '7d' | '30d' | '90d' | 'month' | 'year'

/** Productos ganadores de la comunidad. */
export function useWinningProducts(period: Period = '30d', limit = 10) {
  return useQuery({
    queryKey: ['winning-products', period, limit],
    queryFn: () => fetcher(`/api/insights/winning-products?period=${period}&limit=${limit}`),
    staleTime: 5 * 60 * 1000,
  })
}
