'use client'

import { useQuery } from '@tanstack/react-query'

export type BriefAction = {
  actionId: string
  source: 'MEDIA_BUYER' | 'STORE_OPTIMIZER' | 'FINANCE_ALERT' | 'CREATIVE_MAKER'
  title: string
  reasoning: string
  priority: number
  link: string
  actionLabel: string
}

export type MorningBrief = {
  date: string
  greeting: string
  topActions: BriefAction[]
  kpiDelta: {
    revenueToday: number
    revenueYesterday: number
    revenueDeltaPct: number | null
    ordersToday: number
    ordersYesterday: number
    adSpendToday: number
    revenue7d: number
    revenue7dPrev: number
    revenue7dDeltaPct: number | null
  }
  goal: {
    hasGoal: boolean
    progressPct: number
    isOnTrack: boolean
    projectedRevenue: number
    targetRevenue: number
    daysRemaining: number
    message: string
  }
  motivational: string
  summary: string
}

async function fetchJson(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useMorningBrief() {
  return useQuery<MorningBrief>({
    queryKey: ['morning-brief'],
    queryFn: () => fetchJson('/api/ai/morning-brief'),
    refetchInterval: 15 * 60_000, // 15 min
    staleTime: 5 * 60_000,
  })
}
