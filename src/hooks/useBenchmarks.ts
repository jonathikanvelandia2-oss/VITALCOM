'use client'

import { useQuery } from '@tanstack/react-query'

export type PercentileRank = 'top_10' | 'top_25' | 'top_50' | 'below_50'

export type MetricBenchmark = {
  userValue: number | null
  percentileRank: PercentileRank | null
  percentileIndex: number | null
  communityMedian: number
  communityTop10: number
  communityMean: number
  sampleSize: number
}

export type BenchmarksPayload = {
  revenue30d: MetricBenchmark
  orders30d: MetricBenchmark
  marginPct30d: MetricBenchmark
  roas30d: MetricBenchmark
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useBenchmarks() {
  return useQuery<BenchmarksPayload>({
    queryKey: ['benchmarks'],
    queryFn: () => fetchJson('/api/benchmarks'),
    refetchInterval: 10 * 60_000,
  })
}
