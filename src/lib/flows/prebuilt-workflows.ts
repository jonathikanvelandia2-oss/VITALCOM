// V27 — 6 workflows pre-construidos para WhatsApp Commerce
// ═══════════════════════════════════════════════════════════
// Flujos listos para instalar en la cuenta del VITALCOMMER.
// Cada uno adaptado del modelo Lucidbot pero con las mejoras IA
// del engine V27 (intent semántico, timings adaptativos, ai_decision,
// ai_respond, escalación invisible).

import type { WorkflowStep } from './workflow-engine'
import { prisma } from '@/lib/db/prisma'
import { WaWorkflowTrigger } from '@prisma/client'

interface WorkflowTemplate {
  key: string
  name: string
  purpose: string
  triggerType: WaWorkflowTrigger
  triggerConfig: Record<string, unknown>
  steps: WorkflowStep[]
}

// ─── FLUJO 1 — CONFIRMACIÓN EN CALIENTE ────────────────────
const FLOW_HOT_CONFIRMATION: WorkflowTemplate = {
  key: 'hot_confirmation',
  name: 'Confirmación en caliente',
  purpose: 'order_confirmation_hot',
  triggerType: 'MESSAGE_RECEIVED',
  triggerConfig: {
    matchType: 'semantic',
    intents: ['confirm_order', 'confirm_purchase'],
    confidenceThreshold: 0.75,
  },
  steps: [
    { id: 'tag_confirmed', type: 'tag', config: { action: 'add', key: 'confirmado', value: 'hot' }, nextOnSuccess: 'update_segment' },
    { id: 'update_segment', type: 'update_contact', config: { fields: { segment: 'confirmed_buyer' } }, nextOnSuccess: 'create_link' },
    { id: 'create_link', type: 'create_order_link', config: { status: 'confirmed_hot', channel: 'hot_button' }, nextOnSuccess: 'send_confirmed' },
    {
      id: 'send_confirmed',
      type: 'send_template',
      config: {
        templateName: 'pedido_confirmado',
        languageCode: 'es_CO',
        bodyVariables: ['{{contact.firstName}}', '{{product_name}}'],
      },
      nextOnSuccess: 'end',
    },
    { id: 'end', type: 'end', config: {} },
  ],
}

// ─── FLUJO 2 — CONFIRMACIÓN AUTOMÁTICA ADAPTATIVA ───────────
const FLOW_AUTO_CONFIRMATION: WorkflowTemplate = {
  key: 'auto_confirmation',
  name: 'Confirmación automática adaptativa',
  purpose: 'order_confirmation_auto',
  triggerType: 'ORDER_CREATED',
  triggerConfig: {
    delayMinutes: 15,
    skipIfTagged: 'confirmado',
  },
  steps: [
    {
      id: 'check_confirmed',
      type: 'branch',
      config: { field: 'contact.segment', operator: 'eq', value: 'confirmed_buyer' },
      nextOnBranch: { true: 'end_already_confirmed', false: 'send_first' },
    },
    {
      id: 'send_first',
      type: 'send_template',
      config: {
        templateName: 'confirmacion',
        languageCode: 'es_CO',
        headerVariables: [{ type: 'image', value: '{{product_image_url}}' }],
        bodyVariables: [
          '{{contact.firstName}}',
          '{{product_name}}',
          '{{contact.phoneE164}}',
          '{{contact.shippingAddress}}',
          '{{contact.shippingCity}}',
          '{{order_total}}',
        ],
      },
      nextOnSuccess: 'wait_1',
      nextOnFail: 'fallback_utility',
    },
    { id: 'wait_1', type: 'wait_for_reply', config: { timeoutMinutes: 180, adaptive: true }, nextOnSuccess: 'decide_reply_1' },
    {
      id: 'decide_reply_1',
      type: 'ai_decision',
      config: {
        prompt: 'El cliente respondió a la confirmación. ¿Qué intención muestra?',
        branches: ['confirm', 'cancel', 'edit', 'question', 'no_reply'],
      },
      nextOnBranch: {
        confirm: 'mark_confirmed_bot',
        cancel: 'mark_cancelled',
        edit: 'handle_edit',
        question: 'ai_answer_question',
        no_reply: 'send_retry',
      },
    },
    { id: 'mark_confirmed_bot', type: 'tag', config: { action: 'add', key: 'confirmado', value: 'bot_reply' }, nextOnSuccess: 'link_confirmed_bot' },
    { id: 'link_confirmed_bot', type: 'create_order_link', config: { status: 'confirmed_bot', channel: 'bot_reply' }, nextOnSuccess: 'send_confirmed_msg' },
    {
      id: 'send_confirmed_msg',
      type: 'send_template',
      config: {
        templateName: 'pedido_confirmado',
        languageCode: 'es_CO',
        bodyVariables: ['{{contact.firstName}}', '{{product_name}}'],
      },
      nextOnSuccess: 'end',
    },
    { id: 'mark_cancelled', type: 'tag', config: { action: 'add', key: 'cancelador', value: 'bot_request' }, nextOnSuccess: 'link_cancelled' },
    { id: 'link_cancelled', type: 'create_order_link', config: { status: 'cancelled', channel: 'bot_reply' }, nextOnSuccess: 'send_sorry' },
    {
      id: 'send_sorry',
      type: 'send_text',
      config: { text: 'Entendido {{contact.firstName}}, cancelamos tu pedido. Si cambias de opinión escríbenos.' },
      nextOnSuccess: 'end',
    },
    { id: 'handle_edit', type: 'escalate', config: { reason: 'Cliente quiere editar datos del pedido', area: 'ventas' }, nextOnSuccess: 'send_ack_edit' },
    {
      id: 'send_ack_edit',
      type: 'send_text',
      config: { text: '{{contact.firstName}}, dime qué necesitas corregir y lo actualizo en un minuto.' },
      nextOnSuccess: 'end',
    },
    {
      id: 'ai_answer_question',
      type: 'ai_respond',
      config: { contextHint: 'Cliente tiene una pregunta sobre su pedido. Responde breve y pide confirmación con Sí/No.' },
      nextOnSuccess: 'wait_after_q',
    },
    { id: 'wait_after_q', type: 'wait_for_reply', config: { timeoutMinutes: 60 }, nextOnSuccess: 'decide_reply_1' },
    {
      id: 'send_retry',
      type: 'send_template',
      config: {
        templateName: 'confirmacion_1',
        languageCode: 'es_CO',
        headerVariables: [{ type: 'image', value: '{{product_image_url}}' }],
        bodyVariables: ['{{contact.firstName}}', '{{product_name}}', '{{contact.shippingAddress}}', '{{order_total}}'],
      },
      nextOnSuccess: 'wait_2',
      nextOnFail: 'fallback_utility',
    },
    { id: 'wait_2', type: 'wait_for_reply', config: { timeoutMinutes: 1440, adaptive: true }, nextOnSuccess: 'decide_reply_2' },
    {
      id: 'decide_reply_2',
      type: 'ai_decision',
      config: {
        prompt: 'Reintento de confirmación. ¿El cliente confirma, cancela o aún duda?',
        branches: ['confirm', 'cancel', 'no_reply'],
      },
      nextOnBranch: { confirm: 'mark_confirmed_bot', cancel: 'mark_cancelled', no_reply: 'fallback_utility' },
    },
    {
      id: 'fallback_utility',
      type: 'send_template',
      config: {
        templateName: 'confirmacion',
        languageCode: 'es_CO',
        bodyVariables: [
          '{{contact.firstName}}', '{{product_name}}', '{{contact.phoneE164}}',
          '{{contact.shippingAddress}}', '{{contact.shippingCity}}', '{{order_total}}',
        ],
      },
      nextOnSuccess: 'wait_3',
    },
    { id: 'wait_3', type: 'wait_for_reply', config: { timeoutMinutes: 2880 }, nextOnSuccess: 'decide_reply_final' },
    {
      id: 'decide_reply_final',
      type: 'ai_decision',
      config: { prompt: 'Último intento. ¿Confirma o no responde?', branches: ['confirm', 'no_reply'] },
      nextOnBranch: { confirm: 'mark_confirmed_bot', no_reply: 'mark_not_confirmed' },
    },
    { id: 'mark_not_confirmed', type: 'tag', config: { action: 'add', key: 'no_confirmado', value: 'expired' }, nextOnSuccess: 'link_not_confirmed' },
    { id: 'link_not_confirmed', type: 'create_order_link', config: { status: 'not_confirmed', channel: 'bot_after_retries' }, nextOnSuccess: 'end' },
    { id: 'end_already_confirmed', type: 'end', config: {} },
    { id: 'end', type: 'end', config: {} },
  ],
}

// ─── FLUJO 3 — CARRITO ABANDONADO ──────────────────────────
const FLOW_ABANDONED_CART: WorkflowTemplate = {
  key: 'abandoned_cart',
  name: 'Recuperación carrito abandonado',
  purpose: 'abandoned_cart',
  triggerType: 'WEBHOOK',
  triggerConfig: {
    source: 'shopify',
    event: 'checkout_updated',
    conditionMinutesAfter: 30,
  },
  steps: [
    {
      id: 'send_first_recovery',
      type: 'send_template',
      config: {
        templateName: 'carritos_abandonados',
        languageCode: 'es_CO',
        headerVariables: [{ type: 'image', value: '{{product_image_url}}' }],
        bodyVariables: ['{{contact.firstName}}', '{{product_name}}', '{{cart_url}}'],
      },
      nextOnSuccess: 'wait_rec_1',
    },
    { id: 'wait_rec_1', type: 'wait_for_reply', config: { timeoutMinutes: 240, adaptive: true }, nextOnSuccess: 'decide_rec_1' },
    {
      id: 'decide_rec_1',
      type: 'branch',
      config: { field: 'var.cart_recovered', operator: 'eq', value: true },
      nextOnBranch: { true: 'tag_recovered', false: 'send_second_recovery' },
    },
    {
      id: 'send_second_recovery',
      type: 'send_interactive',
      config: {
        bodyText: '{{contact.firstName}}, tu {{product_name}} aún está reservado. Si tienes dudas, estoy aquí.',
        buttons: [
          { id: 'complete_order', title: 'Completar pedido' },
          { id: 'have_question', title: 'Tengo una duda' },
          { id: 'not_interested', title: 'Ya no quiero' },
        ],
      },
      nextOnSuccess: 'wait_rec_2',
    },
    { id: 'wait_rec_2', type: 'wait_for_reply', config: { timeoutMinutes: 720 }, nextOnSuccess: 'decide_rec_2' },
    {
      id: 'decide_rec_2',
      type: 'ai_decision',
      config: {
        prompt: 'Cliente respondió al intento de recuperación. ¿Qué intención?',
        branches: ['interested', 'question', 'not_interested', 'no_reply'],
      },
      nextOnBranch: {
        interested: 'send_last_push',
        question: 'ai_answer_cart',
        not_interested: 'tag_not_interested',
        no_reply: 'tag_lost',
      },
    },
    {
      id: 'ai_answer_cart',
      type: 'ai_respond',
      config: { contextHint: 'Cliente con carrito abandonado hace pregunta. Responde breve y ofrece completar el pedido.' },
      nextOnSuccess: 'wait_rec_2',
    },
    {
      id: 'send_last_push',
      type: 'send_text',
      config: { text: '¡Perfecto {{contact.firstName}}! Aquí tu link para completar: {{cart_url}}' },
      nextOnSuccess: 'end',
    },
    { id: 'tag_recovered', type: 'tag', config: { action: 'add', key: 'cart_recovered', value: true }, nextOnSuccess: 'end' },
    { id: 'tag_not_interested', type: 'tag', config: { action: 'add', key: 'not_interested_cart', value: true }, nextOnSuccess: 'end' },
    { id: 'tag_lost', type: 'tag', config: { action: 'add', key: 'lost_cart', value: true }, nextOnSuccess: 'end' },
    { id: 'end', type: 'end', config: {} },
  ],
}

// ─── FLUJO 4 — DESPACHO ─────────────────────────────────────
const FLOW_SHIPPED: WorkflowTemplate = {
  key: 'shipped',
  name: 'Notificación de despacho',
  purpose: 'order_shipped',
  triggerType: 'WEBHOOK',
  triggerConfig: { source: 'effi', event: 'guide_generated' },
  steps: [
    {
      id: 'send_guide',
      type: 'send_template',
      config: {
        templateName: 'guia_generada',
        languageCode: 'es_CO',
        bodyVariables: [
          '{{contact.firstName}}', '{{product_name}}',
          '{{contact.shippingAddress}}', '{{contact.shippingCity}}',
          '{{tracking_number}}',
        ],
      },
      nextOnSuccess: 'update_segment_shipped',
    },
    { id: 'update_segment_shipped', type: 'update_contact', config: { fields: { segment: 'active_order' } }, nextOnSuccess: 'end' },
    { id: 'end', type: 'end', config: {} },
  ],
}

// ─── FLUJO 5 — REMARKETING 20 DÍAS ─────────────────────────
const FLOW_REMARKETING: WorkflowTemplate = {
  key: 'remarketing',
  name: 'Remarketing 20 días',
  purpose: 'remarketing',
  triggerType: 'SCHEDULE',
  triggerConfig: {
    daysAfterDelivery: 20,
    excludeTags: ['cancelador', 'not_interested'],
  },
  steps: [
    {
      id: 'send_remarketing',
      type: 'send_template',
      config: {
        templateName: 'remarketing',
        languageCode: 'es_CO',
        headerVariables: [{ type: 'image', value: '{{product_image_url}}' }],
        bodyVariables: ['{{contact.firstName}}', '{{days_since_delivery}}'],
      },
      nextOnSuccess: 'wait_remark',
    },
    { id: 'wait_remark', type: 'wait_for_reply', config: { timeoutMinutes: 4320 }, nextOnSuccess: 'decide_remark' },
    {
      id: 'decide_remark',
      type: 'ai_decision',
      config: {
        prompt: '¿Cliente pidió recompra, tiene dudas o no está interesado?',
        branches: ['buy_again', 'question', 'not_interested', 'no_reply'],
      },
      nextOnBranch: {
        buy_again: 'create_recompra_link',
        question: 'ai_remarket_answer',
        not_interested: 'tag_no_recompra',
        no_reply: 'end',
      },
    },
    {
      id: 'create_recompra_link',
      type: 'send_text',
      config: { text: '¡Qué bueno {{contact.firstName}}! Aquí está tu link directo: {{repeat_purchase_url}}' },
      nextOnSuccess: 'tag_repeat',
    },
    { id: 'tag_repeat', type: 'tag', config: { action: 'add', key: 'repeat_intent', value: true }, nextOnSuccess: 'end' },
    {
      id: 'ai_remarket_answer',
      type: 'ai_respond',
      config: { contextHint: 'Cliente ya compró. Responde su duda y propone recompra.' },
      nextOnSuccess: 'end',
    },
    { id: 'tag_no_recompra', type: 'tag', config: { action: 'add', key: 'no_recompra', value: true }, nextOnSuccess: 'end' },
    { id: 'end', type: 'end', config: {} },
  ],
}

// ─── FLUJO 6 — NOVEDAD EN ENTREGA ──────────────────────────
const FLOW_DELIVERY_ISSUE: WorkflowTemplate = {
  key: 'delivery_issue',
  name: 'Novedad en entrega',
  purpose: 'delivery_issue',
  triggerType: 'WEBHOOK',
  triggerConfig: { source: 'effi', event: 'delivery_exception' },
  steps: [
    {
      id: 'send_novedad',
      type: 'send_template',
      config: {
        templateName: 'novedad',
        languageCode: 'es_CO',
        bodyVariables: ['{{contact.firstName}}', '{{product_name}}', '{{contact.shippingAddress}}'],
      },
      nextOnSuccess: 'wait_novedad',
    },
    { id: 'wait_novedad', type: 'wait_for_reply', config: { timeoutMinutes: 360 }, nextOnSuccess: 'decide_novedad' },
    {
      id: 'decide_novedad',
      type: 'ai_decision',
      config: {
        prompt: 'Cliente con novedad. ¿Confirma reentrega, cambia dirección, cancela?',
        branches: ['retry', 'change_address', 'cancel', 'no_reply'],
      },
      nextOnBranch: {
        retry: 'webhook_retry',
        change_address: 'escalate_address',
        cancel: 'mark_cancel_novedad',
        no_reply: 'escalate_timeout',
      },
    },
    {
      id: 'webhook_retry',
      type: 'call_webhook',
      config: {
        url: '{{env.EFFI_API}}/orders/{{order_id}}/retry-delivery',
        method: 'POST',
      },
      nextOnSuccess: 'send_ack_retry',
    },
    {
      id: 'send_ack_retry',
      type: 'send_text',
      config: { text: 'Perfecto {{contact.firstName}}, reintentamos la entrega hoy mismo.' },
      nextOnSuccess: 'end',
    },
    { id: 'escalate_address', type: 'escalate', config: { reason: 'Cliente quiere cambiar dirección de entrega', area: 'logistica' }, nextOnSuccess: 'end' },
    { id: 'mark_cancel_novedad', type: 'create_order_link', config: { status: 'cancelled', channel: 'novedad_no_retry' }, nextOnSuccess: 'end' },
    { id: 'escalate_timeout', type: 'escalate', config: { reason: 'Cliente no respondió a novedad en 6h', area: 'logistica' }, nextOnSuccess: 'end' },
    { id: 'end', type: 'end', config: {} },
  ],
}

// ─── Registry ───────────────────────────────────────────────
export const PREBUILT_WORKFLOWS: Record<string, WorkflowTemplate> = {
  hot_confirmation: FLOW_HOT_CONFIRMATION,
  auto_confirmation: FLOW_AUTO_CONFIRMATION,
  abandoned_cart: FLOW_ABANDONED_CART,
  shipped: FLOW_SHIPPED,
  remarketing: FLOW_REMARKETING,
  delivery_issue: FLOW_DELIVERY_ISSUE,
}

export type { WorkflowTemplate }

// Instalar los 6 workflows en una cuenta WhatsApp
export async function installPrebuiltWorkflows(userId: string, accountId: string) {
  const installed: Array<{ key: string; id: string; name: string }> = []

  for (const [key, template] of Object.entries(PREBUILT_WORKFLOWS)) {
    // Evitar duplicados por (userId, accountId, purpose)
    const existing = await prisma.waWorkflow.findFirst({
      where: { userId, accountId, purpose: template.purpose },
    })
    if (existing) {
      installed.push({ key, id: existing.id, name: existing.name })
      continue
    }

    const workflow = await prisma.waWorkflow.create({
      data: {
        userId,
        accountId,
        name: template.name,
        purpose: template.purpose,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig as object,
        steps: template.steps as unknown as object,
        isActive: true,
        useAiAdaptation: true,
        usePersonalization: true,
      },
    })
    installed.push({ key, id: workflow.id, name: workflow.name })
  }

  return installed
}
