// V26 — POST /api/admin/escalations/[id]/resolve
// Cierra un ticket y opcionalmente envía respuesta al usuario.

import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { resolveTicket } from '@/lib/ai/escalate'

export const dynamic = 'force-dynamic'

const schema = z.object({
  resolution: z.string().min(5).max(1000),
  replyToUser: z.string().max(2000).optional(),
})

export const POST = withErrorHandler(async (req: Request, ctx: { params: { id: string } }) => {
  const session = await requireRole('EMPLOYEE')
  const body = await req.json()
  const { resolution, replyToUser } = schema.parse(body)

  await resolveTicket({
    ticketId: ctx.params.id,
    resolvedBy: session.id,
    resolution,
    replyToUser,
  })

  return apiSuccess({ resolved: true, ticketId: ctx.params.id })
})
