// ── Hashing seguro de contraseñas ───────────────────────
// Usa la Web Crypto API (disponible en Edge Runtime de Next.js).
// No depende de bcrypt ni librerías nativas.

const ITERATIONS = 100_000
const KEY_LENGTH = 64
const ALGORITHM = 'PBKDF2'
const HASH_ALGO = 'SHA-512'

/**
 * Genera un hash seguro de una contraseña.
 * Usa PBKDF2 con 100k iteraciones + salt aleatorio.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    ALGORITHM,
    false,
    ['deriveBits']
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    key,
    KEY_LENGTH * 8
  )

  const hashArray = new Uint8Array(derived)
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, '0')).join('')

  // Formato: algorithm$iterations$salt$hash
  return `pbkdf2$${ITERATIONS}$${saltHex}$${hashHex}`
}

/**
 * Verifica una contraseña contra su hash almacenado.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false
  }

  const iterations = parseInt(parts[1], 10)
  const salt = new Uint8Array(
    parts[2].match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  )

  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    ALGORITHM,
    false,
    ['deriveBits']
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt,
      iterations,
      hash: HASH_ALGO,
    },
    key,
    KEY_LENGTH * 8
  )

  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Comparación constante en tiempo para evitar timing attacks
  return timingSafeEqual(hashHex, parts[3])
}

/**
 * Genera un token criptográficamente seguro (para reset password, email verification, etc.)
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Comparación en tiempo constante para evitar timing attacks.
 * Compara dos strings sin revelar en qué posición difieren.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
