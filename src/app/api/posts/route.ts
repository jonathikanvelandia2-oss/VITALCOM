import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { createPostSchema, postFiltersSchema } from '@/lib/api/schemas/post'
import { awardPoints } from '@/lib/gamification/points'

// ── GET /api/posts — Feed paginado ─────────────────────
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const url = new URL(req.url)
  const filters = postFiltersSchema.parse({
    category: url.searchParams.get('category') || undefined,
    authorId: url.searchParams.get('authorId') || undefined,
    pinned: url.searchParams.get('pinned') || undefined,
    search: url.searchParams.get('search') || undefined,
    page: url.searchParams.get('page') || undefined,
    limit: url.searchParams.get('limit') || undefined,
  })

  const where: any = {}
  if (filters.category) where.category = filters.category
  if (filters.authorId) where.authorId = filters.authorId
  if (filters.pinned) where.pinned = filters.pinned === 'true'
  if (filters.search) {
    where.OR = [
      { body: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const skip = (filters.page - 1) * filters.limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, level: true, points: true, avatar: true } },
        postLikes: { where: { userId: session.id }, select: { id: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: filters.limit,
    }),
    prisma.post.count({ where }),
  ])

  // Mapear para incluir si el usuario dio like
  const mapped = posts.map(p => ({
    ...p,
    likedByMe: p.postLikes.length > 0,
    commentCount: p._count.comments,
    postLikes: undefined,
    _count: undefined,
  }))

  return apiSuccess({
    posts: mapped,
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) },
  })
})

// ── POST /api/posts — Crear post ────────────────────────
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const body = await req.json()
  const data = createPostSchema.parse(body)

  const post = await prisma.post.create({
    data: {
      authorId: session.id,
      title: data.title,
      body: data.body,
      category: data.category,
      images: data.images,
    },
    include: {
      author: { select: { id: true, name: true, level: true, points: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  })

  // Otorgar puntos por crear post
  await awardPoints(session.id, 'POST_CREATED')

  return apiSuccess({ ...post, likedByMe: false, commentCount: post._count.comments }, 201)
})
