import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Middleware global de Vitalcom ───────────────────────
// Se ejecuta en CADA request. Maneja:
// 1. Protección de rutas por autenticación
// 2. Headers de seguridad runtime
// 3. Detección de bots/abuse básica

// Rutas que requieren autenticación
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

// Rutas de auth (si ya está logueado, redirigir)
const AUTH_ROUTES = ['/login', '/register']

// Rutas públicas de API para Zendu (requieren API key, no sesión)
const PUBLIC_API_ROUTES = ['/api/public/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // ── 1. Headers de seguridad runtime ────────────────
  // Nonce para CSP dinámico (futuro)
  response.headers.set('X-Request-Id', crypto.randomUUID())

  // Prevenir caching de páginas autenticadas
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // ── 2. Protección de APIs públicas (Zendu) ─────────
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
    const apiKey = request.headers.get('x-api-key')
    const validKey = process.env.ZENDU_API_KEY

    // Si hay API key configurada, verificar
    if (validKey && apiKey !== validKey) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_API_KEY' },
        { status: 401 }
      )
    }
  }

  // ── 3. Protección de rutas por sesión ──────────────
  // Verificamos la cookie de NextAuth
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  // Sin sesión intentando acceder a ruta protegida → login
  if (isProtected && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión intentando acceder a login/register → redirigir
  if (isAuthRoute && sessionToken) {
    // Determinar destino según la cookie de rol (se setea post-login)
    const userRole = request.cookies.get('vc-role')?.value
    const destination = userRole === 'SUPERADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER_AREA' || userRole === 'EMPLOYEE'
      ? '/admin'
      : '/feed'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // ── 4. Protección de rutas admin por rol ───────────
  if (pathname.startsWith('/admin')) {
    const userRole = request.cookies.get('vc-role')?.value
    const adminRoles = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE']

    // Si tiene sesión pero no rol admin → comunidad
    if (sessionToken && userRole && !adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  // ── 5. Bloqueo de rutas sospechosas ────────────────
  // Bloquear intentos comunes de path traversal y scanners
  const suspiciousPatterns = [
    /\.\.\//,        // path traversal
    /\/\.env/,       // acceso a env files
    /\/wp-admin/,    // WordPress scanners
    /\/phpinfo/,     // PHP scanners
    /\.php$/,        // PHP files
    /\/\.git/,       // Git directory
    /\/\.ssh/,       // SSH keys
  ]

  if (suspiciousPatterns.some((p) => p.test(pathname))) {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    )
  }

  return response
}

// Solo ejecutar middleware en estas rutas
export const config = {
  matcher: [
    // Todas las rutas excepto archivos estáticos y _next
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
}
