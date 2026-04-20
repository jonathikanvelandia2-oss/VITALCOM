'use client'

import { useQuery } from '@tanstack/react-query'

export type BillingOverview = {
  kpis: {
    monthCount: number
    monthRevenue: number
    pendingCount: number
    pendingValue: number
    allTimeCount: number
    allTimeRevenue: number
  }
  byCountry: Array<{ country: string; count: number; revenue: number }>
  recent: Array<{
    id: string
    number: string
    customerName: string
    userName: string | null
    country: string
    total: number
    status: string
    createdAt: string
  }>
}

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useAdminBilling() {
  return useQuery<BillingOverview>({
    queryKey: ['admin-billing'],
    queryFn: () => fetcher('/api/admin/billing/overview'),
    staleTime: 60_000,
  })
}
