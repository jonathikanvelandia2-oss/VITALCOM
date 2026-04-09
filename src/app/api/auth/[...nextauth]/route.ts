import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

// ── NextAuth API route ──────────────────────────────────
// Maneja: /api/auth/signin, /api/auth/signout, /api/auth/session, etc.
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
