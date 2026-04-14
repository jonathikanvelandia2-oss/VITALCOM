import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession, isStaff } from '@/lib/auth/session'
import { updatePostSchema } from '@/lib/api/schemas/post'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/posts/[id] — Detalle de post ───────────────
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, level: true, points: true, avatar: true, bio: true } },
      postLikes: { where: { userId: session.id }, select: { id: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, level: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { comments: true } },
    },
  })

  if (!post) throw new Error('NOT_FOUND')

  return apiSuccess({
    ...post,
    likedByMe: post.postLikes.length > 0,
    commentCount: post._count.comments,
    postLikes: undefined,
    _count: undefined,
  })
})

// ── PUT /api/posts/[id] — Editar post ──────────────────
export const PUT = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')

  // Solo el autor o staff pueden editar
  if (post.authorId !== session.id && !isStaff(session.role)) {
    throw new Error('FORBIDDEN')
  }

  const body = await req.json()
  const data = updatePostSchema.parse(body)

  // Solo staff puede anclar posts
  if (data.pinned !== undefined && !isStaff(session.role)) {
    delete (data as any).pinned
  }

  const updated = await prisma.post.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, name: true, level: true, points: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  })

  return apiSuccess(updated)
})

// ── DELETE /api/posts/[id] — Eliminar post ──────────────
export const DELETE = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')

  // Solo el autor o staff pueden eliminar
  if (post.authorId !== session.id && !isStaff(session.role)) {
    throw new Error('FORBIDDEN')
  }

  await prisma.post.delete({ where: { id } })

  return apiSuccess({ deleted: true })
})
