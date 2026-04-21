'use client'

import { useQuery } from '@tanstack/react-query'

export type OpsHealth = {
  timestamp: string
  featureFlags: {
    whatsappMockMode: boolean
    anthropicEnabled: boolean
    embeddingsEnabled: boolean
  }
  router: {
    circuits: {
      openai: { failures: number; lastFailAt: number; open: boolean }
      anthropic: { failures: number; lastFailAt: number; open: boolean }
    }
  }
  bots24h: {
    total: number
    success: number
    failed: number
    partial: number
    running: number
  }
  workflows: {
    active: number
    runningNow: number
  }
  escalations: {
    open: number
  }
  cache: {
    entries: number
    totalHits: number
    userMemoriesWithEmbedding: number
  }
  conversations24h: number
  whatsapp: {
    activeAccounts: number
    webhookEvents24h: Record<string, number>
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data as T
}

export function useOpsHealth() {
  return useQuery<OpsHealth>({
    queryKey: ['ops-health'],
    queryFn: () => fetchJson('/api/ops/health'),
    refetchInterval: 30_000,
  })
}
