// V26 — GET /api/ai/chat/threads
// Lista los threads del usuario ordenados por último mensaje.

import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const threads = await prisma.conversationThread.findMany({
    where: { userId: session.id },
    orderBy: { lastMessageAt: 'desc' },
    take: 30,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  })

  const items = threads.map(t => ({
    id: t.id,
    title: t.title ?? 'Conversación',
    agent: t.agentName,
    channel: t.channel,
    escalated: t.escalatedToArea !== null,
    lastMessageAt: t.lastMessageAt.toISOString(),
    messageCount: t.messageCount,
    preview: t.messages[0]?.content.slice(0, 140) ?? '',
  }))

  return apiSuccess({ items })
})
