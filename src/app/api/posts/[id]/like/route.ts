import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { awardPoints } from '@/lib/gamification/points'

type Ctx = { params: Promise<{ id: string }> }

// ── POST /api/posts/[id]/like — Toggle like ─────────────
// Si ya dio like, lo quita. Si no, lo da.
export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: postId } = await ctx!.params

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('NOT_FOUND')

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: session.id } },
  })

  if (existing) {
    // Quitar like
    await prisma.$transaction([
      prisma.postLike.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: postId }, data: { likes: { decrement: 1 } } }),
    ])
    return apiSuccess({ liked: false, likes: post.likes - 1 })
  } else {
    // Dar like
    await prisma.$transaction([
      prisma.postLike.create({ data: { postId, userId: session.id } }),
      prisma.post.update({ where: { id: postId }, data: { likes: { increment: 1 } } }),
    ])

    // Puntos al autor del post (no a quien da like)
    if (post.authorId !== session.id) {
      await awardPoints(post.authorId, 'LIKE_RECEIVED')
    }

    return apiSuccess({ liked: true, likes: post.likes + 1 })
  }
})
