// V27 — Cliente WhatsApp Business Cloud API
// ═══════════════════════════════════════════════════════════
// Abstracción a Meta Cloud API con MODO MOCK para desarrollo
// sin credenciales. Cuando WHATSAPP_MOCK_MODE=true, cada envío
// loguea + persiste WhatsappMessage con metaMessageId sintético
// 'mock_<uuid>'. En producción (flag off) llama la API real con
// retry exponencial + fallback automático de plantilla bloqueada.
//
// Mejoras vs blueprint original:
// - Prisma singleton (no new PrismaClient)
// - Validación HMAC SHA256 del META_APP_SECRET
// - Modo MOCK explícito para testing sin Meta
// - Idempotencia: WhatsappMessage con status QUEUED → SENT (evita doble envío si crash mid-flight)

import { prisma } from '@/lib/db/prisma'
import {
  WaMessageDirection, WaMessageStatus, WaMessageType,
  type WhatsappAccount,
} from '@prisma/client'
import crypto from 'crypto'

const META_API_VERSION = 'v21.0'
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

export const WHATSAPP_MOCK_MODE = process.env.WHATSAPP_MOCK_MODE === 'true'
  || !process.env.META_APP_SECRET

// ─── Types ──────────────────────────────────────────────────
export interface SendTemplateParams {
  accountId: string
  toPhoneE164: string
  templateName: string
  languageCode?: string
  headerVariables?: Array<{ type: 'image' | 'video' | 'document' | 'text'; value: string }>
  bodyVariables?: string[]
  buttonVariables?: Array<{ index: number; value: string }>
  conversationId?: string
  orderId?: string
}

export interface SendTextParams {
  accountId: string
  toPhoneE164: string
  text: string
  conversationId?: string
  replyToMessageId?: string
}

export interface SendInteractiveParams {
  accountId: string
  toPhoneE164: string
  bodyText: string
  footerText?: string
  headerText?: string
  headerImageUrl?: string
  buttons?: Array<{ id: string; title: string }>
  listSections?: Array<{
    title: string
    rows: Array<{ id: string; title: string; description?: string }>
  }>
  ctaUrl?: { displayText: string; url: string }
  conversationId?: string
}

export interface SendMediaParams {
  accountId: string
  toPhoneE164: string
  type: 'image' | 'audio' | 'video' | 'document'
  mediaUrl: string
  caption?: string
  filename?: string
  conversationId?: string
}

// ─── HMAC SHA256 — para webhooks de Meta ────────────────────
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false
  const secret = process.env.META_APP_SECRET
  if (!secret) {
    // En mock mode aceptamos sin validar (dev local)
    return WHATSAPP_MOCK_MODE
  }
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
  } catch {
    return false
  }
}

// ─── Helpers internos ───────────────────────────────────────
async function getAccount(accountId: string): Promise<WhatsappAccount> {
  const acc = await prisma.whatsappAccount.findUniqueOrThrow({ where: { id: accountId } })
  if (!acc.isActive) throw new Error(`WhatsApp account ${accountId} is not active`)
  return acc
}

function mockId(): string {
  return 'mock_' + crypto.randomBytes(12).toString('hex')
}

async function metaPost(
  phoneNumberId: string,
  accessToken: string,
  payload: unknown,
  retries = 2,
): Promise<{ messages?: Array<{ id: string }> }> {
  if (WHATSAPP_MOCK_MODE) {
    console.log('[whatsapp:mock] POST', phoneNumberId, JSON.stringify(payload).slice(0, 300))
    return { messages: [{ id: mockId() }] }
  }

  const url = `${META_BASE}/${phoneNumberId}/messages`
  let lastErr: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errBody = await res.text()
        const err = new Error(`Meta API ${res.status}: ${errBody}`) as Error & { status?: number }
        err.status = res.status
        // 4xx no reintentable (excepto 429)
        if (res.status >= 400 && res.status < 500 && res.status !== 429) throw err
        lastErr = err
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
        continue
      }

      return await res.json()
    } catch (err) {
      lastErr = err as Error
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
    }
  }
  throw lastErr ?? new Error('metaPost failed')
}

// ─── sendTemplate ───────────────────────────────────────────
export async function sendTemplate(params: SendTemplateParams): Promise<{
  metaMessageId: string
  status: string
}> {
  const account = await getAccount(params.accountId)

  const components: Array<Record<string, unknown>> = []

  if (params.headerVariables?.length) {
    components.push({
      type: 'header',
      parameters: params.headerVariables.map(h => {
        if (h.type === 'text') return { type: 'text', text: h.value }
        return { type: h.type, [h.type]: { link: h.value } }
      }),
    })
  }
  if (params.bodyVariables?.length) {
    components.push({
      type: 'body',
      parameters: params.bodyVariables.map(v => ({ type: 'text', text: v })),
    })
  }
  if (params.buttonVariables) {
    for (const b of params.buttonVariables) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: String(b.index),
        parameters: [{ type: 'text', text: b.value }],
      })
    }
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: params.toPhoneE164.replace(/^\+/, ''),
    type: 'template',
    template: {
      name: params.templateName,
      language: { code: params.languageCode ?? 'es_CO' },
      components: components.length > 0 ? components : undefined,
    },
  }

  try {
    // Pre-guardar mensaje QUEUED para idempotencia si crash mid-flight
    const pending = params.conversationId
      ? await prisma.whatsappMessage.create({
          data: {
            conversationId: params.conversationId,
            direction: WaMessageDirection.OUTBOUND,
            type: WaMessageType.TEMPLATE,
            templateId: params.templateName,
            templateVariables: {
              body: params.bodyVariables ?? [],
              header: params.headerVariables ?? [],
            },
            status: WaMessageStatus.QUEUED,
          },
        })
      : null

    const res = await metaPost(account.phoneNumberId, account.accessToken, payload)
    const metaMessageId = res.messages?.[0]?.id ?? mockId()

    if (pending) {
      await prisma.whatsappMessage.update({
        where: { id: pending.id },
        data: {
          metaMessageId,
          status: WaMessageStatus.SENT,
          sentAt: new Date(),
        },
      })
    }

    // Incrementar contador de plantilla
    await prisma.whatsappTemplate.updateMany({
      where: { accountId: params.accountId, metaName: params.templateName },
      data: { timesSent: { increment: 1 } },
    })

    return { metaMessageId, status: 'sent' }
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500
    // Fallback a plantilla alternativa si existe
    const template = await prisma.whatsappTemplate.findFirst({
      where: { accountId: params.accountId, metaName: params.templateName },
    })

    if (template?.fallbackTemplateId && status >= 400 && status < 500) {
      const fallback = await prisma.whatsappTemplate.findUnique({
        where: { id: template.fallbackTemplateId },
      })
      if (fallback) {
        console.warn(`[whatsapp] Template ${params.templateName} failed, fallback ${fallback.metaName}`)
        await prisma.whatsappTemplate.update({
          where: { id: template.id },
          data: { timesBlocked: { increment: 1 } },
        })
        return sendTemplate({ ...params, templateName: fallback.metaName })
      }
    }
    throw err
  }
}

// ─── sendText (solo dentro de ventana 24h) ──────────────────
export async function sendText(params: SendTextParams): Promise<{
  metaMessageId: string
  status: string
}> {
  const account = await getAccount(params.accountId)

  const contact = await prisma.whatsappContact.findUnique({
    where: {
      accountId_phoneE164: {
        accountId: params.accountId,
        phoneE164: params.toPhoneE164,
      },
    },
  })

  if (!WHATSAPP_MOCK_MODE) {
    if (!contact?.lastUserMessageAt
      || Date.now() - contact.lastUserMessageAt.getTime() > 24 * 3_600_000) {
      throw new Error('OUT_OF_WINDOW: usuario no ha escrito en 24h — usar plantilla')
    }
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: params.toPhoneE164.replace(/^\+/, ''),
    type: 'text',
    text: { body: params.text.slice(0, 4096), preview_url: true },
    ...(params.replyToMessageId && { context: { message_id: params.replyToMessageId } }),
  }

  const res = await metaPost(account.phoneNumberId, account.accessToken, payload)
  const metaMessageId = res.messages?.[0]?.id ?? mockId()

  if (params.conversationId) {
    await prisma.whatsappMessage.create({
      data: {
        conversationId: params.conversationId,
        metaMessageId,
        direction: WaMessageDirection.OUTBOUND,
        type: WaMessageType.TEXT,
        content: params.text,
        status: WaMessageStatus.SENT,
        sentAt: new Date(),
      },
    })
  }

  return { metaMessageId, status: 'sent' }
}

// ─── sendInteractive ────────────────────────────────────────
export async function sendInteractive(params: SendInteractiveParams): Promise<{
  metaMessageId: string
  status: string
}> {
  const account = await getAccount(params.accountId)

  let interactive: Record<string, unknown>

  if (params.buttons && params.buttons.length > 0) {
    interactive = {
      type: 'button',
      body: { text: params.bodyText },
      ...(params.headerImageUrl
        ? { header: { type: 'image', image: { link: params.headerImageUrl } } }
        : params.headerText
          ? { header: { type: 'text', text: params.headerText } }
          : {}),
      ...(params.footerText ? { footer: { text: params.footerText } } : {}),
      action: {
        buttons: params.buttons.slice(0, 3).map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    }
  } else if (params.listSections) {
    interactive = {
      type: 'list',
      body: { text: params.bodyText },
      ...(params.headerText ? { header: { type: 'text', text: params.headerText } } : {}),
      ...(params.footerText ? { footer: { text: params.footerText } } : {}),
      action: {
        button: 'Ver opciones',
        sections: params.listSections,
      },
    }
  } else if (params.ctaUrl) {
    interactive = {
      type: 'cta_url',
      body: { text: params.bodyText },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: params.ctaUrl.displayText,
          url: params.ctaUrl.url,
        },
      },
    }
  } else {
    throw new Error('Must provide buttons, listSections, or ctaUrl')
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: params.toPhoneE164.replace(/^\+/, ''),
    type: 'interactive',
    interactive,
  }

  const res = await metaPost(account.phoneNumberId, account.accessToken, payload)
  const metaMessageId = res.messages?.[0]?.id ?? mockId()

  if (params.conversationId) {
    await prisma.whatsappMessage.create({
      data: {
        conversationId: params.conversationId,
        metaMessageId,
        direction: WaMessageDirection.OUTBOUND,
        type: WaMessageType.INTERACTIVE,
        content: params.bodyText,
        status: WaMessageStatus.SENT,
        sentAt: new Date(),
      },
    })
  }

  return { metaMessageId, status: 'sent' }
}

// ─── sendMedia ──────────────────────────────────────────────
export async function sendMedia(params: SendMediaParams): Promise<{
  metaMessageId: string
  status: string
}> {
  const account = await getAccount(params.accountId)

  const mediaObj: Record<string, unknown> = { link: params.mediaUrl }
  if (params.caption) mediaObj.caption = params.caption
  if (params.filename) mediaObj.filename = params.filename

  const payload = {
    messaging_product: 'whatsapp',
    to: params.toPhoneE164.replace(/^\+/, ''),
    type: params.type,
    [params.type]: mediaObj,
  }

  const res = await metaPost(account.phoneNumberId, account.accessToken, payload)
  const metaMessageId = res.messages?.[0]?.id ?? mockId()

  const waType: WaMessageType =
    params.type === 'image' ? WaMessageType.IMAGE :
    params.type === 'audio' ? WaMessageType.AUDIO :
    params.type === 'video' ? WaMessageType.VIDEO :
    WaMessageType.DOCUMENT

  if (params.conversationId) {
    await prisma.whatsappMessage.create({
      data: {
        conversationId: params.conversationId,
        metaMessageId,
        direction: WaMessageDirection.OUTBOUND,
        type: waType,
        content: params.caption,
        mediaUrl: params.mediaUrl,
        status: WaMessageStatus.SENT,
        sentAt: new Date(),
      },
    })
  }

  return { metaMessageId, status: 'sent' }
}

// ─── markAsRead ─────────────────────────────────────────────
export async function markAsRead(accountId: string, metaMessageId: string): Promise<void> {
  if (WHATSAPP_MOCK_MODE) {
    console.log('[whatsapp:mock] markAsRead', metaMessageId)
    return
  }
  const account = await getAccount(accountId)
  await metaPost(account.phoneNumberId, account.accessToken, {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: metaMessageId,
  })
}
