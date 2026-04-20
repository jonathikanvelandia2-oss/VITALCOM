import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

// ── DELETE /api/ads/spend/[id] ───────────────────────────
// Borra el spend + el FinanceEntry vinculado.
export const DELETE = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const entry = await prisma.adSpendEntry.findUnique({
    where: { id },
    include: { account: true },
  })
  if (!entry || entry.account.userId !== session.id) {
    return apiError('Gasto no encontrado', 404, 'NOT_FOUND')
  }

  await prisma.$transaction(async (tx) => {
    await tx.adSpendEntry.delete({ where: { id } })
    if (entry.financeEntryId) {
      await tx.financeEntry.delete({ where: { id: entry.financeEntryId } }).catch(() => {})
    }
  })

  return apiSuccess({ deleted: true })
})
