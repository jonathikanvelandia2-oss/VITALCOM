import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// ── NextAuth configuración ──────────────────────────────
// Credentials provider + JWT sessions.
// Prisma adapter se conecta solo cuando hay BD disponible.
// En build time (Vercel) funciona sin BD.

export const authOptions: NextAuthOptions = {
  // Prisma adapter solo si hay DATABASE_URL (no rompe el build)
  ...(process.env.DATABASE_URL ? {
    adapter: undefined, // Se activa cuando conectemos Prisma real
  } : {}),

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

        // TODO: Conectar Prisma cuando la BD esté lista
        // Por ahora retorna null (login no funcional aún)
        return null
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
