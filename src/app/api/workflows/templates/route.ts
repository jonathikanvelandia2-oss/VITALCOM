import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/workflows/templates ─────────────────────────
// Plantillas oficiales (isPublic=true) + las del propio usuario.

export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const templates = await prisma.workflowTemplate.findMany({
    where: { OR: [{ isPublic: true }, { userId: session.id }] },
    orderBy: [{ isPublic: 'desc' }, { uses: 'desc' }, { createdAt: 'asc' }],
  })

  return apiSuccess({
    items: templates.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      emoji: t.emoji,
      description: t.description,
      category: t.category,
      target: t.target,
      impact: t.impact,
      steps: t.steps,
      isPublic: t.isPublic,
      uses: t.uses,
    })),
  })
})
