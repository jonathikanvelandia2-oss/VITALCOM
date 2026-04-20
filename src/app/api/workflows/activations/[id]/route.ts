import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// ── PATCH /api/workflows/activations/[id] ────────────────
// Toggle pausa / retomar. Body: { status: 'ACTIVE' | 'PAUSED' }

const patchSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED']),
})

export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params
  const payload = await req.json()
  const { status } = patchSchema.parse(payload)

  const existing = await prisma.userWorkflowActivation.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.id) {
    return apiError('Activación no encontrada', 404, 'NOT_FOUND')
  }

  const updated = await prisma.userWorkflowActivation.update({
    where: { id },
    data: { status },
  })

  return apiSuccess({ id: updated.id, status: updated.status })
})

// ── DELETE /api/workflows/activations/[id] ───────────────
export const DELETE = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const existing = await prisma.userWorkflowActivation.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.id) {
    return apiError('Activación no encontrada', 404, 'NOT_FOUND')
  }

  await prisma.userWorkflowActivation.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
