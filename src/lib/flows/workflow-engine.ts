// V27 — Workflow Engine adaptativo
// ═══════════════════════════════════════════════════════════
// Motor de ejecución de workflows WhatsApp. Cada workflow es una
// lista de steps (JSON); el engine los ejecuta secuencialmente con
// soporte para waits, branches, AI decisions, escalación, webhooks.
//
// Mejoras vs Lucidbot:
// - Timings adaptativos por perfil del contacto
// - ai_decision usa LLM para rutear en vez de solo keywords
// - ai_respond genera respuestas conversacionales al vuelo
// - escalate invoca sistema de escalación V26 (invisible al cliente)
// - Cada execution graba outcome para RLHF futuro
//
// Mejoras vs blueprint original:
// - Prisma singleton
// - Reutiliza route() del V26 (sin Anthropic)
// - Reutiliza createEscalationTicket del V26
// - Tipado estricto de ExecutionContext

import { prisma } from '@/lib/db/prisma'
import { sendTemplate, sendText, sendInteractive, sendMedia } from '@/lib/whatsapp/client'
import { route } from '@/lib/ai/llm-router'
import { createEscalationTicket } from '@/lib/ai/escalate'
import {
  WaWorkflowStatus,
  type WaExecution,
  type WhatsappContact,
  ChatAgent,
} from '@prisma/client'

// ─── Step types ─────────────────────────────────────────────
export type StepType =
  | 'send_template'
  | 'send_text'
  | 'send_interactive'
  | 'send_media'
  | 'wait'
  | 'wait_for_reply'
  | 'branch'
  | 'tag'
  | 'ai_decision'
  | 'ai_respond'
  | 'update_contact'
  | 'create_order_link'
  | 'call_webhook'
  | 'escalate'
  | 'end'

export interface WorkflowStep {
  id: string
  type: StepType
  config: Record<string, unknown>
  nextOnSuccess?: string
  nextOnFail?: string
  nextOnBranch?: Record<string, string>
}

interface ExecutionContext {
  executionId: string
  workflowId: string
  contactId?: string
  conversationId?: string
  orderId?: string
  accountId?: string
  variables: Record<string, unknown>
}

// ─── Iniciar ejecución ──────────────────────────────────────
export async function startWorkflow(params: {
  workflowId: string
  contactId?: string
  orderId?: string
  conversationId?: string
  initialContext?: Record<string, unknown>
}): Promise<string> {
  const workflow = await prisma.waWorkflow.findUniqueOrThrow({
    where: { id: params.workflowId },
  })

  if (!workflow.isActive) {
    throw new Error(`Workflow ${workflow.name} is not active`)
  }

  const steps = workflow.steps as unknown as WorkflowStep[]
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error(`Workflow ${workflow.name} has no steps`)
  }

  const execution = await prisma.waExecution.create({
    data: {
      workflowId: params.workflowId,
      contactId: params.contactId,
      orderId: params.orderId,
      conversationId: params.conversationId,
      currentStepId: steps[0].id,
      context: (params.initialContext ?? {}) as object,
      status: WaWorkflowStatus.RUNNING,
    },
  })

  runStep(execution.id, steps[0].id).catch(err => {
    console.error(`[workflow] first step failed:`, err)
  })

  return execution.id
}

// ─── Ejecutar step ──────────────────────────────────────────
export async function runStep(executionId: string, stepId: string): Promise<void> {
  const execution = await prisma.waExecution.findUniqueOrThrow({
    where: { id: executionId },
    include: { workflow: true },
  })

  if (execution.status !== WaWorkflowStatus.RUNNING) return

  const steps = execution.workflow.steps as unknown as WorkflowStep[]
  const step = steps.find(s => s.id === stepId)
  if (!step) {
    await completeExecution(executionId, WaWorkflowStatus.FAILED, `Step ${stepId} not found`)
    return
  }

  const ctx: ExecutionContext = {
    executionId,
    workflowId: execution.workflowId,
    contactId: execution.contactId ?? undefined,
    conversationId: execution.conversationId ?? undefined,
    orderId: execution.orderId ?? undefined,
    variables: (execution.context as Record<string, unknown>) ?? {},
  }

  if (ctx.contactId) {
    const contact = await prisma.whatsappContact.findUnique({
      where: { id: ctx.contactId },
      select: { accountId: true },
    })
    ctx.accountId = contact?.accountId
  }

  const stepRun = await prisma.waStepRun.create({
    data: {
      executionId,
      stepId,
      stepType: step.type,
      status: 'running',
      input: step.config as object,
    },
  })

  try {
    const result = await executeStep(step, ctx)
    const durationMs = Date.now() - stepRun.startedAt.getTime()

    await prisma.waStepRun.update({
      where: { id: stepRun.id },
      data: {
        status: 'success',
        output: (result ?? {}) as object,
        finishedAt: new Date(),
        durationMs,
      },
    })

    // Persistir variables actualizadas
    await prisma.waExecution.update({
      where: { id: executionId },
      data: { context: ctx.variables as object },
    })

    // Determinar siguiente step
    let nextStepId: string | undefined
    if (step.type === 'branch' || step.type === 'ai_decision') {
      const branchKey = (result as { branch?: string })?.branch ?? 'default'
      nextStepId = step.nextOnBranch?.[branchKey] ?? step.nextOnSuccess
    } else {
      nextStepId = step.nextOnSuccess
    }

    if (step.type === 'end' || !nextStepId) {
      await completeExecution(executionId, WaWorkflowStatus.COMPLETED)
      return
    }

    // Wait / wait_for_reply — no avanzamos sincrónico
    if (step.type === 'wait' || step.type === 'wait_for_reply') {
      const wakeupAt = (result as { wakeupAt?: number })?.wakeupAt
      if (wakeupAt) {
        await prisma.waExecution.update({
          where: { id: executionId },
          data: {
            currentStepId: nextStepId,
            nextWakeupAt: new Date(wakeupAt),
          },
        })
      }
      return
    }

    // Avanzar al siguiente step
    await prisma.waExecution.update({
      where: { id: executionId },
      data: { currentStepId: nextStepId },
    })

    runStep(executionId, nextStepId).catch(err => {
      console.error(`[workflow] next step failed:`, err)
    })
  } catch (err) {
    const errorMessage = (err as Error).message
    await prisma.waStepRun.update({
      where: { id: stepRun.id },
      data: {
        status: 'failed',
        errorMessage,
        finishedAt: new Date(),
      },
    })

    if (step.nextOnFail) {
      await prisma.waExecution.update({
        where: { id: executionId },
        data: { currentStepId: step.nextOnFail },
      })
      runStep(executionId, step.nextOnFail).catch(e => {
        console.error('[workflow] onFail step failed:', e)
      })
    } else {
      await completeExecution(executionId, WaWorkflowStatus.FAILED, errorMessage)
    }
  }
}

// ─── Ejecutar según tipo ────────────────────────────────────
async function executeStep(step: WorkflowStep, ctx: ExecutionContext): Promise<unknown> {
  switch (step.type) {
    case 'send_template':       return stepSendTemplate(step, ctx)
    case 'send_text':           return stepSendText(step, ctx)
    case 'send_interactive':    return stepSendInteractive(step, ctx)
    case 'send_media':          return stepSendMedia(step, ctx)
    case 'wait':                return stepWait(step, ctx)
    case 'wait_for_reply':      return stepWaitForReply(step)
    case 'branch':              return stepBranch(step, ctx)
    case 'tag':                 return stepTag(step, ctx)
    case 'ai_decision':         return stepAiDecision(step, ctx)
    case 'ai_respond':          return stepAiRespond(step, ctx)
    case 'update_contact':      return stepUpdateContact(step, ctx)
    case 'create_order_link':   return stepCreateOrderLink(step, ctx)
    case 'call_webhook':        return stepCallWebhook(step, ctx)
    case 'escalate':            return stepEscalate(step, ctx)
    case 'end':                 return { done: true }
    default:                    throw new Error(`Unknown step type: ${step.type}`)
  }
}

// ─── Steps individuales ─────────────────────────────────────

async function stepSendTemplate(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.accountId || !ctx.contactId) throw new Error('Missing account or contact')
  const contact = await prisma.whatsappContact.findUniqueOrThrow({ where: { id: ctx.contactId } })
  const config = step.config as {
    templateName: string
    languageCode?: string
    headerVariables?: Array<{ type: 'image' | 'video' | 'document' | 'text'; value: string }>
    bodyVariables?: string[]
    buttonVariables?: Array<{ index: number; value: string }>
  }

  const bodyVars = (config.bodyVariables ?? []).map(v =>
    resolveVariable(v, ctx.variables, contact),
  )
  const headerVars = (config.headerVariables ?? []).map(h => ({
    type: h.type,
    value: resolveVariable(h.value, ctx.variables, contact),
  }))

  return sendTemplate({
    accountId: ctx.accountId,
    toPhoneE164: contact.phoneE164,
    templateName: config.templateName,
    languageCode: config.languageCode,
    headerVariables: headerVars,
    bodyVariables: bodyVars,
    buttonVariables: config.buttonVariables,
    conversationId: ctx.conversationId,
    orderId: ctx.orderId,
  })
}

async function stepSendText(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.accountId || !ctx.contactId) throw new Error('Missing account or contact')
  const contact = await prisma.whatsappContact.findUniqueOrThrow({ where: { id: ctx.contactId } })
  const config = step.config as { text: string }
  const text = resolveTemplate(config.text, ctx.variables, contact)

  return sendText({
    accountId: ctx.accountId,
    toPhoneE164: contact.phoneE164,
    text,
    conversationId: ctx.conversationId,
  })
}

async function stepSendInteractive(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.accountId || !ctx.contactId) throw new Error('Missing account or contact')
  const contact = await prisma.whatsappContact.findUniqueOrThrow({ where: { id: ctx.contactId } })
  const config = step.config as {
    bodyText: string
    headerText?: string
    headerImageUrl?: string
    footerText?: string
    buttons?: Array<{ id: string; title: string }>
    listSections?: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>
    ctaUrl?: { displayText: string; url: string }
  }

  return sendInteractive({
    accountId: ctx.accountId,
    toPhoneE164: contact.phoneE164,
    bodyText: resolveTemplate(config.bodyText, ctx.variables, contact),
    headerText: config.headerText,
    headerImageUrl: config.headerImageUrl,
    footerText: config.footerText,
    buttons: config.buttons,
    listSections: config.listSections,
    ctaUrl: config.ctaUrl,
    conversationId: ctx.conversationId,
  })
}

async function stepSendMedia(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.accountId || !ctx.contactId) throw new Error('Missing account or contact')
  const contact = await prisma.whatsappContact.findUniqueOrThrow({ where: { id: ctx.contactId } })
  const config = step.config as {
    mediaType: 'image' | 'audio' | 'video' | 'document'
    mediaUrl: string
    caption?: string
    filename?: string
  }

  return sendMedia({
    accountId: ctx.accountId,
    toPhoneE164: contact.phoneE164,
    type: config.mediaType,
    mediaUrl: resolveVariable(config.mediaUrl, ctx.variables, contact),
    caption: config.caption,
    filename: config.filename,
    conversationId: ctx.conversationId,
  })
}

// Wait adaptativo — el corazón del engine
async function stepWait(step: WorkflowStep, ctx: ExecutionContext) {
  const config = step.config as { waitMinutes?: number; adaptive?: boolean }
  let waitMinutes = config.waitMinutes ?? 15

  if (config.adaptive && ctx.contactId) {
    const contact = await prisma.whatsappContact.findUnique({ where: { id: ctx.contactId } })
    if (contact) {
      if ((contact.confirmationRate ?? 0) > 0.9) waitMinutes = Math.round(waitMinutes * 0.5)
      else if ((contact.confirmationRate ?? 0) < 0.3) waitMinutes = Math.round(waitMinutes * 1.5)
      if (contact.segment === 'hot_lead') waitMinutes = Math.round(waitMinutes * 0.3)
      if (contact.segment === 'at_risk') waitMinutes = Math.round(waitMinutes * 2)
    }
  }

  const wakeupAt = Date.now() + waitMinutes * 60_000
  return { wakeupAt, waitMinutesUsed: waitMinutes }
}

async function stepWaitForReply(step: WorkflowStep) {
  const config = step.config as { timeoutMinutes?: number }
  const timeoutMinutes = config.timeoutMinutes ?? 180
  const wakeupAt = Date.now() + timeoutMinutes * 60_000
  return { wakeupAt, awaitingReply: true }
}

async function stepBranch(step: WorkflowStep, ctx: ExecutionContext) {
  const config = step.config as { field: string; operator: string; value: unknown }
  let fieldValue: unknown

  if (config.field.startsWith('contact.') && ctx.contactId) {
    const contact = await prisma.whatsappContact.findUnique({ where: { id: ctx.contactId } })
    fieldValue = (contact as unknown as Record<string, unknown>)?.[config.field.replace('contact.', '')]
  } else if (config.field.startsWith('var.')) {
    fieldValue = ctx.variables[config.field.replace('var.', '')]
  } else if (config.field === 'lastMessageIntent') {
    const msg = await prisma.whatsappMessage.findFirst({
      where: { conversationId: ctx.conversationId, direction: 'INBOUND' },
      orderBy: { createdAt: 'desc' },
    })
    fieldValue = msg?.intent
  }

  const match = evalCondition(fieldValue, config.operator, config.value)
  return { branch: match ? 'true' : 'false' }
}

async function stepTag(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.contactId) throw new Error('Missing contactId for tag step')
  const config = step.config as { action: 'add' | 'remove'; key: string; value?: unknown }

  const contact = await prisma.whatsappContact.findUniqueOrThrow({ where: { id: ctx.contactId } })
  const tags = Array.isArray(contact.tags) ? [...(contact.tags as unknown[])] : []

  if (config.action === 'add') {
    tags.push({
      key: config.key,
      value: config.value ?? true,
      setAt: new Date().toISOString(),
      setBy: `workflow:${ctx.workflowId}`,
    })
  } else if (config.action === 'remove') {
    const idx = tags.findIndex((t: unknown) => (t as { key?: string })?.key === config.key)
    if (idx >= 0) tags.splice(idx, 1)
  }

  const updateData: Record<string, unknown> = { tags }
  // Shortcut: tag "confirmado" → segment "confirmed_buyer"
  if (config.key === 'confirmado' && config.action === 'add') {
    updateData.segment = 'confirmed_buyer'
  }

  await prisma.whatsappContact.update({
    where: { id: ctx.contactId },
    data: updateData,
  })

  return { tagsCount: tags.length }
}

async function stepAiDecision(step: WorkflowStep, ctx: ExecutionContext) {
  const config = step.config as { prompt: string; branches: string[] }

  const lastMsg = await prisma.whatsappMessage.findFirst({
    where: { conversationId: ctx.conversationId, direction: 'INBOUND' },
    orderBy: { createdAt: 'desc' },
  })

  if (!lastMsg) return { branch: 'no_message' }

  const textToAnalyze = lastMsg.content ?? lastMsg.buttonReplyTitle ?? ''
  const branches = config.branches ?? ['confirm', 'cancel', 'unclear']

  const response = await route({
    taskType: 'classification',
    systemPrompt: 'Eres un clasificador de mensajes WhatsApp para dropshipping LATAM. Responde SOLO JSON: {"branch":"..."}.',
    messages: [{
      role: 'user',
      content: `Contexto: ${config.prompt}\nOpciones: ${branches.join(', ')}\nMensaje cliente: "${textToAnalyze}"\nResponde con la opción más adecuada.`,
    }],
    jsonMode: true,
    maxTokens: 50,
    temperature: 0,
  })

  let branch = 'unclear'
  try {
    const parsed = JSON.parse(response.content)
    if (parsed?.branch && branches.includes(parsed.branch)) branch = parsed.branch
  } catch {
    // fallback: busca keyword en la respuesta
    for (const b of branches) {
      if (response.content.toLowerCase().includes(b)) { branch = b; break }
    }
  }

  // Guardar intent detectado en el mensaje
  if (lastMsg.id) {
    await prisma.whatsappMessage.update({
      where: { id: lastMsg.id },
      data: { intent: branch },
    }).catch(() => {})
  }

  return { branch }
}

async function stepAiRespond(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.accountId || !ctx.contactId) throw new Error('Missing account or contact')
  const contact = await prisma.whatsappContact.findUniqueOrThrow({ where: { id: ctx.contactId } })
  const account = await prisma.whatsappAccount.findUniqueOrThrow({ where: { id: ctx.accountId } })
  const config = step.config as { contextHint?: string }

  const recentMessages = await prisma.whatsappMessage.findMany({
    where: { conversationId: ctx.conversationId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  const history = recentMessages.reverse()
    .map(m => `${m.direction === 'INBOUND' ? 'Cliente' : 'Tienda'}: ${m.content ?? '(media)'}`)
    .join('\n')

  const systemPrompt = `Eres el asistente de la tienda ${account.businessName ?? account.name} en WhatsApp.
${config.contextHint ?? ''}
Responde en español LATAM, natural, breve (máximo 3 oraciones). No digas que eres IA.`

  const aiResponse = await route({
    taskType: 'conversation_simple',
    systemPrompt,
    messages: [{ role: 'user', content: `Historial:\n${history}\n\nResponde al último mensaje del cliente.` }],
    maxTokens: 200,
    temperature: 0.5,
  })

  await sendText({
    accountId: ctx.accountId,
    toPhoneE164: contact.phoneE164,
    text: aiResponse.content,
    conversationId: ctx.conversationId,
  })

  return { generatedText: aiResponse.content, cost: aiResponse.costUsd }
}

async function stepUpdateContact(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.contactId) throw new Error('Missing contactId')
  const config = step.config as { fields: Record<string, unknown> }

  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(config.fields ?? {})) {
    updates[key] = typeof value === 'string' ? resolveVariable(value, ctx.variables, null) : value
  }

  await prisma.whatsappContact.update({ where: { id: ctx.contactId }, data: updates })
  return { updated: Object.keys(updates) }
}

async function stepCreateOrderLink(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.contactId || !ctx.orderId) throw new Error('Missing contactId or orderId')
  const config = step.config as { status: string; channel?: string }

  const waStatusMap: Record<string, 'PENDING' | 'CONFIRMED_HOT' | 'CONFIRMED_BOT' | 'CONFIRMED_AGENT' | 'NOT_CONFIRMED' | 'CANCELLED'> = {
    pending: 'PENDING',
    confirmed_hot: 'CONFIRMED_HOT',
    confirmed_bot: 'CONFIRMED_BOT',
    confirmed_agent: 'CONFIRMED_AGENT',
    not_confirmed: 'NOT_CONFIRMED',
    cancelled: 'CANCELLED',
  }
  const status = waStatusMap[config.status] ?? 'PENDING'
  const isConfirmed = status.startsWith('CONFIRMED')

  await prisma.whatsappOrderLink.upsert({
    where: { orderId: ctx.orderId },
    create: {
      orderId: ctx.orderId,
      contactId: ctx.contactId,
      confirmationStatus: status,
      confirmationChannel: config.channel,
      confirmedAt: isConfirmed ? new Date() : undefined,
    },
    update: {
      confirmationStatus: status,
      confirmationChannel: config.channel,
      confirmedAt: isConfirmed ? new Date() : undefined,
    },
  })

  return { orderId: ctx.orderId, status }
}

async function stepCallWebhook(step: WorkflowStep, ctx: ExecutionContext) {
  const config = step.config as {
    url: string
    method?: string
    body?: unknown
    headers?: Record<string, string>
    saveAs?: string
  }

  const url = interpolate(config.url, ctx.variables)
  const method = config.method ?? 'POST'
  const body = config.body
    ? JSON.parse(interpolate(JSON.stringify(config.body), ctx.variables))
    : undefined

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(config.headers ?? {}) },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }

  if (config.saveAs) ctx.variables[config.saveAs] = data
  return { status: res.status, data }
}

async function stepEscalate(step: WorkflowStep, ctx: ExecutionContext) {
  if (!ctx.contactId || !ctx.accountId) throw new Error('Missing contact or account')
  const config = step.config as { reason?: string; area?: string }

  const contact = await prisma.whatsappContact.findUniqueOrThrow({ where: { id: ctx.contactId } })
  const account = await prisma.whatsappAccount.findUniqueOrThrow({ where: { id: ctx.accountId } })

  // Escalación via sistema V26 — usa ConversationThread puente
  // Creamos o reusamos un ConversationThread para mantener trazabilidad
  let aiThreadId = ctx.conversationId
    ? (await prisma.whatsappConversation.findUnique({
        where: { id: ctx.conversationId },
        select: { aiThreadId: true },
      }))?.aiThreadId ?? null
    : null

  if (!aiThreadId) {
    const thread = await prisma.conversationThread.create({
      data: {
        userId: account.userId,
        agentName: ChatAgent.SOPORTE_IA,
        channel: 'WHATSAPP',
        title: `WA: ${contact.firstName ?? contact.phoneE164}`,
      },
    })
    aiThreadId = thread.id

    if (ctx.conversationId) {
      await prisma.whatsappConversation.update({
        where: { id: ctx.conversationId },
        data: { aiThreadId },
      })
    }
  }

  const ticket = await createEscalationTicket({
    userId: account.userId,
    threadId: aiThreadId,
    fromAgent: ChatAgent.SOPORTE_IA,
    reason: config.reason ?? `Workflow ${ctx.workflowId} escaló este contacto`,
    userMessage: `Contact ${contact.firstName ?? contact.phoneE164}${config.area ? ` · área: ${config.area}` : ''}`,
  })

  return { ticketId: ticket.id, toArea: ticket.toArea }
}

// ─── Helpers ────────────────────────────────────────────────
function resolveVariable(expr: string, vars: Record<string, unknown>, contact: WhatsappContact | null): string {
  if (!expr?.startsWith('{{')) return expr
  const key = expr.replace(/[{}]/g, '').trim()
  if (key.startsWith('contact.') && contact) {
    return String((contact as unknown as Record<string, unknown>)[key.replace('contact.', '')] ?? '')
  }
  return String(vars[key] ?? '')
}

function resolveTemplate(tpl: string, vars: Record<string, unknown>, contact: WhatsappContact | null): string {
  return tpl.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_, key: string) => {
    if (key.startsWith('contact.') && contact) {
      return String((contact as unknown as Record<string, unknown>)[key.replace('contact.', '')] ?? '')
    }
    return String(vars[key] ?? '')
  })
}

function interpolate(tpl: string, vars: Record<string, unknown>): string {
  return tpl.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_, key: string) => String(vars[key] ?? ''))
}

function evalCondition(fieldValue: unknown, operator: string, target: unknown): boolean {
  switch (operator) {
    case 'eq':       return fieldValue === target
    case 'neq':      return fieldValue !== target
    case 'gt':       return Number(fieldValue) > Number(target)
    case 'lt':       return Number(fieldValue) < Number(target)
    case 'gte':      return Number(fieldValue) >= Number(target)
    case 'lte':      return Number(fieldValue) <= Number(target)
    case 'contains': return String(fieldValue).includes(String(target))
    case 'in':       return Array.isArray(target) && (target as unknown[]).includes(fieldValue)
    case 'exists':   return fieldValue !== undefined && fieldValue !== null
    default:         return false
  }
}

async function completeExecution(
  executionId: string,
  status: WaWorkflowStatus,
  errorDetail?: string,
): Promise<void> {
  const execution = await prisma.waExecution.findUniqueOrThrow({ where: { id: executionId } })

  await prisma.waExecution.update({
    where: { id: executionId },
    data: {
      status,
      completedAt: new Date(),
      outcomeDetail: errorDetail,
      outcomeType: status === WaWorkflowStatus.COMPLETED ? 'positive' : 'negative',
    },
  })

  await prisma.waWorkflow.update({
    where: { id: execution.workflowId },
    data: {
      timesExecuted: { increment: 1 },
      ...(status === WaWorkflowStatus.COMPLETED
        ? { successCount: { increment: 1 } }
        : { failCount: { increment: 1 } }),
    },
  })
}

// ─── Cron wake-ups ──────────────────────────────────────────
export async function processScheduledWakeups(): Promise<{ processed: number; errors: number }> {
  const due = await prisma.waExecution.findMany({
    where: {
      status: WaWorkflowStatus.RUNNING,
      nextWakeupAt: { lte: new Date() },
    },
    take: 100,
  })

  let processed = 0
  let errors = 0
  for (const exec of due) {
    if (!exec.currentStepId) continue
    try {
      await prisma.waExecution.update({
        where: { id: exec.id },
        data: { nextWakeupAt: null },
      })
      await runStep(exec.id, exec.currentStepId)
      processed++
    } catch (err) {
      errors++
      console.error(`[workflow-cron] exec ${exec.id} failed:`, err)
    }
  }
  return { processed, errors }
}

// ─── Avanzar un workflow cuando el contacto responde ───────
// Llamado desde el webhook inbound de WhatsApp
export async function advanceOnReply(conversationId: string): Promise<number> {
  const waiting = await prisma.waExecution.findMany({
    where: {
      conversationId,
      status: WaWorkflowStatus.RUNNING,
      nextWakeupAt: { not: null },
    },
    take: 10,
  })

  let advanced = 0
  for (const exec of waiting) {
    if (!exec.currentStepId) continue
    try {
      await prisma.waExecution.update({
        where: { id: exec.id },
        data: { nextWakeupAt: null },
      })
      await runStep(exec.id, exec.currentStepId)
      advanced++
    } catch (err) {
      console.error(`[workflow] advanceOnReply failed:`, err)
    }
  }
  return advanced
}

export type { WaExecution }
