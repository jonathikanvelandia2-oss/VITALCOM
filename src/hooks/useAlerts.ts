'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ── V31 — Hooks para alertas proactivas ──

export type AlertType =
  | 'STOCK_LOW'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'DAILY_SUMMARY'
  | 'ROAS_DROP'

export type AlertChannel = 'IN_APP' | 'WHATSAPP' | 'BOTH'

export type ProactiveAlert = {
  id: string
  userId: string
  type: AlertType
  channel: AlertChannel
  enabled: boolean
  config: Record<string, unknown>
  cooldownMinutes: number
  lastTriggeredAt: string | null
  createdAt: string
  updatedAt: string
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data as T
}

export function useAlerts() {
  return useQuery<{ items: ProactiveAlert[] }>({
    queryKey: ['alerts'],
    queryFn: () => fetchJson('/api/alerts'),
    refetchInterval: 60_000,
  })
}

export function useCreateAlert() {
  const qc = useQueryClient()
  return useMutation<
    { id: string },
    Error,
    {
      type: AlertType
      channel?: AlertChannel
      enabled?: boolean
      config?: Record<string, unknown>
      cooldownMinutes?: number
    }
  >({
    mutationFn: data =>
      fetchJson('/api/alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

export function useUpdateAlert() {
  const qc = useQueryClient()
  return useMutation<
    { id: string },
    Error,
    { id: string; data: Partial<Pick<ProactiveAlert, 'enabled' | 'channel' | 'config' | 'cooldownMinutes'>> }
  >({
    mutationFn: ({ id, data }) =>
      fetchJson(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

export function useDeleteAlert() {
  const qc = useQueryClient()
  return useMutation<{ deleted: boolean }, Error, string>({
    mutationFn: id =>
      fetchJson(`/api/alerts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

export function useTestAlert() {
  return useMutation<
    {
      fired: boolean
      occurrence: null | {
        title: string
        body: string
        whatsappText: string
        link?: string
        meta?: Record<string, unknown>
      }
    },
    Error,
    string
  >({
    mutationFn: id => fetchJson(`/api/alerts/${id}`, { method: 'POST' }),
  })
}

// ── Metadata para UI ──
export const ALERT_TYPE_META: Record<
  AlertType,
  { label: string; description: string; defaultConfig: Record<string, unknown>; defaultCooldownMinutes: number }
> = {
  STOCK_LOW: {
    label: 'Stock bajo',
    description: 'Avisa cuando el stock Vitalcom de tu país cae bajo el umbral.',
    defaultConfig: { threshold: 10 },
    defaultCooldownMinutes: 720, // 12h
  },
  ORDER_DISPATCHED: {
    label: 'Pedido en ruta',
    description: 'Avisa cuando uno de tus pedidos pasa a DISPATCHED.',
    defaultConfig: { includeTracking: true },
    defaultCooldownMinutes: 60,
  },
  ORDER_DELIVERED: {
    label: 'Pedido entregado',
    description: 'Avisa cuando uno de tus pedidos llega al cliente.',
    defaultConfig: {},
    defaultCooldownMinutes: 60,
  },
  DAILY_SUMMARY: {
    label: 'Resumen diario',
    description: 'Resumen de pedidos + revenue + en ruta + entregados del día.',
    defaultConfig: { hour: 20 },
    defaultCooldownMinutes: 1440, // 24h
  },
  ROAS_DROP: {
    label: 'ROAS bajo',
    description: 'Alerta si el ROAS de las últimas 24h cae bajo el umbral.',
    defaultConfig: { threshold: 1.5, windowHours: 24 },
    defaultCooldownMinutes: 360, // 6h
  },
}
