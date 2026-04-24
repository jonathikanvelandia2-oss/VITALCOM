// V40 — GET /api/admin/audit-logs
// Lista de eventos de auditoría con filtros + paginación + stats agregadas.
// Solo ADMIN/SUPERADMIN. Retorna actor con detalle para la UI.

import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { buildAuditWhere, computeAuditStats } from '@/lib/audit/logger'
import type {
  AuditAction,
  AuditResource,
  AuditSeverity,
} from '@prisma/client'

const VALID_RESOURCES: AuditResource[] = [
  'AUTH',
  'USER',
  'ROLE',
  'ORDER',
  'PRODUCT',
  'STOCK',
  'INBOX',
  'CHANNEL',
  'FINANCE',
  'EXPORT',
  'ADMIN_CONFIG',
  'API_KEY',
  'OTHER',
]

const VALID_SEVERITIES: AuditSeverity[] = ['INFO', 'NOTICE', 'WARNING', 'CRITICAL']

export const GET = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')
  const url = new URL(req.url)

  const resource = url.searchParams.get('resource')
  const action = url.searchParams.get('action')
  const severity = url.searchParams.get('severity')
  const actorId = url.searchParams.get('actorId') || undefined
  const resourceId = url.searchParams.get('resourceId') || undefined
  const search = url.searchParams.get('search') || undefined
  const fromStr = url.searchParams.get('from')
  const toStr = url.searchParams.get('to')
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 50)))

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
    actorId,
    resourceId,
    search,
    from: fromStr ? new Date(fromStr) : undefined,
    to: toStr ? new Date(toStr) : undefined,
  })

  const [items, total, statsRows] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: {
          select: { id: true, name: true, email: true, avatar: true, role: true, area: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { severity: true, action: true, resource: true, createdAt: true },
    }),
  ])

  const stats = computeAuditStats(statsRows)

  return apiSuccess({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    stats,
  })
})
