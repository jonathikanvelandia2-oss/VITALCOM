// ── Rate limiter en memoria para API routes ─────────────
// Protege contra abuso, brute force, y DDoS básico.
// En producción con múltiples instancias, migrar a Redis (Upstash).

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpieza periódica para evitar memory leaks
const CLEANUP_INTERVAL = 60_000 // 1 minuto
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, CLEANUP_INTERVAL)

type RateLimitConfig = {
  /** Máximo de requests por ventana */
  maxRequests: number
  /** Ventana de tiempo en milisegundos */
  windowMs: number
}

// Presets para diferentes endpoints
export const RATE_LIMITS = {
  /** Login / register — protección contra brute force */
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 } as RateLimitConfig,
  /** API general — uso normal */
  api: { maxRequests: 100, windowMs: 60 * 1000 } as RateLimitConfig,
  /** APIs públicas (Zendu, etc.) — con API key */
  publicApi: { maxRequests: 60, windowMs: 60 * 1000 } as RateLimitConfig,
  /** Acciones sensibles (cambio password, delete) */
  sensitive: { maxRequests: 3, windowMs: 15 * 60 * 1000 } as RateLimitConfig,
} as const

type RateLimitResult = {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Verifica si un identificador (IP, userId, etc.) puede hacer la request.
 * Devuelve headers para incluir en la respuesta.
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const entry = store.get(key)

  // Primera request o ventana expirada
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Dentro de la ventana
  entry.count++

  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Genera headers de rate limit para la respuesta HTTP.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.success ? {} : { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  }
}
