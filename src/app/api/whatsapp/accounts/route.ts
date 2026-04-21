// V27 — GET/POST /api/whatsapp/accounts
// Cada VITALCOMMER puede tener N cuentas WhatsApp (multi-tienda)
import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(2).max(80),
  phoneNumberId: z.string().min(1),
  wabaId: z.string().min(1),
  displayPhone: z.string().min(5),
  accessToken: z.string().min(10),
  businessName: z.string().optional(),
  logoUrl: z.string().url().optional(),
})

export const GET = withErrorHandler(async () => {
  const session = await requireSession()
  const accounts = await prisma.whatsappAccount.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { templates: true, conversations: true, workflows: true, contacts: true },
      },
    },
  })

  return apiSuccess({
    items: accounts.map(a => ({
      id: a.id,
      name: a.name,
      displayPhone: a.displayPhone,
      phoneNumberId: a.phoneNumberId,
      wabaId: a.wabaId,
      quality: a.quality,
      messagingLimit: a.messagingLimit,
      isActive: a.isActive,
      businessName: a.businessName,
      logoUrl: a.logoUrl,
      templatesCount: a._count.templates,
      conversationsCount: a._count.conversations,
      workflowsCount: a._count.workflows,
      contactsCount: a._count.contacts,
      webhookVerifyToken: a.webhookVerifyToken,
      createdAt: a.createdAt.toISOString(),
    })),
  })
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createSchema.parse(body)

  const account = await prisma.whatsappAccount.create({
    data: {
      userId: session.id,
      name: data.name,
      phoneNumberId: data.phoneNumberId,
      wabaId: data.wabaId,
      displayPhone: data.displayPhone,
      accessToken: data.accessToken,
      businessName: data.businessName,
      logoUrl: data.logoUrl,
      webhookVerifyToken: crypto.randomBytes(24).toString('hex'),
    },
  })

  return apiSuccess({ id: account.id, webhookVerifyToken: account.webhookVerifyToken }, 201)
})
