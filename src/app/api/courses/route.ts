import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession, requireRole } from '@/lib/auth/session'
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  cover: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  modules: z.any().default([]), // JSON de módulos
  published: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
})

// ── GET /api/courses — Lista de cursos ──────────────────
export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  })

  // Obtener progreso del usuario para cada curso
  const progress = await prisma.courseProgress.findMany({
    where: { userId: session.id },
  })

  const progressMap = new Map(progress.map((p) => [p.courseId, p]))

  const mapped = courses.map((c) => {
    const p = progressMap.get(c.id)
    const modules = (c.modules as any[]) ?? []
    const totalLessons = modules.reduce(
      (sum: number, m: any) => sum + (m.lessons?.length ?? 0), 0
    )

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      cover: c.cover,
      level: c.level,
      modulesCount: modules.length,
      lessonsCount: totalLessons,
      progress: p?.percentage ?? 0,
      completed: p?.completed ?? false,
      completedLessons: p?.completedLessons?.length ?? 0,
    }
  })

  return apiSuccess({ courses: mapped })
})

// ── POST /api/courses — Crear curso (admin) ─────────────
export const POST = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')
  const body = await req.json()
  const data = createCourseSchema.parse(body)

  const course = await prisma.course.create({ data: data as any })
  return apiSuccess(course, 201)
})
