// V27 — Webhook Effi/Dropi (guide_generated, delivery_exception)
// ═══════════════════════════════════════════════════════════
// Dispara FLOW_SHIPPED al generar guía y FLOW_DELIVERY_ISSUE
// al reportarse novedad. Validación HMAC por EFFI_WEBHOOK_SECRET.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { startWorkflow } from '@/lib/flows/workflow-engine'
import { WaWorkflowTrigger } from '@prisma/client'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function verifyEffiSignature(rawBody: string, sigHeader: string | null): boolean {
  if (!sigHeader) return false
  const secret = process.env.EFFI_WEBHOOK_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigHeader))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('x-effi-signature')

  if (!verifyEffiSignature(rawBody, sig)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let payload: EffiWebhookPayload
  try {
    payload = JSON.parse(rawBody) as EffiWebhookPayload
  } catch {
    return new NextResponse('Bad JSON', { status: 400 })
  }

  if (payload.event_id) {
    const existing = await prisma.webhookEvent.findUnique({
      where: { source_externalId: { source: 'effi', externalId: payload.event_id } },
    })
    if (existing) return NextResponse.json({ deduped: true })

    await prisma.webhookEvent.create({
      data: { source: 'effi', externalId: payload.event_id, topic: payload.event },
    }).catch(() => {})
  }

  processEffiEvent(payload).catch(err => console.error('[webhooks/effi] failed:', err))

  return NextResponse.json({ received: true })
}

interface EffiWebhookPayload {
  event_id?: string
  event: string                                        // guide_generated | delivery_exception | delivered
  order_id: string                                     // Vitalcom order ID
  tracking_number?: string
  carrier?: string
  exception_reason?: string
  delivered_at?: string
}

async function processEffiEvent(payload: EffiWebhookPayload): Promise<void> {
  const orderLink = await prisma.whatsappOrderLink.findUnique({
    where: { orderId: payload.order_id },
    include: { contact: { include: { account: true } } },
  })
  if (!orderLink) return

  if (payload.event === 'guide_generated') {
    await prisma.whatsappOrderLink.update({
      where: { orderId: payload.order_id },
      data: {
        fulfillmentId: payload.order_id,
        trackingNumber: payload.tracking_number,
        carrier: payload.carrier,
        shippedAt: new Date(),
      },
    })

    // Disparar FLOW_SHIPPED
    const workflow = await prisma.waWorkflow.findFirst({
      where: {
        userId: orderLink.contact.account.userId,
        accountId: orderLink.contact.accountId,
        isActive: true,
        triggerType: WaWorkflowTrigger.WEBHOOK,
        purpose: 'order_shipped',
      },
    })
    if (workflow) {
      await startWorkflow({
        workflowId: workflow.id,
        contactId: orderLink.contactId,
        orderId: payload.order_id,
        initialContext: {
          tracking_number: payload.tracking_number,
          carrier: payload.carrier,
        },
      }).catch(err => console.error('[effi→shipped] failed:', err))
    }
  } else if (payload.event === 'delivery_exception') {
    const workflow = await prisma.waWorkflow.findFirst({
      where: {
        userId: orderLink.contact.account.userId,
        accountId: orderLink.contact.accountId,
        isActive: true,
        triggerType: WaWorkflowTrigger.WEBHOOK,
        purpose: 'delivery_issue',
      },
    })
    if (workflow) {
      await startWorkflow({
        workflowId: workflow.id,
        contactId: orderLink.contactId,
        orderId: payload.order_id,
        initialContext: {
          order_id: payload.order_id,
          exception_reason: payload.exception_reason,
        },
      }).catch(err => console.error('[effi→issue] failed:', err))
    }
  } else if (payload.event === 'delivered') {
    await prisma.whatsappOrderLink.update({
      where: { orderId: payload.order_id },
      data: { deliveredAt: new Date(payload.delivered_at ?? Date.now()) },
    })
  }
}
