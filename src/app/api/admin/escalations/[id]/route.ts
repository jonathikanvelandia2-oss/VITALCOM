// V26 — GET /api/admin/escalations/[id]
// Detalle del ticket + mensajes del thread para responder al usuario.

import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  await requireRole('EMPLOYEE')

  const ticket = await prisma.escalationTicket.findUnique({
    where: { id: ctx.params.id },
    include: {
      user: { select: { id: true, name: true, email: true, country: true, role: true } },
      thread: {
        select: {
          id: true,
          title: true,
          agentName: true,
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50,
            select: {
              id: true, role: true, content: true, createdAt: true,
              confidence: true, source: true, model: true,
            },
          },
        },
      },
      assignee: { select: { id: true, name: true } },
    },
  })

  if (!ticket) return apiError('Ticket no encontrado', 404, 'NOT_FOUND')

  return apiSuccess({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    assignedAt: ticket.assignedAt?.toISOString() ?? null,
    thread: {
      ...ticket.thread,
      messages: ticket.thread.messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  })
})
