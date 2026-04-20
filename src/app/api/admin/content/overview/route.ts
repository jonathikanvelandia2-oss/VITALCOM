import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/admin/content/overview ──────────────────────
// Inventario de contenido para la comunidad:
// Resource (biblioteca pública), Course (academia), Post (feed).

export const GET = withErrorHandler(async () => {
  await requireRole('MANAGER_AREA')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    resourcesTotal,
    resourcesPublished,
    resourcesDownloads,
    coursesTotal,
    coursesPublished,
    postsTotal,
    postsRecent,
    topResources,
    latestCourses,
    latestPosts,
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.count({ where: { published: true } }),
    prisma.resource.aggregate({ _sum: { downloads: true } }),
    prisma.course.count(),
    prisma.course.count({ where: { published: true } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.resource.findMany({
      where: { published: true },
      orderBy: { downloads: 'desc' },
      take: 5,
      select: { id: true, title: true, category: true, type: true, downloads: true, thumbnail: true },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, level: true, published: true, cover: true, createdAt: true },
    }),
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
  ])

  return apiSuccess({
    kpis: {
      resourcesTotal,
      resourcesPublished,
      resourcesDownloads: resourcesDownloads._sum.downloads ?? 0,
      coursesTotal,
      coursesPublished,
      postsTotal,
      postsRecent,
    },
    topResources,
    latestCourses,
    latestPosts: latestPosts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body.slice(0, 120),
      category: p.category,
      likes: p.likes,
      authorName: p.author?.name ?? 'Anónimo',
      createdAt: p.createdAt,
    })),
  })
})
