import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession, isStaff } from '@/lib/auth/session'
import { createMessageSchema } from '@/lib/api/schemas/inbox'
import { createBulkNotifications, getStaffIdsForArea } from '@/lib/notifications/service'

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

  // Notificar a destinatarios (no al sender):
  // - Si sender es staff → notificar a otros participantes no-staff del hilo
  // - Si sender es comunidad → notificar a staff responsable del área
  const senderIsStaff = isStaff(session.role)
  const recipients = new Set<string>()

  if (senderIsStaff) {
    const participants = await prisma.inboxMessage.findMany({
      where: { threadId, senderId: { not: session.id } },
      select: { senderId: true },
      distinct: ['senderId'],
    })
    for (const p of participants) recipients.add(p.senderId)
  } else {
    const staffIds = await getStaffIdsForArea(thread.area)
    for (const id of staffIds) if (id !== session.id) recipients.add(id)
  }

  if (recipients.size > 0) {
    const preview = data.body.length > 80 ? data.body.slice(0, 80) + '…' : data.body
    const senderName = session.name ?? session.email.split('@')[0]
    createBulkNotifications(Array.from(recipients), {
      type: 'INBOX_MESSAGE',
      title: `${senderName} · ${thread.subject}`,
      body: preview,
      link: `/admin/inbox?thread=${threadId}`,
      meta: { threadId, area: thread.area },
    }).catch(() => {})
  }

  return apiSuccess(message, 201)
})
