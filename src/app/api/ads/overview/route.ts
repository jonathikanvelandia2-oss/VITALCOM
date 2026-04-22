import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/ads/overview ────────────────────────────────
// KPIs de publicidad + ROAS calculado cruzando con Order.
// Periodo por defecto: últimos 30 días. Query: ?days=7|30|90

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30'), 1), 365)
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Gasto total del periodo (todas las cuentas del user)
  const [spendAgg, perPlatform, spendSeries, recentSpend] = await Promise.all([
    prisma.adSpendEntry.aggregate({
      where: {
        account: { userId: session.id, active: true },
        date: { gte: start },
      },
      _sum: { spend: true, clicks: true, conversions: true, impressions: true },
      _count: true,
    }),
    prisma.adSpendEntry.groupBy({
      by: ['accountId'],
      where: {
        account: { userId: session.id, active: true },
        date: { gte: start },
      },
      _sum: { spend: true, clicks: true, conversions: true },
    }),
    // Serie diaria últimos N días (tipado con groupBy en lugar de $queryRaw)
    prisma.adSpendEntry.groupBy({
      by: ['date'],
      where: {
        account: { userId: session.id, active: true },
        date: { gte: start },
      },
      _sum: { spend: true },
      orderBy: { date: 'asc' },
    }),
    // Ingresos de órdenes (entregadas) del periodo — para ROAS
    prisma.order.aggregate({
      where: {
        userId: session.id,
        status: { in: ['DELIVERED', 'DISPATCHED'] },
        createdAt: { gte: start },
      },
      _sum: { total: true },
      _count: true,
    }),
  ])

  // Mapa plataforma -> datos
  const accounts = await prisma.adAccount.findMany({
    where: { userId: session.id, active: true },
    select: { id: true, platform: true, accountName: true },
  })
  const byAccountId = new Map(accounts.map((a) => [a.id, a]))

  const platformMap = new Map<string, { spend: number; clicks: number; conversions: number }>()
  for (const p of perPlatform) {
    const acc = byAccountId.get(p.accountId)
    if (!acc) continue
    const cur = platformMap.get(acc.platform) ?? { spend: 0, clicks: 0, conversions: 0 }
    cur.spend += p._sum.spend ?? 0
    cur.clicks += p._sum.clicks ?? 0
    cur.conversions += p._sum.conversions ?? 0
    platformMap.set(acc.platform, cur)
  }

  const totalSpend = spendAgg._sum.spend ?? 0
  const totalClicks = spendAgg._sum.clicks ?? 0
  const totalImpressions = spendAgg._sum.impressions ?? 0
  const totalConversions = spendAgg._sum.conversions ?? 0
  const totalRevenue = recentSpend._sum.total ?? 0
  const orderCount = recentSpend._count ?? 0

  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0

  return apiSuccess({
    period: { days, from: start.toISOString() },
    kpis: {
      totalSpend,
      totalClicks,
      totalImpressions,
      totalConversions,
      totalRevenue,
      orderCount,
      roas,
      cpc,
      ctr,
      cpa,
    },
    byPlatform: Array.from(platformMap.entries()).map(([platform, v]) => ({
      platform,
      spend: v.spend,
      clicks: v.clicks,
      conversions: v.conversions,
      share: totalSpend > 0 ? (v.spend / totalSpend) * 100 : 0,
    })),
    dailySpend: spendSeries.map((r) => ({
      day: r.date,
      spend: r._sum.spend ?? 0,
    })),
  })
})
