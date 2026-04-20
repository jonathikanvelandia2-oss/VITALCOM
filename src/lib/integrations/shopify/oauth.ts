import { randomBytes } from 'crypto'
import { SHOPIFY_SCOPES } from './scopes'
import { isValidShopDomain } from './hmac'

// ── OAuth de Shopify — install + token exchange ────────
// Flujo estándar "authorization code grant":
// 1. User llega a /api/shopify/install?shop=xxx
// 2. Redirigimos a https://{shop}/admin/oauth/authorize?...
// 3. Merchant acepta en Shopify → Shopify redirige a nuestro /callback
//    con ?code=...&hmac=...&shop=...&state=...
// 4. Verificamos HMAC + state, intercambiamos code por access_token
//    vía POST https://{shop}/admin/oauth/access_token

export type OAuthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getOAuthConfig(): OAuthConfig | null {
  const clientId = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitalcom.vercel.app'

  if (!clientId || !clientSecret) return null

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl.replace(/\/$/, '')}/api/shopify/callback`,
  }
}

export function generateState(): string {
  return randomBytes(32).toString('hex')
}

export function buildAuthorizeUrl(shop: string, state: string): string | null {
  if (!isValidShopDomain(shop)) return null
  const config = getOAuthConfig()
  if (!config) return null

  const params = new URLSearchParams({
    client_id: config.clientId,
    scope: SHOPIFY_SCOPES,
    redirect_uri: config.redirectUri,
    state,
    // grant_options[]=per-user lo usaríamos para tokens por usuario;
    // omitido = offline token (recomendado para integración merchant-wide).
  })

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`
}

export type TokenResponse = {
  access_token: string
  scope: string
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<TokenResponse> {
  if (!isValidShopDomain(shop)) {
    throw new Error('SHOPIFY_INVALID_SHOP')
  }
  const config = getOAuthConfig()
  if (!config) {
    throw new Error('SHOPIFY_OAUTH_NOT_CONFIGURED')
  }

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`SHOPIFY_TOKEN_EXCHANGE_FAILED: ${res.status} ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as TokenResponse
  if (!json.access_token) throw new Error('SHOPIFY_TOKEN_MISSING_IN_RESPONSE')

  return json
}
