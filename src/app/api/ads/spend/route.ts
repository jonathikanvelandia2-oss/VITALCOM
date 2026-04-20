import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ── GET /api/ads/spend ───────────────────────────────────
// Entradas de gasto. Filtros: ?accountId=&from=&to=&campaignId=
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const accountId = url.searchParams.get('accountId') || undefined
  const campaignId = url.searchParams.get('campaignId') || undefined
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100'), 1), 500)

  const entries = await prisma.adSpendEntry.findMany({
    where: {
      account: { userId: session.id, active: true },
      ...(accountId ? { accountId } : {}),
      ...(campaignId ? { campaignId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      account: { select: { platform: true, accountName: true, currency: true } },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })

  return apiSuccess({
    items: entries.map((e) => ({
      id: e.id,
      date: e.date,
      spend: e.spend,
      impressions: e.impressions,
      clicks: e.clicks,
      conversions: e.conversions,
      source: e.source,
      notes: e.notes,
      account: {
        id: e.accountId,
        platform: e.account.platform,
        name: e.account.accountName,
        currency: e.account.currency,
      },
      campaign: e.campaign,
    })),
  })
})

// ── POST /api/ads/spend ──────────────────────────────────
// Registra gasto de un día + auto-crea FinanceEntry (EGRESO/PUBLICIDAD).
// Ambas operaciones en una transacción para evitar inconsistencias.

const createSchema = z.object({
  accountId: z.string().min(1),
  campaignId: z.string().optional().nullable(),
  date: z.string(),
  spend: z.number().min(0),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createSchema.parse(body)

  const account = await prisma.adAccount.findUnique({ where: { id: data.accountId } })
  if (!account || account.userId !== session.id) {
    return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')
  }

  if (data.campaignId) {
    const campaign = await prisma.adCampaign.findUnique({ where: { id: data.campaignId } })
    if (!campaign || campaign.accountId !== account.id) {
      return apiError('Campaña no pertenece a la cuenta', 400, 'INVALID_CAMPAIGN')
    }
  }

  const spendDate = new Date(data.date)
  const platformLabel =
    account.platform === 'META'   ? 'Meta Ads'
    : account.platform === 'TIKTOK' ? 'TikTok Ads'
    : account.platform === 'GOOGLE' ? 'Google Ads'
    : 'Publicidad'
  const description = `${platformLabel}${account.accountName ? ` · ${account.accountName}` : ''}${data.notes ? ` — ${data.notes}` : ''}`

  const [entry] = await prisma.$transaction(async (tx) => {
    const financeEntry = await tx.financeEntry.create({
      data: {
        userId: session.id,
        date: spendDate,
        type: 'EGRESO',
        category: 'PUBLICIDAD',
        amount: data.spend,
        currency: account.currency,
        description,
        source: 'AD_SPEND',
        metadata: {
          adAccountId: account.id,
          platform: account.platform,
          campaignId: data.campaignId ?? null,
        },
      },
    })

    const spendEntry = await tx.adSpendEntry.create({
      data: {
        accountId: account.id,
        campaignId: data.campaignId ?? null,
        date: spendDate,
        spend: data.spend,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        source: 'MANUAL',
        notes: data.notes,
        financeEntryId: financeEntry.id,
      },
    })

    return [spendEntry]
  })

  return apiSuccess(
    {
      id: entry.id,
      date: entry.date,
      spend: entry.spend,
      financeEntryId: entry.financeEntryId,
    },
    201,
  )
})
