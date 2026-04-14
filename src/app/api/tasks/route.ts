import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional().transform((s) => s ? new Date(s) : undefined),
})

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().nullable().optional().transform((s) => s ? new Date(s) : s === null ? null : undefined),
})

// ── GET /api/tasks — Tareas del usuario ────────────────
export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const tasks = await prisma.task.findMany({
    where: { userId: session.id },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
  })

  return apiSuccess({ tasks })
})

// ── POST /api/tasks — Crear tarea ──────────────────────
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createTaskSchema.parse(body)

  const task = await prisma.task.create({
    data: { ...data, userId: session.id } as any,
  })

  return apiSuccess(task, 201)
})

// ── PATCH /api/tasks — Actualizar tarea ────────────────
export const PATCH = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const { id, ...updates } = updateTaskSchema.parse(body)

  // Verificar que la tarea sea del usuario
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.id) throw new Error('NOT_FOUND')

  const task = await prisma.task.update({
    where: { id },
    data: updates as any,
  })

  return apiSuccess(task)
})

// ── DELETE /api/tasks — Eliminar tarea ─────────────────
export const DELETE = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const { id } = await req.json()

  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.id) throw new Error('NOT_FOUND')

  await prisma.task.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
