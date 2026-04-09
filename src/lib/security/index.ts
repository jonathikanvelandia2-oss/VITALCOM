// ── Security barrel export ──────────────────────────────
// Importar: import { rateLimit, sanitizeEmail, verifyCsrf } from '@/lib/security'

export { validateServerEnv, validateClientEnv } from './env'
export type { ServerEnv, ClientEnv } from './env'

export { rateLimit, rateLimitHeaders, RATE_LIMITS } from './rate-limit'

export {
  escapeHtml,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeFilename,
  truncate,
  isValidId,
  isValidCountry,
} from './sanitize'

export { verifyCsrf, requireCsrf } from './csrf'

export { hashPassword, verifyPassword, generateSecureToken } from './password'
