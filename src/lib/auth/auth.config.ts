import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/security/password'
import { writeAuditLog } from '@/lib/audit/logger'

// ── NextAuth configuración ──────────────────────────────
// Credentials provider + JWT sessions.
// authorize() busca en BD real y verifica password con PBKDF2.

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },

  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/feed',
  },

  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Vitalcom',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials, req) {
        const ip =
          (req?.headers?.['x-forwarded-for'] as string | undefined)
            ?.split(',')[0]
            ?.trim() ||
          (req?.headers?.['x-real-ip'] as string | undefined) ||
          null
        const userAgent = (req?.headers?.['user-agent'] as string | undefined) ?? null
        const emailNorm = credentials?.email?.toLowerCase().trim() ?? null

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Buscar usuario en BD
        const user = await prisma.user.findUnique({
          where: { email: emailNorm! },
        })

        if (!user || !user.password || !user.active) {
          writeAuditLog({
            resource: 'AUTH',
            action: 'LOGIN_FAILED',
            summary: `Intento de login fallido (${!user ? 'usuario no existe' : !user.password ? 'sin contraseña' : 'cuenta inactiva'})`,
            actor: { email: emailNorm, role: user?.role ?? null, id: user?.id ?? null },
            metadata: { reason: !user ? 'not_found' : !user.password ? 'no_password' : 'inactive', email: emailNorm },
            ip,
            userAgent,
          })
          return null
        }

        // Verificar contraseña con PBKDF2
        const valid = await verifyPassword(credentials.password, user.password)
        if (!valid) {
          writeAuditLog({
            resource: 'AUTH',
            action: 'LOGIN_FAILED',
            summary: 'Intento de login fallido (contraseña incorrecta)',
            actor: { id: user.id, email: user.email, role: user.role },
            metadata: { reason: 'invalid_password' },
            ip,
            userAgent,
          })
          return null
        }

        writeAuditLog({
          resource: 'AUTH',
          action: 'LOGIN_SUCCESS',
          summary: `Login exitoso de ${user.email}`,
          actor: { id: user.id, email: user.email, role: user.role },
          metadata: { role: user.role, area: user.area, country: user.country },
          ip,
          userAgent,
        })

        // Retornar datos para el token JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          country: user.country,
          area: user.area,
          verified: user.verified,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.country = (user as any).country
        token.area = (user as any).area
        token.verified = (user as any).verified
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).country = token.country as string | null
        ;(session.user as any).area = token.area as string | null
        ;(session.user as any).verified = token.verified as boolean
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production-min-32-chars',

  debug: false,
}
