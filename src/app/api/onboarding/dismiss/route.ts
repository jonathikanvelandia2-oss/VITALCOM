// V42 — POST /api/onboarding/dismiss
// Oculta el widget de onboarding (opt-out). Idempotente — no falla si ya
// estaba dismissed, solo refresca el timestamp.

import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const POST = withErrorHandler(async () => {
  const session = await requireSession()

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: { onboardingDismissedAt: new Date() },
    select: { onboardingDismissedAt: true },
  })

  return apiSuccess({ dismissedAt: updated.onboardingDismissedAt })
})
