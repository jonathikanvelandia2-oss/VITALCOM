// V27 — Webhook WhatsApp Business Cloud API (Meta)
// ═══════════════════════════════════════════════════════════
// GET: verificación del webhook por Meta (hub.challenge)
// POST: mensajes entrantes + delivery receipts
//
// Con HMAC validation por x-hub-signature-256 + META_APP_SECRET.
// Idempotencia via WhatsappMessage.metaMessageId @unique.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyMetaSignature, sendText } from '@/lib/whatsapp/client'
import { advanceOnReply, startWorkflow } from '@/lib/flows/workflow-engine'
import { classify } from '@/lib/ai/intent-classifier'
import { rateLimitWebhook, getClientKey } from '@/lib/security/rate-limit-webhook'
import {
  isOptOutMessage,
  isOptInMessage,
  OPT_OUT_CONFIRMATION_TEXT,
  OPT_IN_CONFIRMATION_TEXT,
} from '@/lib/whatsapp/opt-out'
import {
  WaMessageDirection, WaMessageStatus, WaMessageType,
  WaWorkflowTrigger,
} from '@prisma/client'

export const dynamic = 'force-dynamic'

// ─── GET: verificación de webhook por Meta ──────────────────
export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !token || !challenge) {
    return new NextResponse('Bad request', { status: 400 })
  }

  const account = await prisma.whatsappAccount.findFirst({
    where: { webhookVerifyToken: token, isActive: true },
  })

  if (!account) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return new NextResponse(challenge, { status: 200 })
}

// ─── POST: mensajes entrantes ───────────────────────────────
export async function POST(req: Request) {
  const rate = rateLimitWebhook(getClientKey(req, 'meta'))
  if (!rate.allowed) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
    })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256')

  if (!verifyMetaSignature(rawBody, signature)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Respuesta rápida a Meta (requisito de la API)
  let payload: MetaWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad JSON', { status: 400 })
  }

  // Procesar async sin bloquear la respuesta
  processPayload(payload).catch(err => {
    console.error('[webhooks/whatsapp] processing failed:', err)
  })

  return NextResponse.json({ received: true })
}

// ─── Types del payload Meta ─────────────────────────────────
interface MetaWebhookPayload {
  object?: string
  entry?: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product?: string
        metadata?: { phone_number_id: string; display_phone_number?: string }
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>
        messages?: Array<MetaInboundMessage>
        statuses?: Array<MetaStatusUpdate>
      }
      field?: string
    }>
  }>
}

interface MetaInboundMessage {
  id: string
  from: string
  timestamp: string
  type: string
  text?: { body: string }
  image?: { id: string; mime_type?: string; caption?: string }
  audio?: { id: string; mime_type?: string }
  video?: { id: string; mime_type?: string }
  document?: { id: string; filename?: string; mime_type?: string }
  button?: { payload?: string; text?: string }
  interactive?: {
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string; description?: string }
  }
}

interface MetaStatusUpdate {
  id: string
  status: string
  timestamp: string
  recipient_id: string
}

// ─── Procesador principal ───────────────────────────────────
async function processPayload(payload: MetaWebhookPayload): Promise<void> {
  if (!payload.entry) return

  for (const entry of payload.entry) {
    for (const change of entry.changes ?? []) {
      const phoneNumberId = change.value.metadata?.phone_number_id
      if (!phoneNumberId) continue

      const account = await prisma.whatsappAccount.findUnique({
        where: { phoneNumberId },
      })
      if (!account) continue

      // Dedup por message.id via WhatsappMessage @unique
      for (const msg of change.value.messages ?? []) {
        await processInboundMessage(account.id, msg, change.value.contacts?.[0]?.profile?.name)
      }

      for (const status of change.value.statuses ?? []) {
        await processStatusUpdate(status)
      }
    }
  }
}

async function processInboundMessage(
  accountId: string,
  msg: MetaInboundMessage,
  profileName?: string,
): Promise<void> {
  const phoneE164 = '+' + msg.from.replace(/^\+/, '')

  // Dedup
  const existing = await prisma.whatsappMessage.findUnique({
    where: { metaMessageId: msg.id },
  })
  if (existing) return

  // Upsert contact (activa ventana 24h)
  const contact = await prisma.whatsappContact.upsert({
    where: { accountId_phoneE164: { accountId, phoneE164 } },
    create: {
      accountId,
      phoneE164,
      firstName: profileName?.split(' ')[0],
      lastName: profileName?.split(' ').slice(1).join(' ') || undefined,
      lastUserMessageAt: new Date(),
      lastInteractionAt: new Date(),
    },
    update: {
      lastUserMessageAt: new Date(),
      lastInteractionAt: new Date(),
    },
  })

  // Obtener/crear conversación activa
  let conversation = await prisma.whatsappConversation.findFirst({
    where: { accountId, contactId: contact.id, status: 'active' },
  })

  if (!conversation) {
    conversation = await prisma.whatsappConversation.create({
      data: {
        accountId,
        contactId: contact.id,
        status: 'active',
        windowExpiresAt: new Date(Date.now() + 24 * 3_600_000),
      },
    })
  } else {
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { windowExpiresAt: new Date(Date.now() + 24 * 3_600_000) },
    })
  }

  // Determinar type + content
  let type: WaMessageType = WaMessageType.TEXT
  let content: string | null = null
  let mediaUrl: string | null = null
  let buttonReplyId: string | null = null
  let buttonReplyTitle: string | null = null

  switch (msg.type) {
    case 'text':
      content = msg.text?.body ?? null
      type = WaMessageType.TEXT
      break
    case 'image':
      type = WaMessageType.IMAGE
      content = msg.image?.caption ?? null
      mediaUrl = msg.image?.id ? `meta:${msg.image.id}` : null
      break
    case 'audio':
      type = WaMessageType.AUDIO
      mediaUrl = msg.audio?.id ? `meta:${msg.audio.id}` : null
      break
    case 'video':
      type = WaMessageType.VIDEO
      mediaUrl = msg.video?.id ? `meta:${msg.video.id}` : null
      break
    case 'document':
      type = WaMessageType.DOCUMENT
      mediaUrl = msg.document?.id ? `meta:${msg.document.id}` : null
      content = msg.document?.filename ?? null
      break
    case 'interactive':
      type = WaMessageType.INTERACTIVE
      buttonReplyId = msg.interactive?.button_reply?.id ?? msg.interactive?.list_reply?.id ?? null
      buttonReplyTitle = msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? null
      content = buttonReplyTitle
      break
    case 'button':
      type = WaMessageType.BUTTON
      buttonReplyId = msg.button?.payload ?? null
      buttonReplyTitle = msg.button?.text ?? null
      content = buttonReplyTitle
      break
    default:
      content = `(Meta type: ${msg.type})`
  }

  // Clasificar intent con el classifier V26
  let detectedIntent: string | null = null
  if (content) {
    const classification = classify(content)
    detectedIntent = classification.agent.toLowerCase()
  }

  await prisma.whatsappMessage.create({
    data: {
      conversationId: conversation.id,
      metaMessageId: msg.id,
      direction: WaMessageDirection.INBOUND,
      type,
      content,
      mediaUrl,
      buttonReplyId,
      buttonReplyTitle,
      status: WaMessageStatus.DELIVERED,
      intent: detectedIntent,
    },
  })

  await prisma.whatsappConversation.update({
    where: { id: conversation.id },
    data: { messagesIn: { increment: 1 } },
  })

  // V30 — Opt-out / opt-in: corta todo el resto del procesamiento
  if (content && isOptOutMessage(content)) {
    await handleOptOut(accountId, contact.id, conversation.id, phoneE164)
    return
  }
  if (content && isOptInMessage(content) && contact.isOptedIn === false) {
    await handleOptIn(accountId, contact.id, conversation.id, phoneE164)
    return
  }

  // 1) Avanzar workflows que esperaban reply
  await advanceOnReply(conversation.id)

  // 2) Disparar workflows con trigger MESSAGE_RECEIVED si hay match
  await tryTriggerMessageWorkflows(accountId, contact.id, conversation.id, content ?? '')
}

async function handleOptOut(
  accountId: string,
  contactId: string,
  conversationId: string,
  phoneE164: string,
): Promise<void> {
  await prisma.whatsappContact.update({
    where: { id: contactId },
    data: {
      isOptedIn: false,
      optedOutAt: new Date(),
      optOutSource: 'stop_keyword',
    },
  })

  // Cancelar ejecuciones de workflows activas para este contacto
  await prisma.waExecution.updateMany({
    where: { contactId, status: 'RUNNING' },
    data: { status: 'CANCELLED', completedAt: new Date() },
  }).catch(err => console.error('[opt-out] cancel executions:', err))

  // Confirmación dentro de ventana 24h (el usuario acaba de escribir)
  try {
    await sendText({
      accountId,
      toPhoneE164: phoneE164,
      text: OPT_OUT_CONFIRMATION_TEXT,
      conversationId,
    })
  } catch (err) {
    console.error('[opt-out] confirm send failed:', err)
  }
}

async function handleOptIn(
  accountId: string,
  contactId: string,
  conversationId: string,
  phoneE164: string,
): Promise<void> {
  await prisma.whatsappContact.update({
    where: { id: contactId },
    data: {
      isOptedIn: true,
      optedOutAt: null,
      optOutSource: null,
    },
  })

  try {
    await sendText({
      accountId,
      toPhoneE164: phoneE164,
      text: OPT_IN_CONFIRMATION_TEXT,
      conversationId,
    })
  } catch (err) {
    console.error('[opt-in] confirm send failed:', err)
  }
}

async function processStatusUpdate(status: MetaStatusUpdate): Promise<void> {
  const message = await prisma.whatsappMessage.findUnique({
    where: { metaMessageId: status.id },
  })
  if (!message) return

  const data: Record<string, unknown> = {}
  if (status.status === 'delivered') {
    data.status = WaMessageStatus.DELIVERED
    data.deliveredAt = new Date()
  } else if (status.status === 'read') {
    data.status = WaMessageStatus.READ
    data.readAt = new Date()
  } else if (status.status === 'failed') {
    data.status = WaMessageStatus.FAILED
  }

  if (Object.keys(data).length > 0) {
    await prisma.whatsappMessage.update({
      where: { id: message.id },
      data,
    })
  }
}

// Intenta disparar workflows de tipo MESSAGE_RECEIVED cuya regla semántica matchee
async function tryTriggerMessageWorkflows(
  accountId: string,
  contactId: string,
  conversationId: string,
  text: string,
): Promise<void> {
  if (!text || text.length < 2) return

  const workflows = await prisma.waWorkflow.findMany({
    where: {
      accountId,
      isActive: true,
      triggerType: WaWorkflowTrigger.MESSAGE_RECEIVED,
    },
  })

  // Regla semántica simple: keyword case-insensitive presente en texto
  const textLower = text.toLowerCase()

  for (const wf of workflows) {
    const cfg = wf.triggerConfig as { keywords?: string[]; intents?: string[] }
    const keywords = cfg?.keywords ?? []
    const matches =
      keywords.some((kw) => textLower.includes(kw.toLowerCase())) ||
      /confirm|ya, envi|si,? envi|listo,? envi|ok confirm/i.test(text)

    if (!matches) continue

    await startWorkflow({
      workflowId: wf.id,
      contactId,
      conversationId,
    }).catch(err => console.error('[webhook] startWorkflow failed:', err))
  }
}
