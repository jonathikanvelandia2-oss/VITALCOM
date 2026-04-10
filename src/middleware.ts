import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Middleware de Vitalcom ───────────────────────────────
// DESARROLLO: Pasa todo sin restricción para pruebas libres.
// PRODUCCIÓN: Protección completa de rutas, roles y seguridad.
// La variable NODE_ENV la setea Next.js automáticamente.

const IS_DEV = process.env.NODE_ENV !== 'production'
const IS_TESTING = process.env.NEXT_PUBLIC_TESTING_MODE === 'true'

// Rutas protegidas (solo en producción)
const PROTECTED_ROUTES = [
  '/admin',
  '/feed',
  '/cursos',
  '/eventos',
  '/herramientas',
  '/chat',
  '/perfil',
  '/ranking',
]

const AUTH_ROUTES = ['/login', '/register']
const PUBLIC_API_ROUTES = ['/api/public/']

export function middleware(request: NextRequest) {
  // ════════════════════════════════════════════════════════
  // DESARROLLO — no bloquear nada, navegar libremente
  // ════════════════════════════════════════════════════════
  if (IS_DEV || IS_TESTING) {
    return NextResponse.next()
  }

  // ════════════════════════════════════════════════════════
  // PRODUCCIÓN — protección completa
  // ════════════════════════════════════════════════════════
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  response.headers.set('X-Request-Id', crypto.randomUUID())

  // Cache headers para rutas protegidas
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // API keys para Zendu
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
    const apiKey = request.headers.get('x-api-key')
    const validKey = process.env.ZENDU_API_KEY
    if (validKey && apiKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized', code: 'INVALID_API_KEY' }, { status: 401 })
    }
  }

  // Protección de rutas por sesión
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  if (isProtected && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && sessionToken) {
    const userRole = request.cookies.get('vc-role')?.value
    const destination = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(userRole || '')
      ? '/admin'
      : '/feed'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Protección admin por rol
  if (pathname.startsWith('/admin')) {
    const userRole = request.cookies.get('vc-role')?.value
    if (sessionToken && userRole && !['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(userRole)) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  // Bloqueo de scanners
  const suspicious = [/\.\.\//,/\/\.env/,/\/wp-admin/,/\/phpinfo/,/\.php$/,/\/\.git/,/\/\.ssh/]
  if (suspicious.some((p) => p.test(pathname))) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)',],
}
