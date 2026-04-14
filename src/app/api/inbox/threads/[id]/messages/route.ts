import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { createMessageSchema } from '@/lib/api/schemas/inbox'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/inbox/threads/[id]/messages — Mensajes del hilo ─
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: threadId } = await ctx!.params

  const thread = await prisma.inboxThread.findUnique({ where: { id: threadId } })
  if (!thread) throw new Error('NOT_FOUND')

  const messages = await prisma.inboxMessage.findMany({
    where: { threadId },
    include: {
      sender: { select: { id: true, name: true, avatar: true, area: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Marcar como leídos los mensajes que no son del usuario
  await prisma.inboxMessage.updateMany({
    where: { threadId, senderId: { not: session.id }, read: false },
    data: { read: true },
  })

  return apiSuccess({
    thread: {
      id: thread.id,
      subject: thread.subject,
      area: thread.area,
      priority: thread.priority,
      resolved: thread.resolved,
    },
    messages,
  })
})

// ── POST /api/inbox/threads/[id]/messages — Enviar mensaje ─
export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: threadId } = await ctx!.params

  const thread = await prisma.inboxThread.findUnique({ where: { id: threadId } })
  if (!thread) throw new Error('NOT_FOUND')

  const body = await req.json()
  const data = createMessageSchema.parse(body)

  const message = await prisma.inboxMessage.create({
    data: {
      threadId,
      senderId: session.id,
      receiverId: data.receiverId,
      body: data.body,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true, area: true, role: true } },
    },
  })

  // Actualizar timestamp del hilo
  await prisma.inboxThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  })

  return apiSuccess(message, 201)
})
