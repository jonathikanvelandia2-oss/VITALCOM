'use client'

import { useQuery } from '@tanstack/react-query'

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar')
  return json.data
}

/** KPIs y estadísticas del dashboard admin */
export function useAdminStats(days = 7) {
  return useQuery({
    queryKey: ['admin', 'stats', days],
    queryFn: () => fetcher(`/api/admin/stats?days=${days}`),
    refetchInterval: 60000, // Refrescar cada minuto
  })
}

/** P&L consolidado Vitalcom (nivel empresa, no dropshipper) */
export function useAdminFinance(days = 30) {
  return useQuery({
    queryKey: ['admin', 'finance', days],
    queryFn: () => fetcher(`/api/admin/finance/overview?days=${days}`),
    refetchInterval: 120000,
  })
}

/** Métricas de adquisición + engagement comunidad */
export function useAdminMarketing(days = 30) {
  return useQuery({
    queryKey: ['admin', 'marketing', days],
    queryFn: () => fetcher(`/api/admin/marketing/overview?days=${days}`),
    refetchInterval: 120000,
  })
}
