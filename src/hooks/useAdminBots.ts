'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type BotName =
  | 'STOCK_BOT' | 'RESTOCK_BOT' | 'ADS_BOT'
  | 'INACTIVITY_BOT' | 'ONBOARDING_BOT'
export type BotRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL'

export type BotRun = {
  id: string
  bot: BotName
  status: BotRunStatus
  startedAt: string
  finishedAt: string | null
  durationMs: number | null
  usersProcessed: number
  itemsAffected: number
  notifsCreated: number
  errors: number
  summary: string | null
  triggeredBy: string | null
}

export type BotsData = {
  period: { days: number; from: string }
  runs: BotRun[]
  byBot: Array<{
    bot: BotName
    status: BotRunStatus
    _count: number
    _sum: {
      usersProcessed: number | null
      itemsAffected: number | null
      notifsCreated: number | null
      errors: number | null
    }
  }>
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useAdminBots(days: 7 | 30 = 7) {
  return useQuery<BotsData>({
    queryKey: ['admin-bots', days],
    queryFn: () => fetchJson(`/api/admin/bots?days=${days}`),
    refetchInterval: 30_000,
  })
}

export function useRunBot() {
  const qc = useQueryClient()
  return useMutation<
    { runId: string; status: BotRunStatus; summary: string; metrics: Record<string, number> },
    Error,
    BotName
  >({
    mutationFn: (bot) =>
      fetchJson('/api/admin/bots/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bots'] }),
  })
}
