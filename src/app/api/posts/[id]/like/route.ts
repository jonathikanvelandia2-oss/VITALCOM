import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { awardPoints } from '@/lib/gamification/points'
import { guardRateLimit } from '@/lib/security/rate-limit'

type Ctx = { params: Promise<{ id: string }> }

// ── POST /api/posts/[id]/like — Toggle like ─────────────
// Si ya dio like, lo quita. Si no, lo da.
export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()

  // 60 toggles / min — suficiente para uso normal, corta scripts abusivos
  const blocked = guardRateLimit(`like:${session.id}`, { maxRequests: 60, windowMs: 60_000 })
  if (blocked) return blocked

  const { id: postId } = await ctx!.params

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('NOT_FOUND')

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: session.id } },
  })

  // Devolvemos el valor `likes` leído del UPDATE (con RETURNING) para
  // evitar reportar un conteo stale si otro like llegó en paralelo.
  if (existing) {
    const [, updated] = await prisma.$transaction([
      prisma.postLike.delete({ where: { id: existing.id } }),
      prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } },
        select: { likes: true },
      }),
    ])
    return apiSuccess({ liked: false, likes: updated.likes })
  } else {
    const [, updated] = await prisma.$transaction([
      prisma.postLike.create({ data: { postId, userId: session.id } }),
      prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      }),
    ])

    // Puntos al autor (fuera de transacción porque es best-effort)
    if (post.authorId !== session.id) {
      await awardPoints(post.authorId, 'LIKE_RECEIVED')
    }

    return apiSuccess({ liked: true, likes: updated.likes })
  }
})
