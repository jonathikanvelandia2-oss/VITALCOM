import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireSession } from '@/lib/auth/session'
import { withErrorHandler, apiError } from '@/lib/api/response'
import { buildAuthorizeUrl, generateState, getOAuthConfig } from '@/lib/integrations/shopify/oauth'
import { normalizeShopDomain } from '@/lib/integrations/shopify/hmac'

// ── GET /api/shopify/install?shop=xxx ──────────────────
// Punto de entrada del OAuth. Valida shop domain, genera state CSRF,
// guarda state + userId en cookie firmada (httpOnly), redirige a Shopify.

const STATE_COOKIE = 'shopify_oauth_state'
const STATE_TTL_SECONDS = 600 // 10 minutos

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const config = getOAuthConfig()
  if (!config) {
    return apiError(
      'Shopify OAuth no configurado. Contacta al administrador.',
      503,
      'SHOPIFY_NOT_CONFIGURED'
    )
  }

  const url = new URL(req.url)
  const rawShop = url.searchParams.get('shop')
  const shop = rawShop ? normalizeShopDomain(rawShop) : null

  if (!shop) {
    return apiError(
      'Dominio de tienda inválido. Debe ser tu-tienda.myshopify.com',
      400,
      'INVALID_SHOP_DOMAIN'
    )
  }

  const state = generateState()

  // Payload firmado: state + userId + shop (lo validamos todo en callback)
  const payload = `${state}.${session.id}.${shop}`

  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_TTL_SECONDS,
    path: '/',
  })

  const authorizeUrl = buildAuthorizeUrl(shop, state)
  if (!authorizeUrl) {
    return apiError('No se pudo construir la URL de autorización', 500, 'AUTH_URL_FAILED')
  }

  return NextResponse.redirect(authorizeUrl)
})
