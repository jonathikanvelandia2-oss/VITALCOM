// V26 — POST /api/ai/chat
// Entrada unificada al sistema IA. Orquesta clasificación +
// contexto + LLM + escalación. Ver src/lib/ai/orchestrator.ts

import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { orchestrate } from '@/lib/ai/orchestrator'
import { ChatAgent } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CHAT_AGENTS = Object.values(ChatAgent) as [string, ...string[]]

const schema = z.object({
  message: z.string().min(1).max(2000),
  threadId: z.string().optional(),
  forceAgent: z.enum(CHAT_AGENTS).optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const { message, threadId, forceAgent } = schema.parse(body)

  const result = await orchestrate({
    userId: session.id,
    userMessage: message,
    threadId,
    forceAgent: forceAgent as ChatAgent | undefined,
    channel: 'WEB',
  })

  return apiSuccess(result)
})
