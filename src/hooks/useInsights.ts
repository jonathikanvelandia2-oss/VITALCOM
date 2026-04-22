'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserHealthSegment } from '@prisma/client'

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

// ─── V34 — Weekly Insight personal ──────────────────────────

export interface WeeklyHighlight {
  label: string
  value: string
  trend: 'up' | 'down' | 'flat' | 'none'
}

export interface WeeklyRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  action: string
  href?: string
}

export interface WeeklyInsightData {
  id: string
  weekStart: string
  weekEnd: string
  headline: string
  revenue: number
  revenueDeltaPct: number
  orderCount: number
  netProfit: number
  roas: number
  healthScore: number
  healthDelta: number
  segment: UserHealthSegment | null
  topProductName: string | null
  highlights: WeeklyHighlight[]
  recommendations: WeeklyRecommendation[]
  generatedAt: string
}

/** Trae el insight semanal del usuario actual. Genera on-demand si no existe. */
export function useMyWeeklyInsight() {
  return useQuery<WeeklyInsightData>({
    queryKey: ['insights', 'me', 'weekly'],
    queryFn: () => fetcher('/api/insights/me'),
    staleTime: 10 * 60 * 1000,
  })
}

/** Re-genera el insight al tiro (rate-limited a 3/hora server-side). */
export function useRegenerateWeeklyInsight() {
  const qc = useQueryClient()
  return useMutation<WeeklyInsightData>({
    mutationFn: async () => {
      const res = await fetch('/api/insights/me', { method: 'POST' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'No se pudo regenerar')
      return json.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insights', 'me', 'weekly'] })
    },
  })
}
