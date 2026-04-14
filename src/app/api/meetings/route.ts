import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.string().transform((s) => new Date(s)),
  duration: z.number().min(15).max(480).default(60),
  link: z.string().url().optional(),
  type: z.enum(['videocall', 'presencial']).default('videocall'),
})

const updateMeetingSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  link: z.string().url().optional(),
  date: z.string().optional().transform((s) => s ? new Date(s) : undefined),
})

// ── GET /api/meetings — Reuniones del usuario ──────────
export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  const meetings = await prisma.meeting.findMany({
    where: { userId: session.id },
    orderBy: { date: 'asc' },
  })

  const now = new Date()
  return apiSuccess({
    upcoming: meetings.filter((m) => m.date >= now && m.status === 'scheduled'),
    past: meetings.filter((m) => m.date < now || m.status !== 'scheduled'),
  })
})

// ── POST /api/meetings — Crear reunión ─────────────────
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createMeetingSchema.parse(body)

  const meeting = await prisma.meeting.create({
    data: { ...data, userId: session.id } as any,
  })

  return apiSuccess(meeting, 201)
})

// ── PATCH /api/meetings — Actualizar reunión ───────────
export const PATCH = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const { id, ...updates } = updateMeetingSchema.parse(body)

  const existing = await prisma.meeting.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.id) throw new Error('NOT_FOUND')

  const meeting = await prisma.meeting.update({
    where: { id },
    data: updates as any,
  })

  return apiSuccess(meeting)
})

// ── DELETE /api/meetings — Eliminar reunión ────────────
export const DELETE = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const { id } = await req.json()

  const existing = await prisma.meeting.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.id) throw new Error('NOT_FOUND')

  await prisma.meeting.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
