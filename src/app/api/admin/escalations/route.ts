// V26 — GET /api/admin/escalations
// Lista tickets de escalación para el equipo. Filtros por status y área.

import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Area, EscalationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireRole('EMPLOYEE')

  const url = new URL(req.url)
  const statusParam = url.searchParams.get('status') as EscalationStatus | null
  const areaParam = url.searchParams.get('area') as Area | null

  const where: Record<string, unknown> = {}
  if (statusParam) where.status = statusParam
  if (areaParam) where.toArea = areaParam
  else if (session.role === 'MANAGER_AREA' || session.role === 'EMPLOYEE') {
    // Empleados solo ven tickets de su área
    if (session.area) where.toArea = session.area
  }

  const tickets = await prisma.escalationTicket.findMany({
    where,
    orderBy: [
      { status: 'asc' },       // OPEN primero
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true, country: true } },
      thread: { select: { id: true, title: true, agentName: true } },
      assignee: { select: { id: true, name: true } },
    },
  })

  const summary = {
    open: await prisma.escalationTicket.count({ where: { ...where, status: EscalationStatus.OPEN } }),
    inProgress: await prisma.escalationTicket.count({ where: { ...where, status: EscalationStatus.IN_PROGRESS } }),
    resolved: await prisma.escalationTicket.count({ where: { ...where, status: EscalationStatus.RESOLVED } }),
  }

  return apiSuccess({
    summary,
    items: tickets.map(t => ({
      id: t.id,
      fromAgent: t.fromAgent,
      toArea: t.toArea,
      priority: t.priority,
      status: t.status,
      reason: t.reason,
      summary: t.summary,
      draftResponse: t.draftResponse,
      resolution: t.resolution,
      replyToUser: t.replyToUser,
      createdAt: t.createdAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString(),
      user: t.user,
      thread: t.thread,
      assignee: t.assignee,
    })),
  })
})
