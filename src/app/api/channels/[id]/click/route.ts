// V38 — POST /api/channels/[id]/click
// Registra un click para analytics. Non-blocking: el cliente ya saltó al
// WhatsApp, esto solo deja registro. Respetamos rate limit para evitar
// que un bot llene la tabla.

import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { guardRateLimit } from '@/lib/security/rate-limit'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  // Anti-spam: 30 clicks por 10s por user (suficiente para UX real).
  const blocked = guardRateLimit(
    `ch-click:${session.id}`,
    { maxRequests: 30, windowMs: 10_000 },
    'Demasiados clicks · espera un momento',
  )
  if (blocked) return blocked

  const channel = await prisma.vitalcomChannel.findUnique({
    where: { id },
    select: { id: true, active: true },
  })
  if (!channel || !channel.active) {
    return apiError('Canal no encontrado', 404, 'NOT_FOUND')
  }

  // Metadata liviana — user agent truncado, sin IP.
  const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? null
  const referrer = req.headers.get('referer')?.slice(0, 500) ?? null

  await prisma.channelClick.create({
    data: {
      channelId: id,
      userId: session.id,
      userAgent,
      referrer,
    },
  })

  return apiSuccess({ logged: true })
})
