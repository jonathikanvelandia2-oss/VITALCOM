import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  accountName: z.string().max(120).optional(),
  currency: z.string().length(3).optional(),
  active: z.boolean().optional(),
})

// ── PATCH /api/ads/accounts/[id] ─────────────────────────
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params
  const payload = await req.json()
  const data = patchSchema.parse(payload)

  const existing = await prisma.adAccount.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.id) {
    return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')
  }

  const updated = await prisma.adAccount.update({ where: { id }, data })
  return apiSuccess({ id: updated.id, accountName: updated.accountName, active: updated.active })
})

// ── DELETE /api/ads/accounts/[id] ────────────────────────
// Soft-delete: marca inactive. Los FinanceEntries ya creados se preservan.
export const DELETE = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const existing = await prisma.adAccount.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.id) {
    return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')
  }

  await prisma.adAccount.update({ where: { id }, data: { active: false } })
  return apiSuccess({ deactivated: true })
})
