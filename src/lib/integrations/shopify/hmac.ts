import { createHmac, timingSafeEqual } from 'crypto'

// ── Verificación HMAC de Shopify ────────────────────────
// Shopify firma 2 cosas con HMAC-SHA256 + CLIENT_SECRET:
//
// 1. Query params del OAuth install/callback — firma es el campo `hmac`
//    del query. Los demás params se ordenan alfabéticamente y se unen
//    con "&", luego se hace hmac-sha256 hex.
//
// 2. Webhooks — firma viene en header X-Shopify-Hmac-Sha256 (base64).
//    Se computa sobre el body RAW exacto (no el parseado).
//
// Ambos se comparan con timingSafeEqual para evitar timing attacks.

function getSecret(): string | null {
  return process.env.SHOPIFY_CLIENT_SECRET || null
}

// ── HMAC de query params (OAuth callback) ──────────────

export function verifyOAuthHmac(query: Record<string, string | string[] | undefined>): boolean {
  const secret = getSecret()
  if (!secret) return false

  const { hmac, signature, ...rest } = query
  const providedHmac = typeof hmac === 'string' ? hmac : ''
  if (!providedHmac) return false

  // Shopify ordena alfabéticamente por key y une con "&"
  const sortedParams = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null)
    .sort()
    .map((k) => {
      const v = rest[k]
      const value = Array.isArray(v) ? v.join(',') : String(v)
      return `${k}=${value}`
    })
    .join('&')

  const computed = createHmac('sha256', secret).update(sortedParams).digest('hex')

  return safeCompare(providedHmac, computed)
}

// ── HMAC de webhook body (header X-Shopify-Hmac-Sha256) ──

export function verifyWebhookHmac(rawBody: string | Buffer, signatureHeader: string | null): boolean {
  const secret = getSecret()
  if (!secret || !signatureHeader) return false

  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')
  const computed = createHmac('sha256', secret).update(body, 'utf8').digest('base64')

  return safeCompare(signatureHeader, computed)
}

// ── Validación de shop domain ───────────────────────────
// Solo aceptamos subdominios myshopify.com. Previene SSRF si alguien
// intenta pasar cualquier URL al cliente.

const SHOP_DOMAIN_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i

export function isValidShopDomain(shop: string): boolean {
  if (!shop || typeof shop !== 'string') return false
  if (shop.length > 100) return false
  return SHOP_DOMAIN_RE.test(shop)
}

export function normalizeShopDomain(shop: string): string | null {
  if (!shop) return null
  const cleaned = shop.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return isValidShopDomain(cleaned) ? cleaned : null
}

// ── Timing-safe string compare ──────────────────────────

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}
