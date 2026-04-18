import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { FinanceRepository } from '@/lib/repositories/finance-repository'
import { createEntrySchema, entryFiltersSchema } from '@/lib/api/schemas/finance'

// ── GET /api/finance/entries — lista de movimientos ─────
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const filters = entryFiltersSchema.parse(Object.fromEntries(url.searchParams))

  const entries = await FinanceRepository.listEntries(session.id, filters)
  return apiSuccess({ entries })
})

// ── POST /api/finance/entries — registrar movimiento ────
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createEntrySchema.parse(body)

  const entry = await FinanceRepository.createEntry({
    userId: session.id,
    type: data.type,
    category: data.category,
    amount: data.amount,
    date: data.date ? new Date(data.date) : undefined,
    currency: data.currency,
    description: data.description,
    source: 'MANUAL',
  })

  return apiSuccess(entry, 201)
})
