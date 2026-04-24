'use client'

// V37 — Hooks React Query para fulfillment.
// Manual dispatch, audit logs, carriers catalog.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

async function postJson<T>(url: string, body: unknown = {}): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error en la acción')
  return json.data as T
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar')
  return json.data as T
}

// ── Carriers catalog ──────────────────────────────────
export type Carrier = {
  key: string
  label: string
  country: 'CO' | 'EC' | 'GT' | 'CL'
  website: string
}

export function useCarriers(country?: 'CO' | 'EC' | 'GT' | 'CL') {
  const qs = country ? `?country=${country}` : ''
  return useQuery<{ country: string; items: Carrier[] }>({
    queryKey: ['fulfillment-carriers', country ?? 'ALL'],
    queryFn: () => getJson(`/api/fulfillment/carriers${qs}`),
    staleTime: 30 * 60 * 1000, // 30 min — casi estático
  })
}

// ── Manual fulfill ─────────────────────────────────────
export type ManualFulfillInput = {
  carrierKey: string
  trackingCode: string
  manualCost?: number
  labelUrl?: string
  note?: string
}

export function useManualFulfill(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ManualFulfillInput) =>
      postJson(`/api/orders/${orderId}/fulfill-manual`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', orderId] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order-logs', orderId] })
    },
  })
}

// ── Audit logs ─────────────────────────────────────────
export type FulfillmentLogItem = {
  id: string
  action: string
  fromStatus: string | null
  toStatus: string | null
  message: string | null
  createdAt: string
  actor: {
    id?: string
    name: string | null
    email?: string
    role?: string
    area?: string
  }
  metadata?: Record<string, unknown>
}

export function useOrderLogs(orderId: string | null) {
  return useQuery<{ items: FulfillmentLogItem[]; total: number }>({
    queryKey: ['order-logs', orderId],
    queryFn: () => getJson(`/api/orders/${orderId}/logs`),
    enabled: Boolean(orderId),
    refetchInterval: 30_000,
  })
}
