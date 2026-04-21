'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type GoalProgress = {
  goal: {
    id: string
    year: number
    month: number
    targetRevenue: number
    targetOrders: number | null
    targetMargin: number | null
    stretchRevenue: number | null
    status: 'ACTIVE' | 'ACHIEVED' | 'MISSED' | 'ARCHIVED'
  } | null
  current: { revenue: number; orders: number; marginPct: number | null }
  projected: { revenue: number; orders: number }
  progressPct: { revenue: number; orders: number | null }
  daysElapsed: number
  daysRemaining: number
  daysInMonth: number
  isOnTrack: boolean
  dailyRateToHit: number | null
  needsPerDayIncrease: number | null
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useCurrentGoal() {
  return useQuery<GoalProgress>({
    queryKey: ['goal-current'],
    queryFn: () => fetchJson('/api/goals/current'),
    refetchInterval: 5 * 60_000,
  })
}

export function useSetGoal() {
  const qc = useQueryClient()
  return useMutation<
    GoalProgress['goal'],
    Error,
    {
      targetRevenue: number
      targetOrders?: number
      targetMargin?: number
      stretchRevenue?: number
    }
  >({
    mutationFn: (data) =>
      fetchJson('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goal-current'] }),
  })
}
