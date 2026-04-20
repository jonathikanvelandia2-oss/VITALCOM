import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  objective: z.enum(['CONVERSIONS', 'TRAFFIC', 'AWARENESS', 'LEADS']).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ENDED']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

export const PATCH = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params
  const payload = await req.json()
  const data = patchSchema.parse(payload)

  const campaign = await prisma.adCampaign.findUnique({
    where: { id },
    include: { account: true },
  })
  if (!campaign || campaign.account.userId !== session.id) {
    return apiError('Campaña no encontrada', 404, 'NOT_FOUND')
  }

  const updated = await prisma.adCampaign.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.objective !== undefined ? { objective: data.objective } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate ? new Date(data.startDate) : null } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
    },
  })
  return apiSuccess({ id: updated.id, status: updated.status })
})

export const DELETE = withErrorHandler(async (_req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const campaign = await prisma.adCampaign.findUnique({
    where: { id },
    include: { account: true },
  })
  if (!campaign || campaign.account.userId !== session.id) {
    return apiError('Campaña no encontrada', 404, 'NOT_FOUND')
  }

  await prisma.adCampaign.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
