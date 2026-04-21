// V29 — GET/POST /api/whatsapp/templates
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { WaTemplateCategory, WaTemplateStatus } from '@prisma/client'
import { ensureMarketingOptOut } from '@/lib/whatsapp/opt-out'

export const dynamic = 'force-dynamic'

const CATEGORY_VALUES = Object.values(WaTemplateCategory) as [string, ...string[]]
const STATUS_VALUES = Object.values(WaTemplateStatus) as [string, ...string[]]

const createSchema = z.object({
  accountId: z.string().min(1),
  metaName: z.string().min(2).max(80),
  category: z.enum(CATEGORY_VALUES),
  language: z.string().min(2).max(10).default('es_CO'),
  purpose: z.string().min(2).max(60),
  bodyText: z.string().min(1).max(2000),
  headerType: z.string().optional(),
  headerContent: z.string().optional(),
  footerText: z.string().optional(),
  buttons: z.array(z.object({
    type: z.enum(['QUICK_REPLY', 'URL']),
    text: z.string(),
    url: z.string().optional(),
  })).optional(),
  variables: z.array(z.object({
    placeholder: z.string(),
    name: z.string(),
    source: z.string().optional(),
  })).optional(),
  variantGroup: z.string().optional(),
  weight: z.number().min(0).default(1),
  fallbackTemplateId: z.string().optional(),
  status: z.enum(STATUS_VALUES).default('DRAFT'),
})

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const accountId = url.searchParams.get('accountId')

  if (!accountId) return apiError('accountId requerido', 400, 'BAD_REQUEST')

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: accountId, userId: session.id },
  })
  if (!account) return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')

  const templates = await prisma.whatsappTemplate.findMany({
    where: { accountId },
    orderBy: [{ purpose: 'asc' }, { metaName: 'asc' }],
  })

  return apiSuccess({
    items: templates.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
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

  // V30.1 — Meta exige opt-out en MARKETING. Auto-append si falta.
  let finalBody = data.bodyText
  let finalFooter = data.footerText
  let optOutInjected = false
  let optOutTarget: 'footer' | 'body' | 'none' = 'none'

  if (data.category === WaTemplateCategory.MARKETING) {
    const fixed = ensureMarketingOptOut({
      bodyText: data.bodyText,
      footerText: data.footerText,
    })
    finalBody = fixed.bodyText
    finalFooter = fixed.footerText ?? undefined
    optOutInjected = fixed.modified
    optOutTarget = fixed.target
  }

  const template = await prisma.whatsappTemplate.create({
    data: {
      accountId: data.accountId,
      metaName: data.metaName,
      category: data.category as WaTemplateCategory,
      language: data.language,
      purpose: data.purpose,
      bodyText: finalBody,
      headerType: data.headerType,
      headerContent: data.headerContent,
      footerText: finalFooter,
      buttons: data.buttons as never,
      variables: data.variables as never,
      variantGroup: data.variantGroup,
      weight: data.weight,
      fallbackTemplateId: data.fallbackTemplateId,
      status: data.status as WaTemplateStatus,
    },
  })

  return apiSuccess({
    id: template.id,
    optOutInjected,
    optOutTarget,
  }, 201)
})
