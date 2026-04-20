import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { createNotification } from '@/lib/notifications/service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/community/conversations/[id]/messages ───────
// Historial del chat en orden cronológico (más viejo primero).
// También marca los mensajes no leídos como leídos y pone en 0 el
// contador del usuario actual para esta conversación.
// Query: ?limit=50&before=<cursor>

export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: conversationId } = await ctx!.params
  const me = session.id

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      userA: { select: { id: true, name: true, avatar: true, role: true, level: true } },
      userB: { select: { id: true, name: true, avatar: true, role: true, level: true } },
    },
  })
  if (!conversation) return apiError('Conversación no encontrada', 404, 'NOT_FOUND')
  if (conversation.userAId !== me && conversation.userBId !== me) {
    return apiError('Sin acceso a esta conversación', 403, 'FORBIDDEN')
  }

  const url = new URL(req.url)
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 100)
  const before = url.searchParams.get('before')

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
  })

  const hasMore = messages.length > limit
  const slice = hasMore ? messages.slice(0, limit) : messages
  const nextCursor = hasMore ? slice[slice.length - 1].id : null

  // Marcar como leídos los mensajes del otro + resetear contador
  const iAmA = conversation.userAId === me
  await Promise.all([
    prisma.directMessage.updateMany({
      where: { conversationId, senderId: { not: me }, readAt: null },
      data: { readAt: new Date() },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: iAmA ? { unreadForA: 0 } : { unreadForB: 0 },
    }),
  ])

  const other = iAmA ? conversation.userB : conversation.userA

  return apiSuccess({
    conversation: {
      id: conversation.id,
      other: {
        id: other.id,
        name: other.name ?? 'Usuario',
        avatar: other.avatar,
        role: other.role,
        level: other.level,
      },
    },
    messages: slice.reverse().map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      readAt: m.readAt,
      createdAt: m.createdAt,
    })),
    nextCursor,
  })
})

// ── POST /api/community/conversations/[id]/messages ──────
// Envía un mensaje. Actualiza lastMessageAt + lastPreview en la
// conversación, incrementa el contador del otro participante y
// dispara notificación in-app COMMUNITY_DM (fire-and-forget).

const sendSchema = z.object({
  body: z.string().min(1).max(2000),
})

export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: conversationId } = await ctx!.params
  const me = session.id

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })
  if (!conversation) return apiError('Conversación no encontrada', 404, 'NOT_FOUND')
  if (conversation.userAId !== me && conversation.userBId !== me) {
    return apiError('Sin acceso a esta conversación', 403, 'FORBIDDEN')
  }

  const payload = await req.json()
  const { body } = sendSchema.parse(payload)

  const preview = body.length > 120 ? body.slice(0, 120) + '…' : body
  const iAmA = conversation.userAId === me
  const recipientId = iAmA ? conversation.userBId : conversation.userAId

  const [message] = await prisma.$transaction([
    prisma.directMessage.create({
      data: { conversationId, senderId: me, body },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastPreview: preview,
        ...(iAmA ? { unreadForB: { increment: 1 } } : { unreadForA: { increment: 1 } }),
      },
    }),
  ])

  // Notificar al destinatario (fire-and-forget)
  const senderName = session.name ?? session.email.split('@')[0]
  createNotification({
    userId: recipientId,
    type: 'COMMUNITY_DM',
    title: `${senderName} te envió un mensaje`,
    body: preview,
    link: `/chat?c=${conversationId}`,
    meta: { conversationId, senderId: me },
  }).catch(() => {})

  return apiSuccess({
    id: message.id,
    body: message.body,
    senderId: message.senderId,
    readAt: message.readAt,
    createdAt: message.createdAt,
  }, 201)
})
