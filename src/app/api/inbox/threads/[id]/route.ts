import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession, isStaff } from '@/lib/auth/session'
import { updateThreadSchema } from '@/lib/api/schemas/inbox'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/inbox/threads/[id] — Detalle de hilo ──────
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const thread = await prisma.inboxThread.findUnique({
    where: { id },
    include: {
      _count: { select: { messages: true } },
    },
  })

  if (!thread) throw new Error('NOT_FOUND')

  // Comunidad: solo si participó
  if (!isStaff(session.role)) {
    const participated = await prisma.inboxMessage.findFirst({
      where: { threadId: id, senderId: session.id },
      select: { id: true },
    })
    if (!participated) throw new Error('FORBIDDEN')
  }

  return apiSuccess({
    id: thread.id,
    subject: thread.subject,
    area: thread.area,
    priority: thread.priority,
    resolved: thread.resolved,
    messageCount: thread._count.messages,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  })
})

// ── PATCH /api/inbox/threads/[id] — Resolver / reasignar / priorizar ─
// Solo staff. Registra la acción como mensaje de sistema en el hilo.
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  if (!isStaff(session.role)) return apiError('Solo staff', 403, 'FORBIDDEN')

  const { id } = await ctx!.params
  const thread = await prisma.inboxThread.findUnique({ where: { id } })
  if (!thread) throw new Error('NOT_FOUND')

  const body = await req.json()
  const data = updateThreadSchema.parse(body)

  const audits: string[] = []
  if (data.resolved !== undefined && data.resolved !== thread.resolved) {
    audits.push(data.resolved ? 'marcó este hilo como resuelto' : 'reabrió el hilo')
  }
  if (data.priority && data.priority !== thread.priority) {
    audits.push(`cambió la prioridad de ${thread.priority} a ${data.priority}`)
  }
  if (data.area && data.area !== thread.area) {
    audits.push(`reasignó el hilo de ${thread.area} a ${data.area}`)
  }

  const updated = await prisma.inboxThread.update({
    where: { id },
    data: {
      ...(data.resolved !== undefined ? { resolved: data.resolved } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.area ? { area: data.area } : {}),
    },
  })

  // Log de auditoría como mensaje de sistema (senderId = quien hizo la acción).
  if (audits.length > 0) {
    await prisma.inboxMessage.create({
      data: {
        threadId: id,
        senderId: session.id,
        body: `— ${session.name ?? session.email} ${audits.join(' · ')}.`,
      },
    })
  }

  return apiSuccess({
    id: updated.id,
    subject: updated.subject,
    area: updated.area,
    priority: updated.priority,
    resolved: updated.resolved,
  })
})
