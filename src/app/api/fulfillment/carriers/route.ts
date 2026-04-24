// V37 — GET /api/fulfillment/carriers?country=CO
// Devuelve el catálogo de transportadoras disponibles por país para que
// el UI pinte el select de fulfillment manual. Sin BD — lista estática.

import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { CARRIERS, getCarriersForCountry } from '@/lib/fulfillment/helpers'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  country: z.enum(['CO', 'EC', 'GT', 'CL']).optional(),
})

export const GET = withErrorHandler(async (req: Request) => {
  await requireSession()

  const url = new URL(req.url)
  const data = querySchema.parse({
    country: url.searchParams.get('country') || undefined,
  })

  const items = data.country ? getCarriersForCountry(data.country) : [...CARRIERS]

  return apiSuccess({
    country: data.country ?? 'ALL',
    items: items.map((c) => ({
      key: c.key,
      label: c.label,
      country: c.country,
      website: c.website,
    })),
  })
})
