// V36 — POST /api/products/[id]/request-access
// El dropshipper solicita acceso a un producto (ej: para negociar precios
// exclusivos, agregar a su Shopify, pedir muestra). Crea un hilo en el
// inbox del área COMERCIAL con prioridad normal.

import { z } from 'zod'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { guardRateLimit } from '@/lib/security/rate-limit'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const schema = z.object({
  reason: z.enum(['PRICING', 'SAMPLE', 'EXCLUSIVE', 'INFO']).default('INFO'),
  message: z.string().min(5).max(1000).optional(),
})

export const POST = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const session = await requireSession()
  const { id } = await ctx!.params

  // 3 solicitudes por día por dropshipper — previene spam al área comercial
  const blocked = guardRateLimit(
    `request-access:${session.id}`,
    { maxRequests: 3, windowMs: 24 * 60 * 60 * 1000 },
    'Alcanzaste el máximo de 3 solicitudes por día',
  )
  if (blocked) return blocked

  const raw = await req.json().catch(() => ({}))
  const data = schema.parse(raw)

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, sku: true, active: true },
  })
  if (!product || !product.active) return apiError('Producto no encontrado', 404, 'NOT_FOUND')

  const reasonLabel: Record<typeof data.reason, string> = {
    PRICING: 'Consulta de precios',
    SAMPLE: 'Solicitud de muestra',
    EXCLUSIVE: 'Acuerdo de exclusividad',
    INFO: 'Información general',
  }

  const subject = `[${product.sku}] ${reasonLabel[data.reason]} · ${product.name}`
  const messageBody = [
    `Solicitud de acceso a producto`,
    ``,
    `Producto: ${product.name} (SKU ${product.sku})`,
    `Motivo: ${reasonLabel[data.reason]}`,
    `Solicitante: ${session.name ?? session.email}`,
    data.message ? `\nMensaje:\n${data.message}` : '',
  ].filter(Boolean).join('\n')

  const thread = await prisma.inboxThread.create({
    data: {
      subject,
      area: 'COMERCIAL',
      priority: 'normal',
      messages: {
        create: {
          senderId: session.id,
          body: messageBody,
        },
      },
    },
    select: {
      id: true,
      subject: true,
      area: true,
      createdAt: true,
    },
  })

  return apiSuccess({
    threadId: thread.id,
    subject: thread.subject,
    estimatedResponseHours: 24,
    createdAt: thread.createdAt,
  }, 201)
})
