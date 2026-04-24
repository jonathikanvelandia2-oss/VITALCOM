// V42 — GET /api/onboarding/progress
// Calcula los flags de completación desde el estado real de la BD y retorna
// steps + progress + visibilidad. Super-light: 5 counts paralelos.

import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { buildSteps, computeProgress, shouldShowWidget } from '@/lib/onboarding/helpers'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      avatar: true,
      bio: true,
      whatsapp: true,
      createdAt: true,
      role: true,
      onboardingDismissedAt: true,
    },
  })
  if (!user) throw new Error('NOT_FOUND')

  const [storeCount, syncCount, calcCount, clickCount, postCount, orderCount] = await Promise.all([
    prisma.shopifyStore.count({ where: { userId: session.id } }),
    prisma.productSync.count({ where: { store: { userId: session.id } } }),
    prisma.pricingCalculation.count({ where: { userId: session.id } }),
    prisma.channelClick.count({ where: { userId: session.id } }),
    prisma.post.count({ where: { authorId: session.id } }),
    prisma.order.count({ where: { userId: session.id } }),
  ])

  const steps = buildSteps({
    hasAvatar: !!user.avatar,
    hasBio: !!(user.bio && user.bio.trim().length >= 10),
    hasWhatsapp: !!user.whatsapp,
    hasStore: storeCount > 0,
    hasProductSync: syncCount > 0,
    hasCalculation: calcCount > 0,
    hasChannelClick: clickCount > 0,
    hasPost: postCount > 0,
    hasOrder: orderCount > 0,
  })

  const progress = computeProgress(steps)
  const visible = shouldShowWidget({
    role: user.role,
    createdAt: user.createdAt,
    dismissedAt: user.onboardingDismissedAt,
    allRequiredComplete: progress.allRequiredComplete,
  })

  return apiSuccess({
    ...progress,
    visible,
    createdAt: user.createdAt,
    dismissedAt: user.onboardingDismissedAt,
  })
})
