import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { FinanceRepository } from '@/lib/repositories/finance-repository'
import { periodSchema } from '@/lib/api/schemas/finance'

// ── GET /api/finance/pnl — P&L del dropshipper ──────────
// Retorna: summary + timeseries + profitability by product
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const period = periodSchema.parse(url.searchParams.get('period') ?? '30d')
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30

  const [summary, timeseries, profitability] = await Promise.all([
    FinanceRepository.getPnL(session.id, period),
    FinanceRepository.getTimeseries(session.id, days),
    FinanceRepository.getProfitability(session.id, period, 10),
  ])

  return apiSuccess({ summary, timeseries, profitability })
})
