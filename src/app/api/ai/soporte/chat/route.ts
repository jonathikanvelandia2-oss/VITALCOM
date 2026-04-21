import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { chatSoporteIA } from '@/lib/ai/agents/soporte-ia'

export const dynamic = 'force-dynamic'

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const { messages } = schema.parse(body)

  const reply = await chatSoporteIA(session.id, messages)
  return apiSuccess({ reply })
})
