// V41 — GET /api/admin/audit-logs/export
// Descarga CSV RFC 4180 de la bitácora. Solo ADMIN. Mismo filtrado que
// el listado. Limite 10k rows para no bloquear la BD.
//
// Emite también un evento EXPORT_REQUESTED en el propio audit log.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/session'
import {
  buildAuditWhere,
  writeAuditLog,
  extractRequestMeta,
} from '@/lib/audit/logger'
import { buildCsv, buildFilename } from '@/lib/audit/export'
import { captureException } from '@/lib/observability'
import type {
  AuditAction,
  AuditResource,
  AuditSeverity,
} from '@prisma/client'

export const dynamic = 'force-dynamic'

const MAX_ROWS = 10_000

const VALID_RESOURCES: AuditResource[] = [
  'AUTH', 'USER', 'ROLE', 'ORDER', 'PRODUCT', 'STOCK', 'INBOX',
  'CHANNEL', 'FINANCE', 'EXPORT', 'ADMIN_CONFIG', 'API_KEY', 'OTHER',
]
const VALID_SEVERITIES: AuditSeverity[] = ['INFO', 'NOTICE', 'WARNING', 'CRITICAL']

export async function GET(req: Request) {
  try {
    const session = await requireRole('ADMIN')
    const url = new URL(req.url)

    const resource = url.searchParams.get('resource')
    const action = url.searchParams.get('action')
    const severity = url.searchParams.get('severity')
    const fromStr = url.searchParams.get('from')
    const toStr = url.searchParams.get('to')
    const search = url.searchParams.get('search') || undefined

    const where = buildAuditWhere({
      resource:
        resource && VALID_RESOURCES.includes(resource as AuditResource)
          ? (resource as AuditResource)
          : undefined,
      action: action ? (action as AuditAction) : undefined,
      severity:
        severity && VALID_SEVERITIES.includes(severity as AuditSeverity)
          ? (severity as AuditSeverity)
          : undefined,
      search,
      from: fromStr ? new Date(fromStr) : undefined,
      to: toStr ? new Date(toStr) : undefined,
    })

    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS,
      select: {
        id: true,
        createdAt: true,
        resource: true,
        action: true,
        severity: true,
        summary: true,
        actorEmail: true,
        actorRole: true,
        resourceId: true,
        ip: true,
        userAgent: true,
      },
    })

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Sin eventos para exportar con los filtros actuales', code: 'NO_DATA' },
        { status: 404 },
      )
    }

    const csv = buildCsv(rows)
    const filename = buildFilename()

    // Log meta-evento: quién exportó qué y cuándo
    const meta = extractRequestMeta(req)
    writeAuditLog({
      resource: 'EXPORT',
      action: 'EXPORT_REQUESTED',
      summary: `${session.email} descargó ${rows.length} eventos de audit log`,
      actor: { id: session.id, email: session.email, role: session.role },
      metadata: { rowsExported: rows.length, filters: Object.fromEntries(url.searchParams) },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') {
        return NextResponse.json({ ok: false, error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })
      }
      if (err.message === 'FORBIDDEN') {
        return NextResponse.json({ ok: false, error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
      }
    }
    captureException(err, { route: '/api/admin/audit-logs/export', tags: { surface: 'api' } })
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
