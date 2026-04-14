import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { z } from 'zod'

// ── Schemas ─────────────────────────────────────────────
const savePricingSchema = z.object({
  productName: z.string().min(1).max(200),
  basePrice: z.number().positive(),
  shipping: z.number().min(0),
  margin: z.number(),
  finalPrice: z.number().positive(),
  country: z.enum(['CO', 'EC', 'GT', 'CL']),
  notes: z.string().max(500).optional(),
})

// ── GET /api/pricing — Historial de cálculos del usuario ─
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100)

  const calculations = await prisma.pricingCalculation.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return apiSuccess(calculations)
})

// ── POST /api/pricing — Guardar cálculo ─────────────────
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const body = await req.json()
  const data = savePricingSchema.parse(body)

  const calculation = await prisma.pricingCalculation.create({
    data: {
      userId: session.id,
      ...data,
    },
  })

  return apiSuccess(calculation, 201)
})
