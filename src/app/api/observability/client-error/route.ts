// V33 — Endpoint que recibe errores del cliente (error boundaries)
// ═══════════════════════════════════════════════════════════
// Los error boundaries cliente envían aquí su digest para que
// quede en los Runtime Logs de Vercel correlacionado con el user-agent.
// Rate-limit por IP para evitar abuse.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@/lib/observability'
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const schema = z.object({
  surface: z.enum(['root', 'admin', 'community', 'auth']),
  message: z.string().max(500).optional(),
  digest: z.string().max(100).optional(),
})

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limit = rateLimit(`client-error:${ip}`, RATE_LIMITS.api)
  if (!limit.success) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)
    captureException(new Error(data.message ?? 'Unknown client error'), {
      tags: { surface: data.surface, origin: 'client' },
      extra: { digest: data.digest, userAgent: req.headers.get('user-agent') },
    })
  } catch {
    // payload inválido — ignorar silenciosamente
  }
  return NextResponse.json({ ok: true })
}
