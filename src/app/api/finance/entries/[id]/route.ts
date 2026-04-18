import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { FinanceRepository } from '@/lib/repositories/finance-repository'
import { updateEntrySchema } from '@/lib/api/schemas/finance'
import { prisma } from '@/lib/db/prisma'

type Ctx = { params: Promise<{ id: string }> }

// ── PATCH /api/finance/entries/[id] — editar movimiento ──
export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const existing = await prisma.financeEntry.findUnique({ where: { id }, select: { userId: true, source: true } })
  if (!existing) throw new Error('NOT_FOUND')
  if (existing.userId !== session.id) throw new Error('FORBIDDEN')
  if (existing.source !== 'MANUAL') {
    // Movimientos automáticos no se editan — el origen es la orden
    throw new Error('FORBIDDEN')
  }

  const body = await req.json()
  const data = updateEntrySchema.parse(body)

  const updated = await FinanceRepository.updateEntry(id, session.id, {
    userId: session.id,
    type: data.type!,
    category: data.category!,
    amount: data.amount!,
    date: data.date ? new Date(data.date) : undefined,
    currency: data.currency,
    description: data.description,
  })

  return apiSuccess(updated)
})

// ── DELETE /api/finance/entries/[id] — eliminar movimiento ──
export const DELETE = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const existing = await prisma.financeEntry.findUnique({ where: { id }, select: { userId: true, source: true } })
  if (!existing) throw new Error('NOT_FOUND')
  if (existing.userId !== session.id) throw new Error('FORBIDDEN')
  if (existing.source !== 'MANUAL') throw new Error('FORBIDDEN')

  await FinanceRepository.deleteEntry(id, session.id)
  return apiSuccess({ id, deleted: true })
})
