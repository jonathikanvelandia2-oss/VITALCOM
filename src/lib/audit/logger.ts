// V40 — Audit log global
// Registro centralizado de operaciones sensibles para compliance + evidencia
// ante integraciones externas (Dropi/Effi). Complementa FulfillmentLog.
//
// Patrón: fire-and-forget en escrituras normales (no bloquea la operación si falla);
// transaccional cuando la consistencia es crítica (pasar tx).

import { prisma } from '@/lib/db/prisma'
import { captureException } from '@/lib/observability'
import type {
  AuditAction,
  AuditResource,
  AuditSeverity,
  Prisma,
} from '@prisma/client'

export type AuditActorSnapshot = {
  id?: string | null
  email?: string | null
  role?: string | null
}

export type AuditLogInput = {
  actor?: AuditActorSnapshot
  resource: AuditResource
  action: AuditAction
  resourceId?: string | null
  severity?: AuditSeverity
  summary: string
  metadata?: Record<string, unknown> | null
  ip?: string | null
  userAgent?: string | null
}

// ── Mapeo determinista acción → severidad por defecto ──
// Puede sobreescribirse por input. Las acciones críticas (deletes, role changes,
// login fallidos repetidos) elevan automáticamente la severidad.
export const DEFAULT_SEVERITY: Record<AuditAction, AuditSeverity> = {
  LOGIN_SUCCESS: 'INFO',
  LOGIN_FAILED: 'WARNING',
  LOGOUT: 'INFO',
  REGISTER: 'INFO',
  PASSWORD_RESET_REQUESTED: 'NOTICE',
  PASSWORD_RESET_COMPLETED: 'NOTICE',
  ROLE_CHANGED: 'CRITICAL',
  AREA_CHANGED: 'WARNING',
  USER_CREATED: 'NOTICE',
  USER_DEACTIVATED: 'WARNING',
  USER_REACTIVATED: 'NOTICE',
  USER_DELETED: 'CRITICAL',
  PRODUCT_CREATED: 'INFO',
  PRODUCT_UPDATED: 'INFO',
  PRODUCT_DEACTIVATED: 'NOTICE',
  STOCK_ADJUSTED: 'NOTICE',
  ORDER_CREATED: 'INFO',
  ORDER_STATUS_CHANGED: 'INFO',
  ORDER_CANCELLED: 'NOTICE',
  INBOX_THREAD_RESOLVED: 'INFO',
  INBOX_THREAD_REASSIGNED: 'INFO',
  CHANNEL_CREATED: 'NOTICE',
  CHANNEL_UPDATED: 'INFO',
  CHANNEL_DISABLED: 'WARNING',
  EXPORT_REQUESTED: 'WARNING',
  DATA_ACCESSED: 'INFO',
  CONFIG_UPDATED: 'WARNING',
  API_KEY_CREATED: 'CRITICAL',
  API_KEY_REVOKED: 'CRITICAL',
  OTHER: 'INFO',
}

export function resolveSeverity(
  action: AuditAction,
  override?: AuditSeverity,
): AuditSeverity {
  return override ?? DEFAULT_SEVERITY[action] ?? 'INFO'
}

// ── Extractor de metadata HTTP — ip real detrás de proxy + user agent ──
export function extractRequestMeta(req: Request | Headers): {
  ip: string | null
  userAgent: string | null
} {
  const headers = req instanceof Headers ? req : req.headers
  const fwd = headers.get('x-forwarded-for')
  const ip = fwd
    ? fwd.split(',')[0]?.trim() || null
    : headers.get('x-real-ip') || null
  const userAgent = headers.get('user-agent') || null
  return { ip, userAgent }
}

// ── Diff helper — reporta solo campos cambiados en updates ──
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: (keyof T)[],
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  for (const key of fields) {
    if (before[key] !== after[key]) {
      changes[String(key)] = { from: before[key], to: after[key] }
    }
  }
  return changes
}

// ── Construcción del objeto a persistir (puro, testeable) ──
export function buildAuditPayload(
  input: AuditLogInput,
): Prisma.AuditLogUncheckedCreateInput {
  const severity = resolveSeverity(input.action, input.severity)
  return {
    actorId: input.actor?.id ?? null,
    actorEmail: input.actor?.email ?? null,
    actorRole: input.actor?.role ?? null,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    action: input.action,
    severity,
    summary: input.summary,
    metadata: input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : undefined,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  }
}

// ── Escritura fire-and-forget — nunca lanza excepción al caller ──
export function writeAuditLog(input: AuditLogInput): void {
  const payload = buildAuditPayload(input)
  prisma.auditLog.create({ data: payload }).catch((err) => {
    captureException(err, {
      tags: { surface: 'audit' },
      extra: {
        resource: input.resource,
        action: input.action,
        summary: input.summary,
      },
    })
  })
}

// ── Variante transaccional — para cuando debe fallar con la operación ──
export async function writeAuditLogTx(
  tx: Prisma.TransactionClient | typeof prisma,
  input: AuditLogInput,
) {
  const payload = buildAuditPayload(input)
  return tx.auditLog.create({ data: payload })
}

// ── Lista de auditoría con filtros ──
export type AuditFilters = {
  resource?: AuditResource
  action?: AuditAction
  severity?: AuditSeverity
  actorId?: string
  resourceId?: string
  from?: Date
  to?: Date
  search?: string
  page?: number
  limit?: number
}

export function buildAuditWhere(
  filters: AuditFilters,
): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {}
  if (filters.resource) where.resource = filters.resource
  if (filters.action) where.action = filters.action
  if (filters.severity) where.severity = filters.severity
  if (filters.actorId) where.actorId = filters.actorId
  if (filters.resourceId) where.resourceId = filters.resourceId
  if (filters.from || filters.to) {
    where.createdAt = {}
    if (filters.from) where.createdAt.gte = filters.from
    if (filters.to) where.createdAt.lte = filters.to
  }
  if (filters.search) {
    where.OR = [
      { summary: { contains: filters.search, mode: 'insensitive' } },
      { actorEmail: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  return where
}

// ── KPIs agregados para dashboard de seguridad ──
export type AuditStats = {
  totalLast24h: number
  criticalLast7d: number
  failedLoginsLastHour: number
  bySeverityLast7d: Record<AuditSeverity, number>
  byResourceLast7d: Record<string, number>
}

export function computeAuditStats(rows: Array<{
  severity: AuditSeverity
  action: AuditAction
  resource: AuditResource
  createdAt: Date
}>, now: Date = new Date()): AuditStats {
  const ms24h = 24 * 60 * 60 * 1000
  const ms7d = 7 * ms24h
  const ms1h = 60 * 60 * 1000

  const bySeverityLast7d: Record<AuditSeverity, number> = {
    INFO: 0,
    NOTICE: 0,
    WARNING: 0,
    CRITICAL: 0,
  }
  const byResourceLast7d: Record<string, number> = {}

  let totalLast24h = 0
  let criticalLast7d = 0
  let failedLoginsLastHour = 0

  for (const row of rows) {
    const age = now.getTime() - row.createdAt.getTime()
    if (age <= ms7d) {
      bySeverityLast7d[row.severity] = (bySeverityLast7d[row.severity] ?? 0) + 1
      byResourceLast7d[row.resource] =
        (byResourceLast7d[row.resource] ?? 0) + 1
      if (row.severity === 'CRITICAL') criticalLast7d++
    }
    if (age <= ms24h) totalLast24h++
    if (age <= ms1h && row.action === 'LOGIN_FAILED') failedLoginsLastHour++
  }

  return {
    totalLast24h,
    criticalLast7d,
    failedLoginsLastHour,
    bySeverityLast7d,
    byResourceLast7d,
  }
}
