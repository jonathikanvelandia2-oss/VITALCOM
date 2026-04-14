import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession, requireRole } from '@/lib/auth/session'
import { z } from 'zod'

const createResourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  type: z.enum(['file', 'link', 'video']).default('file'),
  url: z.string().url(),
  thumbnail: z.string().optional(),
})

// ── GET /api/resources — Lista de recursos ─────────────
export const GET = withErrorHandler(async (req: Request) => {
  await requireSession()

  const url = new URL(req.url)
  const category = url.searchParams.get('category') || undefined

  const where: any = { published: true }
  if (category) where.category = category

  const resources = await prisma.resource.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return apiSuccess({ resources })
})

// ── POST /api/resources — Crear recurso (admin) ───────
export const POST = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')
  const body = await req.json()
  const data = createResourceSchema.parse(body)

  const resource = await prisma.resource.create({ data })
  return apiSuccess(resource, 201)
})

// ── PATCH /api/resources — Registrar descarga ──────────
export const PATCH = withErrorHandler(async (req: Request) => {
  await requireSession()
  const { id } = await req.json()

  await prisma.resource.update({
    where: { id },
    data: { downloads: { increment: 1 } },
  })

  return apiSuccess({ ok: true })
})
