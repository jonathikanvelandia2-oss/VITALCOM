// V29 — GET/POST /api/whatsapp/broadcasts
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().min(3).max(120),
  templateName: z.string().min(2),
  languageCode: z.string().default('es_CO'),
  bodyVariables: z.array(z.string()).optional(),
  headerVariables: z.array(z.object({
    type: z.enum(['text', 'image', 'video', 'document']),
    value: z.string(),
  })).optional(),
  segmentFilter: z.object({
    segment: z.string().optional(),
    tags: z.array(z.string()).optional(),
    country: z.string().optional(),
    minLtv: z.number().optional(),
    excludeTags: z.array(z.string()).optional(),
    onlyOptedIn: z.boolean().default(true),
  }),
  scheduledFor: z.string().datetime().optional(),
  variantGroup: z.string().optional(),
})

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const accountId = url.searchParams.get('accountId')

  const broadcasts = await prisma.whatsappBroadcast.findMany({
    where: {
      account: { userId: session.id },
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      account: { select: { id: true, name: true, displayPhone: true } },
    },
  })

  return apiSuccess({
    items: broadcasts.map(b => ({
      id: b.id,
      name: b.name,
      templateName: b.templateName,
      status: b.status,
      totalRecipients: b.totalRecipients,
      sentCount: b.sentCount,
      failedCount: b.failedCount,
      variantGroup: b.variantGroup,
      scheduledFor: b.scheduledFor?.toISOString() ?? null,
      startedAt: b.startedAt?.toISOString() ?? null,
      completedAt: b.completedAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
      account: b.account,
    })),
  })
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createSchema.parse(body)

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: data.accountId, userId: session.id },
  })
  if (!account) return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')

  const broadcast = await prisma.whatsappBroadcast.create({
    data: {
      accountId: data.accountId,
      name: data.name,
      templateName: data.templateName,
      languageCode: data.languageCode,
      bodyVariables: data.bodyVariables as never,
      headerVariables: data.headerVariables as never,
      segmentFilter: data.segmentFilter as object,
      variantGroup: data.variantGroup,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      status: data.scheduledFor ? 'SCHEDULED' : 'DRAFT',
      createdBy: session.id,
    },
  })

  return apiSuccess({ id: broadcast.id }, 201)
})
