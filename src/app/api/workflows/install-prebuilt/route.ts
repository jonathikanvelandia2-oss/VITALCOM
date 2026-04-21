// V27 — Instalar los 6 workflows pre-construidos en una cuenta WhatsApp
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { installPrebuiltWorkflows } from '@/lib/flows/prebuilt-workflows'

export const dynamic = 'force-dynamic'

const schema = z.object({
  accountId: z.string().min(1),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const { accountId } = schema.parse(body)

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: accountId, userId: session.id },
  })
  if (!account) return apiError('Cuenta WhatsApp no encontrada', 404, 'NOT_FOUND')

  const installed = await installPrebuiltWorkflows(session.id, accountId)
  return apiSuccess({ installed, total: installed.length })
})
