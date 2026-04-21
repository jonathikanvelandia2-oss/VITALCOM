// V29 — POST /api/whatsapp/broadcasts/[id]/execute
// Prepara recipients (si no hay) + ejecuta envío en background
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { prepareBroadcast, executeBroadcast } from '@/lib/whatsapp/broadcast-runner'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export const POST = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()

  const broadcast = await prisma.whatsappBroadcast.findFirst({
    where: { id: ctx.params.id, account: { userId: session.id } },
  })
  if (!broadcast) return apiError('Broadcast no encontrado', 404, 'NOT_FOUND')
  if (broadcast.status === 'RUNNING' || broadcast.status === 'COMPLETED') {
    return apiError(`Broadcast ya está ${broadcast.status.toLowerCase()}`, 409, 'CONFLICT')
  }

  // Si no tiene recipients, prepararlos ahora
  if (broadcast.totalRecipients === 0) {
    await prepareBroadcast(ctx.params.id)
  }

  // Ejecutar en background (no bloquea la respuesta)
  executeBroadcast(ctx.params.id).catch(err => {
    console.error(`[broadcast:execute] ${ctx.params.id}:`, err)
  })

  return apiSuccess({ started: true, broadcastId: ctx.params.id })
})
