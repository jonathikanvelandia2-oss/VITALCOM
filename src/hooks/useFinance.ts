'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateEntryInput } from '@/lib/api/schemas/finance'

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar finanzas')
  return json.data
}

async function mutator(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error en operación')
  return json.data
}

/** P&L completo: summary + timeseries + profitability */
export function usePnL(period: '7d' | '30d' | '90d' | 'month' | 'year' = '30d') {
  return useQuery({
    queryKey: ['pnl', period],
    queryFn: () => fetcher(`/api/finance/pnl?period=${period}`),
    staleTime: 2 * 60 * 1000,
  })
}

/** Lista de movimientos */
export function useFinanceEntries(filters: { type?: string; category?: string; limit?: number } = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })
  return useQuery({
    queryKey: ['finance-entries', filters],
    queryFn: () => fetcher(`/api/finance/entries?${params}`),
  })
}

/** Registrar movimiento manual */
export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEntryInput) => mutator('/api/finance/entries', 'POST', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pnl'] })
      qc.invalidateQueries({ queryKey: ['finance-entries'] })
    },
  })
}

/** Eliminar movimiento */
export function useDeleteEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutator(`/api/finance/entries/${id}`, 'DELETE'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pnl'] })
      qc.invalidateQueries({ queryKey: ['finance-entries'] })
    },
  })
}

/** Insights del agente MentorFinanciero */
export function useMentorInsights(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['mentor-insights', period],
    queryFn: () => fetcher(`/api/finance/mentor?period=${period}`),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })
}

/** Blueprint completo: diagnóstico 0-100 + 5 acciones semanales */
export function useBlueprint(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['blueprint', period],
    queryFn: () => fetcher(`/api/blueprint?period=${period}`),
    staleTime: 10 * 60 * 1000,
    retry: false,
  })
}
