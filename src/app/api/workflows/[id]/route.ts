// V27 — GET/PATCH/DELETE /api/workflows/[id]
import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  isActive: z.boolean().optional(),
  useAiAdaptation: z.boolean().optional(),
  usePersonalization: z.boolean().optional(),
  triggerConfig: z.record(z.unknown()).optional(),
  steps: z.array(z.object({
    id: z.string(),
    type: z.string(),
    config: z.record(z.unknown()).default({}),
    nextOnSuccess: z.string().optional(),
    nextOnFail: z.string().optional(),
    nextOnBranch: z.record(z.string()).optional(),
  })).optional(),
})

export const GET = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const workflow = await prisma.waWorkflow.findFirst({
    where: { id: ctx.params.id, userId: session.id },
    include: {
      account: { select: { id: true, name: true, displayPhone: true } },
      executions: {
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: {
          id: true, status: true, currentStepId: true, outcomeType: true,
          startedAt: true, completedAt: true,
        },
      },
    },
  })
  if (!workflow) return apiError('Workflow no encontrado', 404, 'NOT_FOUND')

  return apiSuccess({
    ...workflow,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
    executions: workflow.executions.map(e => ({
      ...e,
      startedAt: e.startedAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
    })),
  })
})

export const PATCH = withErrorHandler(async (req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()

  const existing = await prisma.waWorkflow.findFirst({
    where: { id: ctx.params.id, userId: session.id },
  })
  if (!existing) return apiError('Workflow no encontrado', 404, 'NOT_FOUND')

  const body = await req.json()
  const data = patchSchema.parse(body)

  const updated = await prisma.waWorkflow.update({
    where: { id: ctx.params.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.useAiAdaptation !== undefined && { useAiAdaptation: data.useAiAdaptation }),
      ...(data.usePersonalization !== undefined && { usePersonalization: data.usePersonalization }),
      ...(data.triggerConfig !== undefined && { triggerConfig: data.triggerConfig as object }),
      ...(data.steps !== undefined && { steps: data.steps as unknown as object }),
    },
  })

  return apiSuccess({ id: updated.id })
})

export const DELETE = withErrorHandler(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = await requireSession()
  const existing = await prisma.waWorkflow.findFirst({
    where: { id: ctx.params.id, userId: session.id },
  })
  if (!existing) return apiError('Workflow no encontrado', 404, 'NOT_FOUND')

  await prisma.waWorkflow.delete({ where: { id: ctx.params.id } })
  return apiSuccess({ deleted: true })
})
