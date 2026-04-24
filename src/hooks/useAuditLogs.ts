'use client'

import { useQuery } from '@tanstack/react-query'

// ── Hook de audit logs — React Query ────────────────

export type AuditSeverity = 'INFO' | 'NOTICE' | 'WARNING' | 'CRITICAL'
export type AuditResource =
  | 'AUTH'
  | 'USER'
  | 'ROLE'
  | 'ORDER'
  | 'PRODUCT'
  | 'STOCK'
  | 'INBOX'
  | 'CHANNEL'
  | 'FINANCE'
  | 'EXPORT'
  | 'ADMIN_CONFIG'
  | 'API_KEY'
  | 'OTHER'

export type AuditLogItem = {
  id: string
  resource: AuditResource
  action: string
  severity: AuditSeverity
  summary: string
  resourceId: string | null
  actorId: string | null
  actorEmail: string | null
  actorRole: string | null
  metadata: Record<string, unknown> | null
  ip: string | null
  userAgent: string | null
  createdAt: string
  actor: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    role: string
    area: string | null
  } | null
}

export type AuditStats = {
  totalLast24h: number
  criticalLast7d: number
  failedLoginsLastHour: number
  bySeverityLast7d: Record<AuditSeverity, number>
  byResourceLast7d: Record<string, number>
}

export type AuditFilters = {
  resource?: AuditResource
  severity?: AuditSeverity
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar')
  return json.data
}

export function useAuditLogs(filters: AuditFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery<{
    items: AuditLogItem[]
    pagination: { page: number; limit: number; total: number; pages: number }
    stats: AuditStats
  }>({
    queryKey: ['admin-audit-logs', filters],
    queryFn: () => fetcher(`/api/admin/audit-logs?${params}`),
    refetchInterval: 30000,
  })
}
