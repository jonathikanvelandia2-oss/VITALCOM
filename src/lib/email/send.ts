import { Resend } from 'resend'

// ── Cliente Resend singleton ────────────────────────────
// Lazy: solo instancia si hay API key. Permite build sin credenciales.

let resendClient: Resend | null = null

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean }

const DEFAULT_FROM = 'Vitalcom <noreply@vitalcom.co>'
const MAX_RETRIES = 2

// ── Enviar email con retry exponencial ──────────────────
// No lanza excepción — devuelve result discriminado para que
// el caller decida si el fallo es crítico o fire-and-forget.

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getClient()

  if (!client) {
    console.warn('[email] RESEND_API_KEY no configurada — email no enviado', { to: input.to, subject: input.subject })
    return { ok: false, error: 'RESEND_NOT_CONFIGURED', skipped: true }
  }

  const from = input.from || process.env.EMAIL_FROM || DEFAULT_FROM

  let lastError: unknown = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await client.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
        tags: input.tags,
      })

      if (error) {
        lastError = error
        if (attempt < MAX_RETRIES && isRetryable(error)) {
          await sleep(250 * Math.pow(2, attempt))
          continue
        }
        console.error('[email] Resend devolvió error', { error, to: input.to, subject: input.subject })
        return { ok: false, error: error.message || 'RESEND_ERROR' }
      }

      return { ok: true, id: data?.id ?? 'unknown' }
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES) {
        await sleep(250 * Math.pow(2, attempt))
        continue
      }
      console.error('[email] Fallo catastrófico enviando email', { err, to: input.to, subject: input.subject })
      return { ok: false, error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' }
    }
  }

  return { ok: false, error: (lastError as Error)?.message || 'UNKNOWN_ERROR' }
}

function isRetryable(error: { name?: string; statusCode?: number }): boolean {
  if (!error) return false
  if (error.statusCode && error.statusCode >= 500) return true
  if (error.statusCode === 429) return true
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
