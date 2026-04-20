import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ── GET /api/ads/accounts ────────────────────────────────
// Cuentas publicitarias del usuario (manual + OAuth cuando lleguen).

export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const accounts = await prisma.adAccount.findMany({
    where: { userId: session.id, active: true },
    include: {
      _count: { select: { campaigns: true, spendEntries: true } },
    },
    orderBy: [{ connected: 'desc' }, { createdAt: 'asc' }],
  })

  const totals = await prisma.adSpendEntry.groupBy({
    by: ['accountId'],
    where: { account: { userId: session.id, active: true } },
    _sum: { spend: true, clicks: true, conversions: true },
  })
  const totalsMap = new Map(totals.map((t) => [t.accountId, t]))

  return apiSuccess({
    items: accounts.map((a) => {
      const stats = totalsMap.get(a.id)
      return {
        id: a.id,
        platform: a.platform,
        accountId: a.accountId,
        accountName: a.accountName,
        currency: a.currency,
        connected: a.connected,
        lastSyncAt: a.lastSyncAt,
        campaignCount: a._count.campaigns,
        spendCount: a._count.spendEntries,
        totalSpend: stats?._sum.spend ?? 0,
        totalClicks: stats?._sum.clicks ?? 0,
        totalConversions: stats?._sum.conversions ?? 0,
        createdAt: a.createdAt,
      }
    }),
  })
})

// ── POST /api/ads/accounts ───────────────────────────────
// Crear cuenta (modo manual por ahora; OAuth en futuro).

const createSchema = z.object({
  platform: z.enum(['META', 'TIKTOK', 'GOOGLE', 'OTHER']),
  accountId: z.string().min(1).max(120),
  accountName: z.string().max(120).optional(),
  currency: z.string().length(3).default('COP'),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createSchema.parse(body)

  try {
    const account = await prisma.adAccount.create({
      data: {
        userId: session.id,
        platform: data.platform,
        accountId: data.accountId,
        accountName: data.accountName,
        currency: data.currency,
        connected: false,
      },
    })
    return apiSuccess({ id: account.id, platform: account.platform, accountName: account.accountName }, 201)
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return apiError('Ya tienes una cuenta con ese ID en esa plataforma', 409, 'DUPLICATE')
    }
    throw err
  }
})
