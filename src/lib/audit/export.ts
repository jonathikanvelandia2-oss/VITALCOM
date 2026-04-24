// V41 — Exportación CSV de audit logs para compliance + pitch a Dropi/Effi.
// Función pura: recibe rows de la BD, retorna CSV string.
// Quoting RFC 4180: escape de dobles comillas duplicándolas + wrapping si contiene , " o newline.

export type AuditLogRow = {
  id: string
  createdAt: Date
  resource: string
  action: string
  severity: string
  summary: string
  actorEmail: string | null
  actorRole: string | null
  resourceId: string | null
  ip: string | null
  userAgent: string | null
}

const HEADERS = [
  'id',
  'timestamp',
  'resource',
  'action',
  'severity',
  'summary',
  'actor_email',
  'actor_role',
  'resource_id',
  'ip',
  'user_agent',
] as const

/** Quoting RFC 4180 — envuelve en comillas si contiene delimitadores o newlines. */
export function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Construye una fila CSV a partir de un AuditLog. */
export function formatRow(row: AuditLogRow): string {
  return [
    row.id,
    row.createdAt.toISOString(),
    row.resource,
    row.action,
    row.severity,
    row.summary,
    row.actorEmail ?? '',
    row.actorRole ?? '',
    row.resourceId ?? '',
    row.ip ?? '',
    row.userAgent ?? '',
  ]
    .map(csvEscape)
    .join(',')
}

/** Construye el CSV completo (header + rows). */
export function buildCsv(rows: AuditLogRow[]): string {
  const lines = [HEADERS.join(','), ...rows.map(formatRow)]
  // CRLF — convención Windows/Excel
  return lines.join('\r\n')
}

/** Filename sugerido con timestamp ISO-safe. */
export function buildFilename(now: Date = new Date()): string {
  const iso = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `vitalcom-audit-log-${iso}.csv`
}
