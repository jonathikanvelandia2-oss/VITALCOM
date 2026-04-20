import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ── GET /api/community/conversations ─────────────────────
// Lista de conversaciones del usuario ordenadas por
// lastMessageAt DESC. Incluye unreadCount por participante
// y snippet del último mensaje.

export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  const me = session.id

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    include: {
      userA: { select: { id: true, name: true, avatar: true, role: true, level: true } },
      userB: { select: { id: true, name: true, avatar: true, role: true, level: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  })

  const items = conversations.map((c) => {
    const other = c.userAId === me ? c.userB : c.userA
    const unread = c.userAId === me ? c.unreadForA : c.unreadForB
    return {
      id: c.id,
      other: {
        id: other.id,
        name: other.name ?? 'Usuario',
        avatar: other.avatar,
        role: other.role,
        level: other.level,
      },
      lastPreview: c.lastPreview,
      lastMessageAt: c.lastMessageAt,
      unread,
    }
  })

  const totalUnread = items.reduce((sum, c) => sum + c.unread, 0)

  return apiSuccess({ items, totalUnread })
})

// ── POST /api/community/conversations ────────────────────
// Inicia (o encuentra) una conversación 1:1 con otro usuario.
// Idempotente: si ya existe, retorna la misma.
// Body: { otherUserId: string }

const startSchema = z.object({
  otherUserId: z.string().min(1),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const me = session.id
  const body = await req.json()
  const { otherUserId } = startSchema.parse(body)

  if (otherUserId === me) {
    return apiError('No puedes iniciar una conversación contigo mismo', 400, 'SELF_CHAT')
  }

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, active: true, name: true, avatar: true, role: true, level: true },
  })
  if (!other || !other.active) return apiError('Usuario no encontrado', 404, 'NOT_FOUND')

  // Orden lexicográfico para unicidad determinística
  const [userAId, userBId] = [me, otherUserId].sort()

  const conversation = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
    include: {
      userA: { select: { id: true, name: true, avatar: true, role: true, level: true } },
      userB: { select: { id: true, name: true, avatar: true, role: true, level: true } },
    },
  })

  const otherParticipant = conversation.userAId === me ? conversation.userB : conversation.userA
  return apiSuccess({
    id: conversation.id,
    other: {
      id: otherParticipant.id,
      name: otherParticipant.name ?? 'Usuario',
      avatar: otherParticipant.avatar,
      role: otherParticipant.role,
      level: otherParticipant.level,
    },
    lastPreview: conversation.lastPreview,
    lastMessageAt: conversation.lastMessageAt,
    unread: 0,
  }, 201)
})
