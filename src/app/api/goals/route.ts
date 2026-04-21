import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { setGoal } from '@/lib/goals/helpers'

export const dynamic = 'force-dynamic'

const schema = z.object({
  targetRevenue: z.number().min(100_000).max(1_000_000_000),    // 100k a 1.000M COP
  targetOrders: z.number().int().min(1).max(10_000).optional(),
  targetMargin: z.number().min(0).max(100).optional(),
  stretchRevenue: z.number().min(100_000).max(2_000_000_000).optional(),
})

// POST /api/goals — upsert meta del mes vigente
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = schema.parse(await req.json())
  const goal = await setGoal(session.id, body)
  return apiSuccess(goal)
})
