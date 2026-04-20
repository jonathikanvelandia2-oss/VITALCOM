import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

// ── GET /api/notifications ─────────────────────────────
// Lista paginada + contador no leídas.
// Query: ?limit=20&cursor=<id>&unreadOnly=true

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20'), 1), 50)
  const cursor = url.searchParams.get('cursor')
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true'

  const where = { userId: session.id, ...(unreadOnly ? { read: false } : {}) }

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.notification.count({ where: { userId: session.id, read: false } }),
  ])

  const hasMore = items.length > limit
  const slice = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? slice[slice.length - 1].id : null

  return apiSuccess({
    items: slice.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      meta: n.meta,
      read: n.read,
      createdAt: n.createdAt,
    })),
    nextCursor,
    unreadCount,
  })
})
