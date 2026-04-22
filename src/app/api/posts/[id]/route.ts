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

// Filtro de ownership que aplicamos en la query para que
// no-owners reciban 404 (sin revelar existencia del recurso).
function ownsPostWhere(id: string, session: { id: string; role: string }) {
  return isStaff(session.role)
    ? { id }
    : { id, authorId: session.id }
}

// ── PUT /api/posts/[id] — Editar post ──────────────────
export const PUT = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  const body = await req.json()
  const data = updatePostSchema.parse(body)

  // Solo staff puede anclar posts
  if (data.pinned !== undefined && !isStaff(session.role)) {
    delete (data as any).pinned
  }

  // updateMany con filtro de ownership en la query → atómico.
  // Si no matchea (no existe o no es dueño), count=0 y devolvemos 404.
  const result = await prisma.post.updateMany({
    where: ownsPostWhere(id, session),
    data,
  })
  if (result.count === 0) throw new Error('NOT_FOUND')

  const updated = await prisma.post.findUnique({
    where: { id },
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

  const result = await prisma.post.deleteMany({
    where: ownsPostWhere(id, session),
  })
  if (result.count === 0) throw new Error('NOT_FOUND')

  return apiSuccess({ deleted: true })
})
