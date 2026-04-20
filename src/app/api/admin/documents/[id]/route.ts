import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// ── DELETE /api/admin/documents/[id] ─────────────────────
export const DELETE = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) return apiError('Documento no encontrado', 404, 'NOT_FOUND')

  await prisma.document.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
