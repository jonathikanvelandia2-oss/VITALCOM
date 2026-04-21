// V29 — GET/PATCH/DELETE /api/whatsapp/templates/[id]
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { WaTemplateStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const STATUS_VALUES = Object.values(WaTemplateStatus) as [string, ...string[]]

const patchSchema = z.object({
  bodyText: z.string().min(1).max(2000).optional(),
  headerType: z.string().optional(),
  headerContent: z.string().optional(),
  footerText: z.string().optional(),
  buttons: z.array(z.object({
    type: z.enum(['QUICK_REPLY', 'URL']),
    text: z.string(),
    url: z.string().optional(),
  })).optional(),
  variantGroup: z.string().nullable().optional(),
  weight: z.number().min(0).optional(),
  fallbackTemplateId: z.string().nullable().optional(),
  status: z.enum(STATUS_VALUES).optional(),
  metaTemplateId: z.string().optional(),
  rejectionReason: z.string().optional(),
})

async function getTemplateWithAuth(templateId: string, userId: string) {
  return prisma.whatsappTemplate.findFirst({
    where: { id: templateId, account: { userId } },
  })
}

export const GET = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const template = await getTemplateWithAuth(ctx.params.id, session.id)
  if (!template) return apiError('Template no encontrado', 404, 'NOT_FOUND')
  return apiSuccess(template)
})

export const PATCH = withErrorHandler(async (req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const template = await getTemplateWithAuth(ctx.params.id, session.id)
  if (!template) return apiError('Template no encontrado', 404, 'NOT_FOUND')

  const body = await req.json()
  const data = patchSchema.parse(body)

  const updated = await prisma.whatsappTemplate.update({
    where: { id: ctx.params.id },
    data: {
      ...(data.bodyText !== undefined && { bodyText: data.bodyText }),
      ...(data.headerType !== undefined && { headerType: data.headerType }),
      ...(data.headerContent !== undefined && { headerContent: data.headerContent }),
      ...(data.footerText !== undefined && { footerText: data.footerText }),
      ...(data.buttons !== undefined && { buttons: data.buttons as never }),
      ...(data.variantGroup !== undefined && { variantGroup: data.variantGroup }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.fallbackTemplateId !== undefined && { fallbackTemplateId: data.fallbackTemplateId }),
      ...(data.status !== undefined && { status: data.status as WaTemplateStatus }),
      ...(data.metaTemplateId !== undefined && { metaTemplateId: data.metaTemplateId }),
      ...(data.rejectionReason !== undefined && { rejectionReason: data.rejectionReason }),
    },
  })

  return apiSuccess({ id: updated.id })
})

export const DELETE = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const template = await getTemplateWithAuth(ctx.params.id, session.id)
  if (!template) return apiError('Template no encontrado', 404, 'NOT_FOUND')

  await prisma.whatsappTemplate.delete({ where: { id: ctx.params.id } })
  return apiSuccess({ deleted: true })
})
