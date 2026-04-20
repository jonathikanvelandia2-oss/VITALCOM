import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// ── GET /api/campaigns/drafts ────────────────────────────
// Lista los drafts del usuario (más recientes primero).
// Query opcional: ?status=DRAFT|READY|LAUNCHED

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const url = new URL(req.url)
  const status = url.searchParams.get('status') as any
  const drafts = await prisma.campaignDraft.findMany({
    where: {
      userId: session.id,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      product: { select: { id: true, sku: true, name: true, images: true, precioComunidad: true } },
    },
  })
  return apiSuccess({ items: drafts })
})

// ── POST /api/campaigns/drafts ────────────────────────────
// Crea un draft nuevo con defaults. El wizard luego hace PATCH.

const createSchema = z.object({
  name: z.string().min(2).max(80),
  productId: z.string().optional(),
  platform: z.enum(['META', 'TIKTOK', 'GOOGLE', 'OTHER']).optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const data = createSchema.parse(body)

  const draft = await prisma.campaignDraft.create({
    data: {
      userId: session.id,
      name: data.name,
      productId: data.productId ?? null,
      platform: data.platform ?? 'META',
      status: 'DRAFT',
      step: data.productId ? 2 : 1,
    },
    include: {
      product: { select: { id: true, sku: true, name: true, images: true, precioComunidad: true } },
    },
  })
  return apiSuccess(draft, 201)
})
