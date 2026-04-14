import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { createCommentSchema } from '@/lib/api/schemas/post'
import { awardPoints } from '@/lib/gamification/points'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/posts/[id]/comments — Listar comentarios ──
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: postId } = await ctx!.params

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('NOT_FOUND')

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 100)

  const comments = await prisma.comment.findMany({
    where: { postId },
    include: {
      author: { select: { id: true, name: true, level: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  return apiSuccess(comments)
})

// ── POST /api/posts/[id]/comments — Crear comentario ───
export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: postId } = await ctx!.params

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('NOT_FOUND')

  const body = await req.json()
  const data = createCommentSchema.parse(body)

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: session.id,
      body: data.body,
      parentId: data.parentId,
    },
    include: {
      author: { select: { id: true, name: true, level: true, avatar: true } },
    },
  })

  // Puntos al que comenta
  await awardPoints(session.id, 'COMMENT_CREATED')

  return apiSuccess(comment, 201)
})
