import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/security/password'

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Buscar usuario en BD
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })

        if (!user || !user.password || !user.active) {
          return null
        }

        // Verificar contraseña con PBKDF2
        const valid = await verifyPassword(credentials.password, user.password)
        if (!valid) {
          return null
        }

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
