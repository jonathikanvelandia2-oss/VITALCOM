import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { resetPasswordSchema } from '@/lib/auth/schemas'
import { hashPassword } from '@/lib/security/password'
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/security/rate-limit'
import { NextResponse } from 'next/server'

// ── POST /api/auth/reset-password ──────────────────────
// Valida token + cambia password. Elimina token post-uso (one-shot).

export const POST = withErrorHandler(async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limit = rateLimit(`reset:${ip}`, RATE_LIMITS.sensitive)
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: 'Demasiados intentos. Intenta más tarde.', code: 'RATE_LIMITED' },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const body = await req.json()
  const { token, newPassword } = resetPasswordSchema.parse(body)

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!record) {
    return apiError('Token inválido o ya usado', 400, 'INVALID_TOKEN')
  }

  if (record.expiresAt < new Date()) {
    // Limpiar token expirado aprovechando la consulta
    await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {})
    return apiError('El enlace expiró. Solicita uno nuevo.', 400, 'TOKEN_EXPIRED')
  }

  const user = await prisma.user.findUnique({ where: { email: record.email } })
  if (!user || !user.active) {
    await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {})
    return apiError('Usuario no encontrado o inactivo', 400, 'USER_INVALID')
  }

  const hashed = await hashPassword(newPassword)

  // Transacción: actualizar password + borrar TODOS los tokens del email
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    }),
  ])

  return apiSuccess({ reset: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' })
})
