import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { hashPassword, verifyPassword } from '@/lib/security/password'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ── POST /api/users/me/password ──────────────────────────
// Cambia la contraseña del usuario autenticado. Requiere la
// contraseña actual para evitar toma de sesiones.

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  const body = await req.json()
  const { currentPassword, newPassword } = schema.parse(body)

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, password: true },
  })
  if (!user || !user.password) {
    return apiError('Usuario sin contraseña registrada', 400, 'NO_PASSWORD')
  }

  const ok = await verifyPassword(currentPassword, user.password)
  if (!ok) return apiError('Contraseña actual incorrecta', 400, 'INVALID_PASSWORD')

  if (currentPassword === newPassword) {
    return apiError('La contraseña nueva debe ser diferente', 400, 'SAME_PASSWORD')
  }

  const hashed = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

  return apiSuccess({ changed: true })
})
