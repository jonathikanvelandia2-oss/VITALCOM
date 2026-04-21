// V30 — POST /api/whatsapp/templates/sync
// ═══════════════════════════════════════════════════════════
// Trae plantillas aprobadas desde Meta Graph API y las upserta
// localmente. En MOCK devuelve un set sintético.
//
// Body: { accountId: string }

import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { fetchMetaTemplates, extractTemplateContent } from '@/lib/whatsapp/meta-graph'
import { WaTemplateCategory, WaTemplateStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const schema = z.object({
  accountId: z.string().min(1),
})

function mapStatus(metaStatus: string): WaTemplateStatus {
  switch (metaStatus) {
    case 'APPROVED':
      return WaTemplateStatus.APPROVED
    case 'PENDING':
      return WaTemplateStatus.SUBMITTED
    case 'REJECTED':
      return WaTemplateStatus.REJECTED
    case 'DISABLED':
    case 'PAUSED':
      return WaTemplateStatus.DISABLED
    default:
      return WaTemplateStatus.DRAFT
  }
}

function mapCategory(metaCat: string): WaTemplateCategory {
  switch (metaCat) {
    case 'MARKETING':
      return WaTemplateCategory.MARKETING
    case 'AUTHENTICATION':
      return WaTemplateCategory.AUTHENTICATION
    case 'UTILITY':
    default:
      return WaTemplateCategory.UTILITY
  }
}

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const { accountId } = schema.parse(await req.json())

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: accountId, userId: session.id },
  })
  if (!account) return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')

  const metaTemplates = await fetchMetaTemplates({
    wabaId: account.wabaId,
    accessToken: account.accessToken,
  })

  let created = 0
  let updated = 0

  for (const mt of metaTemplates) {
    const content = extractTemplateContent(mt.components)
    const category = mapCategory(mt.category)
    const status = mapStatus(mt.status)

    const existing = await prisma.whatsappTemplate.findUnique({
      where: {
        accountId_metaName_language: {
          accountId,
          metaName: mt.name,
          language: mt.language,
        },
      },
    })

    if (existing) {
      await prisma.whatsappTemplate.update({
        where: { id: existing.id },
        data: {
          category,
          status,
          headerType: content.headerType,
          headerContent: content.headerContent,
          bodyText: content.bodyText,
          footerText: content.footerText,
          buttons: content.buttons as never,
          metaTemplateId: mt.id,
          rejectionReason: mt.rejected_reason ?? null,
        },
      })
      updated++
    } else {
      await prisma.whatsappTemplate.create({
        data: {
          accountId,
          metaName: mt.name,
          category,
          language: mt.language,
          status,
          headerType: content.headerType,
          headerContent: content.headerContent,
          bodyText: content.bodyText,
          footerText: content.footerText,
          buttons: content.buttons as never,
          metaTemplateId: mt.id,
          rejectionReason: mt.rejected_reason ?? null,
          purpose: inferPurpose(mt.name),
        },
      })
      created++
    }
  }

  return apiSuccess({
    synced: metaTemplates.length,
    created,
    updated,
    mock: !process.env.META_APP_SECRET,
  })
})

function inferPurpose(name: string): string {
  const lower = name.toLowerCase()
  if (/confirm/.test(lower)) return 'order_confirmation'
  if (/carrito|abandon/.test(lower)) return 'abandoned_cart'
  if (/despacho|envio|shipped|ruta/.test(lower)) return 'shipped'
  if (/entrega|delivered/.test(lower)) return 'delivered'
  if (/bienvenida|welcome/.test(lower)) return 'welcome'
  if (/recuperac|recuperation/.test(lower)) return 'remarketing'
  return 'general'
}
