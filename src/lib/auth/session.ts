import { getServerSession } from 'next-auth'
import { authOptions } from './auth.config'

// ── Helpers de sesión para Server Components y API routes ──

export type UserSession = {
  id: string
  email: string
  name: string | null
  role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER_AREA' | 'EMPLOYEE' | 'COMMUNITY' | 'DROPSHIPPER'
  country: 'CO' | 'EC' | 'GT' | 'CL' | null
  area: string | null
  verified: boolean
}

/**
 * Obtiene la sesión actual del servidor.
 * Retorna null si no hay sesión válida.
 */
export async function getSession(): Promise<UserSession | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  return {
    id: (session.user as any).id,
    email: session.user.email!,
    name: session.user.name ?? null,
    role: (session.user as any).role ?? 'COMMUNITY',
    country: (session.user as any).country ?? null,
    area: (session.user as any).area ?? null,
    verified: (session.user as any).verified ?? false,
  }
}

/**
 * Requiere sesión — lanza redirect si no autenticado.
 * Usar en Server Components y API routes protegidas.
 */
export async function requireSession(): Promise<UserSession> {
  const session = await getSession()
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

/**
 * Requiere un rol específico (o superior).
 * Jerarquía: SUPERADMIN > ADMIN > MANAGER_AREA > EMPLOYEE > COMMUNITY/DROPSHIPPER
 */
const ROLE_HIERARCHY: Record<string, number> = {
  SUPERADMIN: 100,
  ADMIN: 80,
  MANAGER_AREA: 60,
  EMPLOYEE: 40,
  DROPSHIPPER: 20,
  COMMUNITY: 10,
}

export async function requireRole(minRole: keyof typeof ROLE_HIERARCHY): Promise<UserSession> {
  const session = await requireSession()
  const userLevel = ROLE_HIERARCHY[session.role] ?? 0
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0

  if (userLevel < requiredLevel) {
    throw new Error('FORBIDDEN')
  }

  return session
}

/**
 * Verifica si el usuario tiene acceso a un área específica.
 * SUPERADMIN y ADMIN tienen acceso a todas las áreas.
 */
export async function requireArea(area: string): Promise<UserSession> {
  const session = await requireSession()

  if (session.role === 'SUPERADMIN' || session.role === 'ADMIN') {
    return session // Acceso total
  }

  if (session.area !== area) {
    throw new Error('FORBIDDEN')
  }

  return session
}

/**
 * Verifica si el usuario es del equipo interno (no comunidad).
 */
export function isStaff(role: string): boolean {
  return ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(role)
}

/**
 * Verifica si el usuario es admin (SUPERADMIN o ADMIN).
 */
export function isAdmin(role: string): boolean {
  return ['SUPERADMIN', 'ADMIN'].includes(role)
}
