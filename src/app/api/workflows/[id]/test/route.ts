// V27 — POST /api/workflows/[id]/test — ejecutar manualmente contra un contacto
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { startWorkflow } from '@/lib/flows/workflow-engine'

export const dynamic = 'force-dynamic'

const schema = z.object({
  contactId: z.string().min(1).optional(),
  phoneE164: z.string().regex(/^\+\d{10,15}$/).optional(),
  initialContext: z.record(z.unknown()).default({}),
})

export const POST = withErrorHandler(async (req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const body = await req.json()
  const data = schema.parse(body)

  const workflow = await prisma.waWorkflow.findFirst({
    where: { id: ctx.params.id, userId: session.id },
  })
  if (!workflow) return apiError('Workflow no encontrado', 404, 'NOT_FOUND')

  let contactId = data.contactId
  if (!contactId && data.phoneE164 && workflow.accountId) {
    const contact = await prisma.whatsappContact.upsert({
      where: {
        accountId_phoneE164: {
          accountId: workflow.accountId,
          phoneE164: data.phoneE164,
        },
      },
      create: {
        accountId: workflow.accountId,
        phoneE164: data.phoneE164,
        firstName: 'Test',
      },
      update: {},
    })
    contactId = contact.id
  }

  if (!contactId) {
    return apiError('Se requiere contactId o phoneE164 + accountId en el workflow', 400, 'BAD_REQUEST')
  }

  const executionId = await startWorkflow({
    workflowId: ctx.params.id,
    contactId,
    initialContext: {
      ...data.initialContext,
      test: true,
    },
  })

  return apiSuccess({ executionId })
})
