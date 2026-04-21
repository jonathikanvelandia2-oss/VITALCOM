import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { revertAppliedAction, isRevertibleType } from '@/lib/ai/revert-action'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/history/[id]/revert ────────────────────
// Revierte una acción aplicada: reactiva campaña pausada, restaura
// precio al original, quita bestseller, reactiva producto desactivado.
// El AppliedAction queda marcado con revertedAt + revertSideEffect.

export const POST = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params

  const action = await prisma.appliedAction.findFirst({
    where: { id, userId: session.id },
  })

  if (!action) return apiError('Acción no encontrada', 404, 'NOT_FOUND')
  if (action.revertedAt) return apiError('Esta acción ya fue revertida', 409, 'ALREADY_REVERTED')
  if (!isRevertibleType(action.actionType)) {
    return apiError(
      `El tipo ${action.actionType} no tiene un revert automático — marcada como anulada.`,
      400,
      'NOT_REVERTIBLE',
    )
  }

  const result = await revertAppliedAction(action)

  const updated = await prisma.appliedAction.findUnique({ where: { id } })

  return apiSuccess({
    reverted: updated,
    result,
  })
})
