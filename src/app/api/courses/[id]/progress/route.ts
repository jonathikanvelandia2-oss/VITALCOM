import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { awardPoints } from '@/lib/gamification/points'
import { z } from 'zod'

type Ctx = { params: Promise<{ id: string }> }

const updateProgressSchema = z.object({
  lessonId: z.string().min(1), // ID de la lección completada
})

// ── GET /api/courses/[id]/progress — Progreso del usuario ─
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: courseId } = await ctx!.params

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new Error('NOT_FOUND')

  const progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.id, courseId } },
  })

  const modules = (course.modules as any[]) ?? []
  const totalLessons = modules.reduce(
    (sum: number, m: any) => sum + (m.lessons?.length ?? 0), 0
  )

  return apiSuccess({
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      modules,
    },
    progress: {
      completedLessons: progress?.completedLessons ?? [],
      percentage: progress?.percentage ?? 0,
      completed: progress?.completed ?? false,
      totalLessons,
    },
  })
})

// ── POST /api/courses/[id]/progress — Marcar lección completada ─
export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id: courseId } = await ctx!.params

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new Error('NOT_FOUND')

  const body = await req.json()
  const { lessonId } = updateProgressSchema.parse(body)

  const modules = (course.modules as any[]) ?? []
  const totalLessons = modules.reduce(
    (sum: number, m: any) => sum + (m.lessons?.length ?? 0), 0
  )

  // Obtener o crear progreso
  let progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.id, courseId } },
  })

  const currentCompleted = progress?.completedLessons ?? []

  // No duplicar lecciones
  if (currentCompleted.includes(lessonId)) {
    return apiSuccess({ message: 'Ya completada', percentage: progress?.percentage ?? 0 })
  }

  const newCompleted = [...currentCompleted, lessonId]
  const percentage = totalLessons > 0 ? Math.round((newCompleted.length / totalLessons) * 100) : 0
  const isCompleted = percentage >= 100

  if (progress) {
    progress = await prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        completedLessons: newCompleted,
        percentage,
        completed: isCompleted,
      },
    })
  } else {
    progress = await prisma.courseProgress.create({
      data: {
        userId: session.id,
        courseId,
        completedLessons: newCompleted,
        percentage,
        completed: isCompleted,
      },
    })
  }

  // Puntos por lección completada
  await awardPoints(session.id, 'LESSON_COMPLETED')

  // Puntos extra por curso completado
  if (isCompleted) {
    await awardPoints(session.id, 'COURSE_COMPLETED')
  }

  return apiSuccess({
    percentage,
    completed: isCompleted,
    completedLessons: newCompleted.length,
    totalLessons,
  })
})
