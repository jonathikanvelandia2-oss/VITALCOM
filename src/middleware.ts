import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ── Middleware de Vitalcom ───────────────────────────────
// DESARROLLO/TESTING: Pasa todo sin restricción.
// PRODUCCIÓN: Verifica JWT real de NextAuth, protege rutas por rol.
//
// IMPORTANTE: el bypass de dev ya NO depende de NODE_ENV (frágil,
// puede activarse accidentalmente en Vercel preview). Ahora requiere
// flag explícito VITALCOM_DEV_BYPASS=true. Si el flag no está presente,
// el middleware aplica protección completa aunque NODE_ENV sea development.

const IS_DEV_BYPASS = process.env.VITALCOM_DEV_BYPASS === 'true'
const IS_TESTING = process.env.NEXT_PUBLIC_TESTING_MODE === 'true'

const STAFF_ROLES = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE']

// Rutas protegidas
const PROTECTED_ROUTES = [
  '/admin',
  '/feed',
  '/cursos',
  '/eventos',
  '/herramientas',
  '/chat',
  '/perfil',
  '/ranking',
  '/mi-tienda',
  '/rendimiento',
  '/recursos',
]

const AUTH_ROUTES = ['/login', '/register']
const PUBLIC_API_ROUTES = ['/api/public/']

export async function middleware(request: NextRequest) {
  // ════════════════════════════════════════════════════════
  // DESARROLLO / TESTING — no bloquear nada
  // Solo si el flag explícito VITALCOM_DEV_BYPASS=true (o TESTING_MODE)
  // está presente. En producción debe estar ausente para activar RBAC real.
  // ════════════════════════════════════════════════════════
  if (IS_DEV_BYPASS || IS_TESTING) {
    return NextResponse.next()
  }

  // ════════════════════════════════════════════════════════
  // PRODUCCIÓN — protección con JWT real
  // ════════════════════════════════════════════════════════
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  response.headers.set('X-Request-Id', crypto.randomUUID())

  // Bloqueo de scanners (primero, antes de gastar CPU en JWT)
  const suspicious = [/\.\.\//,/\/\.env/,/\/wp-admin/,/\/phpinfo/,/\.php$/,/\/\.git/,/\/\.ssh/]
  if (suspicious.some((p) => p.test(pathname))) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  // API keys para Zendu
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
    const apiKey = request.headers.get('x-api-key')
    const validKey = process.env.ZENDU_API_KEY
    if (validKey && apiKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized', code: 'INVALID_API_KEY' }, { status: 401 })
    }
    return response
  }

  // Cache headers para rutas protegidas
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // Obtener token JWT real de NextAuth
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  // Rutas protegidas sin sesión → redirect a login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Rutas de auth con sesión activa → redirect según rol
  if (isAuthRoute && token) {
    const destination = STAFF_ROLES.includes(token.role as string) ? '/admin' : '/feed'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // /admin requiere rol de staff
  if (pathname.startsWith('/admin') && token) {
    if (!STAFF_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|presentacion|api/version|api/status).*)',],
}
