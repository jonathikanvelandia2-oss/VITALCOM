// V26 — GET /api/ai/chat/threads/[id]
// Trae todos los mensajes de un thread del usuario (auth-gated).

import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()

  const thread = await prisma.conversationThread.findFirst({
    where: { id: ctx.params.id, userId: session.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          confidence: true,
          source: true,
          createdAt: true,
        },
      },
    },
  })

  if (!thread) {
    return apiError('Thread no encontrado', 404, 'NOT_FOUND')
  }

  return apiSuccess({
    id: thread.id,
    agent: thread.agentName,
    title: thread.title,
    escalated: thread.escalatedToArea !== null,
    messages: thread.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      confidence: m.confidence,
      source: m.source,
      createdAt: m.createdAt.toISOString(),
    })),
  })
})
