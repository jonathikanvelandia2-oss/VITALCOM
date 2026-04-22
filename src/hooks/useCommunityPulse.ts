'use client'

import { useQuery } from '@tanstack/react-query'
import type { UserHealthSegment } from '@prisma/client'

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar')
  return json.data
}

export interface SegmentDistributionRow {
  segment: UserHealthSegment
  count: number
  percentage: number
}

export interface MoverRow {
  userId: string
  userName: string
  revenueDeltaPct: number
  revenue: number
  segment: UserHealthSegment | null
  direction: 'up' | 'down'
}

export interface AtRiskRow {
  userId: string
  userName: string
  healthScore: number
  segment: UserHealthSegment | null
  revenue: number
  reason: string
  weight: number
}

export interface CommunityPulseData {
  asOf: string
  weekStart: string
  weekEnd: string
  totalActive: number
  totalInsightsThisWeek: number
  segmentDistribution: SegmentDistributionRow[]
  topUp: MoverRow[]
  topDown: MoverRow[]
  atRisk: AtRiskRow[]
  coverage: {
    coverage: number
    missing: number
    label: 'bajo' | 'medio' | 'alto' | 'excelente'
  }
  totalRevenueThisWeek: number
}

export function useCommunityPulse() {
  return useQuery<CommunityPulseData>({
    queryKey: ['admin', 'community', 'pulse'],
    queryFn: () => fetcher('/api/admin/community/pulse'),
    staleTime: 5 * 60 * 1000,
  })
}
