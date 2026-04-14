import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession, requireRole } from '@/lib/auth/session'
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().transform((s) => new Date(s)),
  endDate: z.string().optional().transform((s) => s ? new Date(s) : undefined),
  link: z.string().url().optional(),
  type: z.enum(['webinar', 'live', 'meetup', 'workshop', 'masterclass']).default('webinar'),
  speaker: z.string().optional(),
  cover: z.string().optional(),
  published: z.boolean().optional().default(true),
})

// ── GET /api/events — Lista de eventos ──────────────────
export const GET = withErrorHandler(async () => {
  await requireSession()

  const events = await prisma.event.findMany({
    where: { published: true },
    orderBy: { date: 'asc' },
  })

  const now = new Date()
  const mapped = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    endDate: e.endDate,
    link: e.link,
    type: e.type,
    speaker: e.speaker,
    cover: e.cover,
    isPast: e.date < now,
  }))

  return apiSuccess({
    upcoming: mapped.filter((e) => !e.isPast),
    past: mapped.filter((e) => e.isPast),
    total: mapped.length,
  })
})

// ── POST /api/events — Crear evento (admin) ─────────────
export const POST = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')
  const body = await req.json()
  const data = createEventSchema.parse(body)

  const event = await prisma.event.create({ data: data as any })
  return apiSuccess(event, 201)
})
