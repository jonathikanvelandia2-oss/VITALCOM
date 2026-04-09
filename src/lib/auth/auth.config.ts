import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/security/password'

// ── NextAuth configuración segura ───────────────────────
// Credentials provider + Prisma adapter + JWT sessions
// Tokens firmados con NEXTAUTH_SECRET (min 32 chars)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  // JWT por defecto — no depende de sesiones en BD para cada request
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
    updateAge: 60 * 60,   // Refrescar token cada 1 hora
  },

  // Páginas personalizadas de auth
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            country: true,
            area: true,
            avatar: true,
            active: true,
            verified: true,
          },
        })

        // Usuario no existe o desactivado
        if (!user || !user.active) return null

        // Sin password (registrado con OAuth en el futuro)
        if (!user.password) return null

        // Verificar contraseña con PBKDF2
        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) return null

        // Retornar datos de sesión (sin password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          country: user.country,
          area: user.area,
          avatar: user.avatar,
          verified: user.verified,
        }
      },
    }),
  ],

  callbacks: {
    // Incluir datos del usuario en el JWT
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

    // Exponer datos en la sesión del cliente
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

  // Eventos de seguridad
  events: {
    async signIn({ user }) {
      // Log de acceso (en producción → Sentry/analytics)
      console.log(`[AUTH] Login: ${user.email} at ${new Date().toISOString()}`)
    },
    async signOut({ token }) {
      console.log(`[AUTH] Logout: ${token.email} at ${new Date().toISOString()}`)
    },
  },

  // Seguridad de cookies
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // No exponer errores internos al cliente
  debug: false,
}
