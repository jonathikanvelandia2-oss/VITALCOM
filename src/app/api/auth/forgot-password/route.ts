import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requestResetSchema } from '@/lib/auth/schemas'
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/security/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

// ── POST /api/auth/forgot-password ─────────────────────
// Genera token de un solo uso + envía email con link.
// Por seguridad responde 200 siempre (no revela si el email existe).

const TOKEN_TTL_MINUTES = 60

export const POST = withErrorHandler(async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limit = rateLimit(`forgot:${ip}`, RATE_LIMITS.sensitive)
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: 'Demasiadas solicitudes. Intenta en unos minutos.', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const body = await req.json()
  const { email } = requestResetSchema.parse(body)

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, active: true },
  })

  // Respuesta genérica incluso cuando el user no existe — anti-enumeration.
  // Solo generamos token + enviamos email si el user existe y está activo.
  if (user && user.active) {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)

    // Invalidar tokens previos del mismo email (no permitir multiples vivos)
    await prisma.passwordResetToken.deleteMany({ where: { email: user.email } })

    await prisma.passwordResetToken.create({
      data: { email: user.email, token, expiresAt },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitalcom.vercel.app'
    const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${token}`

    // Fire-and-forget: si Resend falla, el usuario igual ve éxito.
    // El error queda en logs para que operaciones lo detecte.
    sendPasswordResetEmail(user.email, {
      name: user.name || 'Vitalcommer',
      resetUrl,
      expiresInMinutes: TOKEN_TTL_MINUTES,
      requestIp: ip !== 'unknown' ? ip : undefined,
    }).catch((err) => {
      console.error('[forgot-password] email fallback error', err)
    })
  }

  return apiSuccess(
    { sent: true, message: 'Si el email existe en nuestra base, enviaremos instrucciones.' }
  )
})
