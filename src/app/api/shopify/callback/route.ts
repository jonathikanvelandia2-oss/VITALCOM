import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandler } from '@/lib/api/response'
import { exchangeCodeForToken } from '@/lib/integrations/shopify/oauth'
import { verifyOAuthHmac, normalizeShopDomain } from '@/lib/integrations/shopify/hmac'
import { encryptToken } from '@/lib/integrations/shopify/crypto'
import { ShopifyClient } from '@/lib/integrations/shopify/client'
import { captureException } from '@/lib/observability'
import { writeAuditLog, extractRequestMeta } from '@/lib/audit/logger'

// ── GET /api/shopify/callback ──────────────────────────
// Shopify redirige aquí después de que el merchant acepta los permisos.
// Query: ?code=...&hmac=...&shop=...&state=...&timestamp=...
//
// Pasos de seguridad antes de guardar el token:
// 1. Verificar HMAC del query (confirma que viene de Shopify)
// 2. Verificar state contra cookie (previene CSRF)
// 3. Verificar shop domain (formato + coincide con el de la cookie)
// 4. Intercambiar code por access_token
// 5. Cifrar token con AES-256-GCM y persistir

const STATE_COOKIE = 'shopify_oauth_state'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://vitalcom.vercel.app').replace(/\/$/, '')

// Topics a suscribir automáticamente al instalarse la app.
// `app/uninstalled` es el más crítico: cuando el merchant desinstala,
// Shopify avisa para que limpiemos su token y marquemos la tienda inactiva.
const AUTO_WEBHOOKS: Array<{ topic: string; path: string }> = [
  { topic: 'orders/create', path: '/api/shopify/webhooks' },
  { topic: 'orders/paid', path: '/api/shopify/webhooks' },
  { topic: 'orders/fulfilled', path: '/api/shopify/webhooks' },
  { topic: 'orders/cancelled', path: '/api/shopify/webhooks' },
  { topic: 'app/uninstalled', path: '/api/shopify/webhooks' },
]

export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url)
  const query: Record<string, string> = {}
  url.searchParams.forEach((v, k) => {
    query[k] = v
  })

  // 1. HMAC — confirma que realmente Shopify nos redirige
  if (!verifyOAuthHmac(query)) {
    return redirectWithError('hmac_invalid', 'Firma HMAC inválida')
  }

  const code = query.code
  const rawShop = query.shop
  const state = query.state
  const shop = rawShop ? normalizeShopDomain(rawShop) : null

  if (!code || !shop || !state) {
    return redirectWithError('missing_params', 'Faltan parámetros del callback')
  }

  // 2. State — contra el cookie guardado en /install
  const cookieStore = await cookies()
  const stored = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)

  if (!stored) {
    return redirectWithError('state_missing', 'Sesión OAuth expirada. Reintenta.')
  }

  const [storedState, storedUserId, storedShop] = stored.split('.')
  if (storedState !== state) {
    return redirectWithError('state_mismatch', 'State inválido (posible CSRF)')
  }
  if (storedShop !== shop) {
    return redirectWithError('shop_mismatch', 'Dominio de tienda no coincide')
  }
  if (!storedUserId) {
    return redirectWithError('user_missing', 'Usuario no identificado')
  }

  // 3. Exchange code → access_token
  const tokenResponse = await exchangeCodeForToken(shop, code)

  // 4. Obtener info de la tienda para guardar nombre / moneda
  let shopInfo
  try {
    const client = new ShopifyClient(shop, tokenResponse.access_token)
    shopInfo = await client.getShop()
  } catch (err) {
    console.error('[shopify/callback] No pudimos obtener info de la tienda', err)
    // No bloqueamos: guardamos lo que tenemos y el sync posterior actualiza.
  }

  // 5. Persistir cifrado
  const encrypted = encryptToken(tokenResponse.access_token)
  const now = new Date()

  await prisma.shopifyStore.upsert({
    where: { shopDomain: shop },
    create: {
      userId: storedUserId,
      shopDomain: shop,
      storeName: shopInfo?.name || shop.replace('.myshopify.com', ''),
      accessToken: encrypted,
      status: 'active',
      plan: shopInfo?.plan_display_name || null,
      connectedAt: now,
      lastSyncAt: now,
    },
    update: {
      userId: storedUserId,
      storeName: shopInfo?.name || undefined,
      accessToken: encrypted,
      status: 'active',
      plan: shopInfo?.plan_display_name || undefined,
      connectedAt: now,
      lastSyncAt: now,
    },
  })

  // 6. Registrar webhooks fire-and-forget. Si Shopify ya tenía alguno, devuelve
  //    409 duplicate y lo ignoramos. No bloqueamos el flujo si falla — la UI
  //    permitirá re-sincronizar después.
  const client = new ShopifyClient(shop, tokenResponse.access_token)
  const webhookResults = await Promise.allSettled(
    AUTO_WEBHOOKS.map((w) => client.registerWebhook(w.topic, `${APP_URL}${w.path}`)),
  )
  const webhookFailures = webhookResults
    .map((r, i) => ({ topic: AUTO_WEBHOOKS[i].topic, result: r }))
    .filter((x) => x.result.status === 'rejected')

  if (webhookFailures.length > 0) {
    captureException(new Error('SHOPIFY_WEBHOOK_REGISTRATION_PARTIAL'), {
      route: '/api/shopify/callback',
      tags: { stage: 'webhook-register' },
      extra: {
        shop,
        failures: webhookFailures.map((f) => ({
          topic: f.topic,
          reason: (f.result as PromiseRejectedResult).reason?.message ?? 'unknown',
        })),
      },
    })
  }

  // 7. Audit log — registro de instalación exitosa
  const meta = extractRequestMeta(req)
  writeAuditLog({
    resource: 'ADMIN_CONFIG',
    action: 'OTHER',
    summary: `Tienda Shopify conectada: ${shop}`,
    actor: { id: storedUserId, email: null, role: null },
    metadata: {
      shop,
      storeName: shopInfo?.name ?? null,
      plan: shopInfo?.plan_display_name ?? null,
      webhooksRegistered: AUTO_WEBHOOKS.length - webhookFailures.length,
      webhooksFailed: webhookFailures.length,
    },
    ip: meta.ip,
    userAgent: meta.userAgent,
  })

  return NextResponse.redirect(`${APP_URL}/mi-tienda?connected=1&shop=${encodeURIComponent(shop)}`)
})

function redirectWithError(code: string, message: string) {
  console.warn('[shopify/callback] rechazado', { code, message })
  const params = new URLSearchParams({ error: code, error_description: message })
  return NextResponse.redirect(`${APP_URL}/mi-tienda?${params.toString()}`)
}
