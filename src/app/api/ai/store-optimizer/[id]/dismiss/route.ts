import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandler(async (_req: Request, ctx: any) => {
  const session = await requireSession()
  const { id } = await ctx.params

  const rec = await prisma.storeOptimization.findFirst({
    where: { id, userId: session.id, status: 'PENDING' },
  })
  if (!rec) return apiError('Recomendación no encontrada', 404, 'NOT_FOUND')

  const updated = await prisma.storeOptimization.update({
    where: { id },
    data: { status: 'DISMISSED', dismissedAt: new Date() },
  })

  return apiSuccess(updated)
})
