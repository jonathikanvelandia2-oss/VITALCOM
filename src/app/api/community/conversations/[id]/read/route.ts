import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// ── PATCH /api/community/conversations/[id]/read ─────────
// Marca todos los mensajes como leídos y resetea el contador
// del usuario actual para esta conversación. Idempotente.

export const PATCH = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: conversationId } = await ctx!.params
  const me = session.id

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  })
  if (!conversation) return apiError('Conversación no encontrada', 404, 'NOT_FOUND')
  if (conversation.userAId !== me && conversation.userBId !== me) {
    return apiError('Sin acceso a esta conversación', 403, 'FORBIDDEN')
  }

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

  return apiSuccess({ ok: true })
})
