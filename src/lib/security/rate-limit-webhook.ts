// V28 — Rate limiting in-memory para webhooks
// ═══════════════════════════════════════════════════════════
// Limita requests por IP + source a 60/min. Suficiente para
// Shopify/Meta/Effi. En V29 migrar a Upstash Redis si crece.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const LIMIT = 60       // 60 requests por ventana
const WINDOW_MS = 60_000

// Cleanup periódico (evitar memory leak)
let lastCleanup = Date.now()
function maybeCleanup() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60_000) return
  lastCleanup = now
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimitWebhook(key: string): RateLimitResult {
  maybeCleanup()
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: LIMIT - 1, resetAt: now + WINDOW_MS }
  }

  if (bucket.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count++
  return { allowed: true, remaining: LIMIT - bucket.count, resetAt: bucket.resetAt }
}

// Obtener IP desde headers de Next.js (detrás de proxy en Vercel)
export function getClientKey(req: Request, source: string): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  return `${source}:${ip}`
}
