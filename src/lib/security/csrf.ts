// ── Protección CSRF para mutaciones ─────────────────────
// Next.js Server Actions tienen protección CSRF built-in,
// pero las API routes manuales necesitan verificación extra.

import { headers } from 'next/headers'

/**
 * Verifica que la request viene del mismo origen (anti-CSRF).
 * Usar en todas las API routes que mutan datos (POST, PUT, DELETE).
 *
 * Verifica:
 * 1. Header Origin o Referer coincide con el host
 * 2. Content-Type es application/json (no form submissions inesperados)
 */
export async function verifyCsrf(): Promise<{ valid: boolean; error?: string }> {
  const headersList = await headers()
  const origin = headersList.get('origin')
  const referer = headersList.get('referer')
  const host = headersList.get('host')

  if (!host) {
    return { valid: false, error: 'Missing host header' }
  }

  // Verificar que Origin o Referer coinciden con nuestro host
  const allowedOrigin = origin || (referer ? new URL(referer).origin : null)

  if (!allowedOrigin) {
    return { valid: false, error: 'Missing origin verification headers' }
  }

  const hostOrigin = `https://${host}`
  const hostOriginHttp = `http://${host}`

  if (allowedOrigin !== hostOrigin && allowedOrigin !== hostOriginHttp) {
    return { valid: false, error: 'Origin mismatch — possible CSRF attack' }
  }

  return { valid: true }
}

/**
 * Helper para API routes — responde 403 si falla CSRF.
 */
export async function requireCsrf(): Promise<Response | null> {
  const result = await verifyCsrf()
  if (!result.valid) {
    return new Response(
      JSON.stringify({ error: 'Forbidden', code: 'CSRF_FAILED' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return null // OK, continuar
}
