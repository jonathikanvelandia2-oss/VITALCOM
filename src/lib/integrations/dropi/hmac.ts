import { createHmac, timingSafeEqual } from 'node:crypto'

// ── HMAC para webhooks de Dropi ────────────────────────
// Dropi firma cada webhook con HMAC-SHA256 sobre el body RAW usando
// DROPI_WEBHOOK_SECRET. El header puede ser hex o base64 según config.
// Verificamos ambos formatos y comparamos en tiempo constante.

const HEADER_NAME = 'x-dropi-signature'

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

/**
 * Verifica la firma HMAC del webhook de Dropi.
 * Acepta firmas en hex o base64.
 * Si el secret no está configurado, retorna false (no pasa ningún webhook).
 */
export function verifyDropiWebhook(
  rawBody: string | Buffer,
  signatureHeader: string | null
): boolean {
  const secret = process.env.DROPI_WEBHOOK_SECRET
  if (!secret || !signatureHeader) return false

  const received = signatureHeader.replace(/^sha256=/i, '').trim()

  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')

  const mac = createHmac('sha256', secret).update(body, 'utf8')
  const expectedHex = mac.digest('hex')

  // Reinstanciar para la otra codificación (los HMAC son stateful)
  const mac2 = createHmac('sha256', secret).update(body, 'utf8')
  const expectedB64 = mac2.digest('base64')

  return safeCompare(received.toLowerCase(), expectedHex.toLowerCase()) ||
         safeCompare(received, expectedB64)
}

export { HEADER_NAME as DROPI_SIGNATURE_HEADER }
