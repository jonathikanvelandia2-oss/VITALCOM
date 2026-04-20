import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

type Ctx = { params: Promise<{ id: string }> }

// ── PATCH /api/notifications/[id] ──────────────────────
// Marca una notificación como leída (solo del dueño).
// Body: { read: boolean }
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params
  const body = await req.json().catch(() => ({}))
  const read = typeof body.read === 'boolean' ? body.read : true

  const result = await prisma.notification.updateMany({
    where: { id, userId: session.id },
    data: { read },
  })

  if (result.count === 0) {
    throw new Error('NOT_FOUND')
  }

  return apiSuccess({ id, read })
})

// ── DELETE /api/notifications/[id] ─────────────────────
export const DELETE = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const result = await prisma.notification.deleteMany({
    where: { id, userId: session.id },
  })

  if (result.count === 0) {
    throw new Error('NOT_FOUND')
  }

  return apiSuccess({ deleted: true })
})
