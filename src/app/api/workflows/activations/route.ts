import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ── GET /api/workflows/activations ───────────────────────
// Flujos activados por el usuario (con su template asociado).

export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const activations = await prisma.userWorkflowActivation.findMany({
    where: { userId: session.id },
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          name: true,
          emoji: true,
          description: true,
          target: true,
          impact: true,
          steps: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return apiSuccess({
    items: activations.map((a) => ({
      id: a.id,
      status: a.status,
      executions: a.executions,
      successRate: a.executions > 0 ? Math.round((a.successCount / a.executions) * 100) : 0,
      lastRunAt: a.lastRunAt,
      template: a.template,
    })),
  })
})

// ── POST /api/workflows/activations ──────────────────────
// Activar una plantilla (idempotente por usuario+template).
// Body: { templateId: string }

const activateSchema = z.object({
  templateId: z.string().min(1),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const payload = await req.json()
  const { templateId } = activateSchema.parse(payload)

  const template = await prisma.workflowTemplate.findUnique({ where: { id: templateId } })
  if (!template) return apiError('Plantilla no encontrada', 404, 'NOT_FOUND')
  if (!template.isPublic && template.userId !== session.id) {
    return apiError('Sin acceso a esta plantilla', 403, 'FORBIDDEN')
  }

  const [activation] = await prisma.$transaction([
    prisma.userWorkflowActivation.upsert({
      where: { userId_templateId: { userId: session.id, templateId } },
      create: { userId: session.id, templateId, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    }),
    prisma.workflowTemplate.update({
      where: { id: templateId },
      data: { uses: { increment: 1 } },
    }),
  ])

  return apiSuccess({ id: activation.id, status: activation.status }, 201)
})
