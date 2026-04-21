// V29 — POST /api/whatsapp/broadcasts/preview
// Cuenta cuántos contactos matchean el filtro sin crear nada
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { resolveRecipients } from '@/lib/whatsapp/broadcast-runner'

export const dynamic = 'force-dynamic'

const schema = z.object({
  accountId: z.string().min(1),
  segmentFilter: z.object({
    segment: z.string().optional(),
    tags: z.array(z.string()).optional(),
    country: z.string().optional(),
    minLtv: z.number().optional(),
    excludeTags: z.array(z.string()).optional(),
    onlyOptedIn: z.boolean().default(true),
  }),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = schema.parse(body)

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: data.accountId, userId: session.id },
  })
  if (!account) return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')

  const recipients = await resolveRecipients(data.accountId, data.segmentFilter)

  return apiSuccess({
    total: recipients.length,
    sample: recipients.slice(0, 5).map(r => ({
      firstName: r.firstName,
      phoneMasked: r.phoneE164.replace(/(\+\d{3})\d{6}(\d{2})/, '$1******$2'),
    })),
  })
})
