// V29 — GET /api/whatsapp/templates/ab-stats?accountId=x&variantGroup=y
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getVariantStats } from '@/lib/whatsapp/ab-testing'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const accountId = url.searchParams.get('accountId')
  const variantGroup = url.searchParams.get('variantGroup')

  if (!accountId || !variantGroup) {
    return apiError('accountId y variantGroup requeridos', 400, 'BAD_REQUEST')
  }

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: accountId, userId: session.id },
  })
  if (!account) return apiError('Cuenta no encontrada', 404, 'NOT_FOUND')

  const stats = await getVariantStats(accountId, variantGroup)
  return apiSuccess({ variantGroup, stats })
})
