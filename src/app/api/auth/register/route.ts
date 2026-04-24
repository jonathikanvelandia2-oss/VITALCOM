import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { registerSchema } from '@/lib/auth/schemas'
import { hashPassword } from '@/lib/security/password'
import { rateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/security/rate-limit'
import { sendWelcomeEmail } from '@/lib/email'
import { writeAuditLog, extractRequestMeta } from '@/lib/audit/logger'
import { ZodError } from 'zod'

// ── POST /api/auth/register ─────────────────────────────
// Registro de nuevos miembros de la comunidad Vitalcom.
// Valida con Zod, aplica rate limit, hashea password, crea user.

export async function POST(req: Request) {
  try {
    // Rate limit por IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limit = rateLimit(`register:${ip}`, RATE_LIMITS.auth)
    if (!limit.success) {
      return NextResponse.json(
        { ok: false, error: 'Demasiados intentos. Intenta en 15 minutos.' },
        { status: 429, headers: rateLimitHeaders(limit) }
      )
    }

    const body = await req.json()

    // Validar con Zod
    const data = registerSchema.parse(body)

    // Verificar email no registrado
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Este correo ya está registrado. ¿Quieres iniciar sesión?' },
        { status: 409 }
      )
    }

    // Hashear password con PBKDF2
    const hashedPassword = await hashPassword(data.password)

    // Crear usuario con rol COMMUNITY
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        whatsapp: data.whatsapp || null,
        role: 'COMMUNITY',
        level: 1,
        points: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // Fire-and-forget: welcome email. Si Resend no está configurado o falla,
    // el registro ya fue exitoso y el error queda en logs para operaciones.
    sendWelcomeEmail(user.email, { name: user.name || 'Vitalcommer' }).catch((err) => {
      console.error('[register] welcome email failed', err)
    })

    const meta = extractRequestMeta(req)
    writeAuditLog({
      resource: 'AUTH',
      action: 'REGISTER',
      resourceId: user.id,
      summary: `Nuevo registro: ${user.email}`,
      actor: { id: user.id, email: user.email, role: user.role },
      metadata: { role: user.role },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return NextResponse.json(
      { ok: true, data: { id: user.id, email: user.email, name: user.name } },
      { status: 201, headers: rateLimitHeaders(limit) }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = []
        fieldErrors[path].push(issue.message)
      }
      return NextResponse.json(
        { ok: false, error: 'Datos inválidos', fieldErrors },
        { status: 400 }
      )
    }

    console.error('[Register Error]', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
