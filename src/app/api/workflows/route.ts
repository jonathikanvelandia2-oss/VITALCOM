// V27 — GET /api/workflows — lista + POST crear nuevo workflow
import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { guardRateLimit } from '@/lib/security/rate-limit'
import { WaWorkflowTrigger } from '@prisma/client'

export const dynamic = 'force-dynamic'

const TRIGGER_VALUES = Object.values(WaWorkflowTrigger) as [string, ...string[]]

const createSchema = z.object({
  accountId: z.string().optional(),
  name: z.string().min(3).max(100),
  purpose: z.string().min(3).max(60),
  triggerType: z.enum(TRIGGER_VALUES),
  triggerConfig: z.record(z.unknown()),
  steps: z.array(z.object({
    id: z.string(),
    type: z.string(),
    config: z.record(z.unknown()).default({}),
    nextOnSuccess: z.string().optional(),
    nextOnFail: z.string().optional(),
    nextOnBranch: z.record(z.string()).optional(),
  })).min(1),
  useAiAdaptation: z.boolean().default(true),
  usePersonalization: z.boolean().default(true),
  isActive: z.boolean().default(true),
})

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const accountId = url.searchParams.get('accountId')

  const workflows = await prisma.waWorkflow.findMany({
    where: {
      userId: session.id,
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      account: { select: { id: true, name: true, displayPhone: true } },
      _count: { select: { executions: true } },
    },
  })

  return apiSuccess({
    items: workflows.map(wf => ({
      id: wf.id,
      name: wf.name,
      purpose: wf.purpose,
      triggerType: wf.triggerType,
      isActive: wf.isActive,
      useAiAdaptation: wf.useAiAdaptation,
      account: wf.account,
      timesExecuted: wf.timesExecuted,
      successCount: wf.successCount,
      failCount: wf.failCount,
      confidenceScore: wf.confidenceScore,
      stepsCount: Array.isArray(wf.steps) ? (wf.steps as unknown[]).length : 0,
      updatedAt: wf.updatedAt.toISOString(),
      totalExecutions: wf._count.executions,
    })),
  })
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  // 5 workflows nuevos / 10 min — suficiente para crear múltiples, protege de scripts
  const blocked = guardRateLimit(`workflows:create:${session.id}`, { maxRequests: 5, windowMs: 10 * 60_000 })
  if (blocked) return blocked

  const body = await req.json()
  const data = createSchema.parse(body)

  // Validar que accountId sea del usuario
  if (data.accountId) {
    const acc = await prisma.whatsappAccount.findFirst({
      where: { id: data.accountId, userId: session.id },
    })
    if (!acc) throw new Error('FORBIDDEN')
  }

  const workflow = await prisma.waWorkflow.create({
    data: {
      userId: session.id,
      accountId: data.accountId,
      name: data.name,
      purpose: data.purpose,
      triggerType: data.triggerType as WaWorkflowTrigger,
      triggerConfig: data.triggerConfig as object,
      steps: data.steps as unknown as object,
      isActive: data.isActive,
      useAiAdaptation: data.useAiAdaptation,
      usePersonalization: data.usePersonalization,
    },
  })

  return apiSuccess({ id: workflow.id }, 201)
})
