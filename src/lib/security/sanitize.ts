// ── Sanitización y validación de inputs ─────────────────
// Protección contra XSS, inyección SQL, y datos malformados.
// Usar en TODOS los endpoints que reciben input del usuario.

/**
 * Escapa caracteres HTML peligrosos.
 * Usar para cualquier string que se va a renderizar en el DOM.
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return str.replace(/[&<>"'/]/g, (char) => map[char])
}

/**
 * Limpia un string de caracteres peligrosos para logs/BD.
 * No altera acentos ni caracteres españoles válidos.
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .trim()
}

/**
 * Valida y sanitiza un email.
 */
export function sanitizeEmail(email: string): string | null {
  const cleaned = email.toLowerCase().trim()
  // RFC 5322 simplificado — suficiente para validación de frontend
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(cleaned) ? cleaned : null
}

/**
 * Valida un número de teléfono (LATAM: CO, EC, GT, CL).
 * Permite formatos: +57 300 123 4567, 3001234567, etc.
 */
export function sanitizePhone(phone: string): string | null {
  const digits = phone.replace(/[\s\-\(\)\.]/g, '')
  // Mínimo 7 dígitos (fijo), máximo 15 (E.164)
  if (!/^\+?\d{7,15}$/.test(digits)) return null
  return digits
}

/**
 * Previene ataques de path traversal en nombres de archivo.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.') // no ..
    .slice(0, 255)
}

/**
 * Trunca un string a un largo máximo seguro.
 * Usar para limitar inputs de texto libre (bio, descripciones, etc.)
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength)
}

/**
 * Valida que un string es un UUID v4 válido (para IDs de Prisma/cuid).
 */
export function isValidId(id: string): boolean {
  // cuid pattern o UUID v4
  return /^c[a-z0-9]{24}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Valida que un país es uno de los 4 soportados.
 */
export function isValidCountry(country: string): country is 'CO' | 'EC' | 'GT' | 'CL' {
  return ['CO', 'EC', 'GT', 'CL'].includes(country)
}
