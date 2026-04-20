import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ── GET /api/ads/campaigns ───────────────────────────────
// Lista de campañas. Opcional filtrar por ?accountId=
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const accountId = url.searchParams.get('accountId') || undefined

  const campaigns = await prisma.adCampaign.findMany({
    where: {
      account: { userId: session.id, active: true },
      ...(accountId ? { accountId } : {}),
    },
    include: {
      account: { select: { platform: true, accountName: true } },
      _count: { select: { spendEntries: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totals = await prisma.adSpendEntry.groupBy({
    by: ['campaignId'],
    where: {
      campaignId: { not: null },
      account: { userId: session.id, active: true },
    },
    _sum: { spend: true, clicks: true, conversions: true },
  })
  const totalsMap = new Map(totals.map((t) => [t.campaignId!, t]))

  return apiSuccess({
    items: campaigns.map((c) => {
      const stats = totalsMap.get(c.id)
      return {
        id: c.id,
        accountId: c.accountId,
        accountPlatform: c.account.platform,
        accountName: c.account.accountName,
        name: c.name,
        objective: c.objective,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        totalSpend: stats?._sum.spend ?? 0,
        totalClicks: stats?._sum.clicks ?? 0,
        totalConversions: stats?._sum.conversions ?? 0,
      }
    }),
  })
})

// ── POST /api/ads/campaigns ──────────────────────────────
const createSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().min(1).max(200),
  objective: z.enum(['CONVERSIONS', 'TRAFFIC', 'AWARENESS', 'LEADS']).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ENDED']).default('ACTIVE'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createSchema.parse(body)

  const account = await prisma.adAccount.findUnique({ where: { id: data.accountId } })
  if (!account || account.userId !== session.id) {
    return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')
  }

  const campaign = await prisma.adCampaign.create({
    data: {
      accountId: data.accountId,
      name: data.name,
      objective: data.objective,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  })
  return apiSuccess({ id: campaign.id, name: campaign.name }, 201)
})
