import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

// ── Cifrado de access tokens de Shopify ─────────────────
// Los tokens de Shopify permiten acceso completo a la tienda del merchant.
// Deben guardarse cifrados en reposo. Usamos AES-256-GCM (autenticado).
//
// Key requerida en env: VITALCOM_ENCRYPTION_KEY (32 bytes base64 o hex 64).
// Si la key no está, caemos a base64 plano con warning — permite dev sin
// credenciales pero NUNCA debe pasar así a producción.
//
// Formato del output cifrado: "v1:{iv_b64}:{authTag_b64}:{ciphertext_b64}"
// El prefijo de versión permite rotar el esquema en el futuro sin romper
// tokens ya guardados.

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12 // 96 bits — recomendado para GCM
const VERSION_TAG = 'v1'

function getEncryptionKey(): Buffer | null {
  const raw = process.env.VITALCOM_ENCRYPTION_KEY
  if (!raw) return null

  // Aceptar hex (64 chars) o base64 (44 chars ~ 32 bytes)
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Buffer.from(raw, 'hex')
    }
    const buf = Buffer.from(raw, 'base64')
    if (buf.length === 32) return buf
    // Fallback: hash para normalizar cualquier longitud a 32 bytes
    return createHash('sha256').update(raw).digest()
  } catch {
    return null
  }
}

export function encryptToken(plaintext: string): string {
  if (!plaintext) return ''
  const key = getEncryptionKey()

  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[shopify/crypto] VITALCOM_ENCRYPTION_KEY ausente en producción — token guardado en claro')
    } else {
      console.warn('[shopify/crypto] VITALCOM_ENCRYPTION_KEY ausente — token guardado en base64 (dev only)')
    }
    return `plain:${Buffer.from(plaintext, 'utf8').toString('base64')}`
  }

  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    VERSION_TAG,
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':')
}

export function decryptToken(payload: string): string {
  if (!payload) return ''

  // Fallback dev: token guardado en claro
  if (payload.startsWith('plain:')) {
    return Buffer.from(payload.slice(6), 'base64').toString('utf8')
  }

  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION_TAG) {
    throw new Error('SHOPIFY_TOKEN_INVALID_FORMAT')
  }

  const key = getEncryptionKey()
  if (!key) {
    throw new Error('SHOPIFY_TOKEN_KEY_MISSING')
  }

  const [, ivB64, authTagB64, ciphertextB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}

// Helper para generar una key nueva — imprimible desde scripts:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
export function generateKeyBase64(): string {
  return randomBytes(32).toString('base64')
}
