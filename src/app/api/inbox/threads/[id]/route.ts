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
      assignedTo: { select: { id: true, name: true, email: true, avatar: true, area: true } },
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
    assignedTo: thread.assignedTo,
    firstResponseAt: thread.firstResponseAt,
    resolvedAt: thread.resolvedAt,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  })
})

// ── PATCH /api/inbox/threads/[id] — Resolver / reasignar / priorizar / asignar ─
// Solo staff. Registra la acción como mensaje de sistema en el hilo.
// V39: soporta assignedToId + guarda resolvedAt/resolvedById para SLA tracking.
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
  if (data.assignedToId !== undefined && data.assignedToId !== thread.assignedToId) {
    if (data.assignedToId === null) {
      audits.push('quitó la asignación')
    } else if (data.assignedToId === session.id) {
      audits.push('tomó el hilo')
    } else {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { name: true, email: true },
      })
      const label = assignee?.name ?? assignee?.email ?? data.assignedToId.slice(0, 6)
      audits.push(`asignó el hilo a ${label}`)
    }
  }

  // V39 — resolvedAt / resolvedById atómicos
  const updateData: Record<string, unknown> = {
    ...(data.resolved !== undefined ? { resolved: data.resolved } : {}),
    ...(data.priority ? { priority: data.priority } : {}),
    ...(data.area ? { area: data.area } : {}),
    ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
  }
  if (data.resolved !== undefined && data.resolved !== thread.resolved) {
    if (data.resolved) {
      updateData.resolvedAt = new Date()
      updateData.resolvedById = session.id
    } else {
      updateData.resolvedAt = null
      updateData.resolvedById = null
    }
  }

  const updated = await prisma.inboxThread.update({
    where: { id },
    data: updateData,
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
    assignedToId: updated.assignedToId,
    resolvedAt: updated.resolvedAt,
  })
})
