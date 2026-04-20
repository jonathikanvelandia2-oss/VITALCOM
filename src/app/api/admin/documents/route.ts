import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createDocSchema = z.object({
  name: z.string().min(1).max(255),
  folder: z.string().min(1).max(80),
  type: z.string().min(1).max(20),
  url: z.string().url(),
  size: z.number().int().min(0).default(0),
})

// ── GET /api/admin/documents — Documentos internos ─────
export const GET = withErrorHandler(async (req: Request) => {
  await requireRole('EMPLOYEE')

  const url = new URL(req.url)
  const folder = url.searchParams.get('folder') || undefined

  const documents = await prisma.document.findMany({
    where: folder ? { folder } : {},
    include: { uploader: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const byFolder = new Map<string, number>()
  for (const d of documents) byFolder.set(d.folder, (byFolder.get(d.folder) ?? 0) + 1)

  return apiSuccess({
    items: documents.map((d) => ({
      id: d.id,
      name: d.name,
      folder: d.folder,
      type: d.type,
      url: d.url,
      size: d.size,
      uploader: d.uploader,
      createdAt: d.createdAt,
    })),
    folders: Array.from(byFolder.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })
})

// ── POST /api/admin/documents — Registrar documento ────
// Se asume que el archivo ya fue subido (Supabase Storage, S3,
// Cloudinary, etc.) y se provee la URL pública + tamaño en bytes.
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireRole('EMPLOYEE')
  const body = await req.json()
  const data = createDocSchema.parse(body)

  const doc = await prisma.document.create({
    data: { ...data, uploadedBy: session.id },
  })

  return apiSuccess({
    id: doc.id,
    name: doc.name,
    folder: doc.folder,
    type: doc.type,
    url: doc.url,
    size: doc.size,
    createdAt: doc.createdAt,
  }, 201)
})
