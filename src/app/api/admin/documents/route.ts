import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole, requireSession } from '@/lib/auth/session'
import { z } from 'zod'

const createDocSchema = z.object({
  name: z.string().min(1),
  folder: z.enum(['general', 'legal', 'marketing', 'logistica']).default('general'),
  type: z.string().min(1),
  url: z.string().url(),
  size: z.number().default(0),
})

// ── GET /api/admin/documents — Documentos internos ─────
export const GET = withErrorHandler(async (req: Request) => {
  await requireRole('EMPLOYEE')

  const url = new URL(req.url)
  const folder = url.searchParams.get('folder') || undefined

  const where: any = {}
  if (folder) where.folder = folder

  const documents = await prisma.document.findMany({
    where,
    include: { uploader: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Agrupar por carpeta
  const folders: Record<string, typeof documents> = {}
  for (const doc of documents) {
    if (!folders[doc.folder]) folders[doc.folder] = []
    folders[doc.folder].push(doc)
  }

  return apiSuccess({ documents, folders })
})

// ── POST /api/admin/documents — Subir documento ───────
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireRole('EMPLOYEE')
  const body = await req.json()
  const data = createDocSchema.parse(body)

  const doc = await prisma.document.create({
    data: { ...data, uploadedBy: session.id } as any,
  })

  return apiSuccess(doc, 201)
})

// ── DELETE /api/admin/documents — Eliminar documento ───
export const DELETE = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')
  const { id } = await req.json()

  await prisma.document.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
