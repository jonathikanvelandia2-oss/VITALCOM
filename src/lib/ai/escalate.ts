// V26 — Escalation a humano
// ═══════════════════════════════════════════════════════════
// CRÍTICO: el usuario nunca sabe que habló con un bot. Cuando la
// IA no puede resolver algo (baja confianza, queja grave, tema
// fuera de alcance), se crea un EscalationTicket y se notifica
// al área correcta por in-app bell. El humano toma el ticket y
// responde desde /admin/escalations — su respuesta se inyecta al
// thread como si fuera del asistente.
//
// Ningún usuario debe ver términos como "bot" o "IA" en la
// respuesta de escalación — siempre humanizada.

import { prisma } from '@/lib/db/prisma'
import { route } from './llm-router'
import {
  Area,
  ChatAgent,
  EscalationPriority,
  EscalationStatus,
  MessageRole,
  NotificationType,
} from '@prisma/client'

// ─── Detección de área desde el mensaje ─────────────────────
export function detectArea(userMessage: string, agentName: ChatAgent): Area {
  const text = userMessage.toLowerCase()

  if (/(pedido|env[ií]o|entrega|lleg[oó]|tracking|transporte|devoluci[oó]n|despacho|dropi)/i.test(text)) {
    return Area.LOGISTICA
  }
  if (/(pago|cobr|tarjeta|factura|reembolso|cancel.*cuenta|estafa|fraude|legal|abogad)/i.test(text)) {
    return Area.CONTABILIDAD
  }
  if (/(campa[ñn]a|anuncio|creativo|meta ads|facebook ads|tiktok ads|google ads)/i.test(text)) {
    return Area.MARKETING
  }
  if (/(queja.*grave|demand|prensa|denunci)/i.test(text)) {
    return Area.DIRECCION
  }
  if (/(precio|producto|catalog|stock|inventar)/i.test(text)) {
    return Area.COMERCIAL
  }

  // Default por agente
  const defaults: Record<ChatAgent, Area> = {
    MEDIA_BUYER: Area.MARKETING,
    CREATIVO_MAKER: Area.MARKETING,
    MENTOR_FINANCIERO: Area.CONTABILIDAD,
    OPTIMIZADOR_TIENDA: Area.COMERCIAL,
    BLUEPRINT_ANALYST: Area.ADMINISTRATIVA,
    CEO_ADVISOR: Area.DIRECCION,
    VITA: Area.ADMINISTRATIVA,
    SOPORTE_IA: Area.ADMINISTRATIVA,
    ESCALATE_HUMAN: Area.ADMINISTRATIVA,
  }
  return defaults[agentName] ?? Area.ADMINISTRATIVA
}

// ─── Resumen del thread para el humano ──────────────────────
async function summarizeThread(threadId: string): Promise<string> {
  const messages = await prisma.conversationMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take: 30,
  })

  if (messages.length === 0) return 'Sin contexto previo.'

  const conversation = messages
    .map(m => `${m.role === MessageRole.USER ? 'Usuario' : 'Asistente'}: ${m.content}`)
    .join('\n')

  const response = await route({
    taskType: 'extraction',
    systemPrompt: 'Resumes conversaciones para agentes humanos. Sé muy conciso (máx 3 oraciones).',
    messages: [{
      role: 'user',
      content: `Resume esta conversación enfocándote en: qué pidió el usuario, qué se le respondió, qué falta por resolver.\n\n${conversation}`,
    }],
    maxTokens: 200,
    temperature: 0,
  })

  return response.content || 'Sin resumen disponible.'
}

// ─── Crear ticket ───────────────────────────────────────────
export async function createEscalationTicket(params: {
  userId: string
  threadId: string
  fromAgent: ChatAgent
  reason: string
  userMessage: string
  draftResponse?: string
}): Promise<{ id: string; toArea: Area }> {
  const toArea = detectArea(params.userMessage, params.fromAgent)

  const isUrgent = /(urgent|ya|ahora|inmediato|grave|cr[ií]tico|demand|fraud|estafa)/i.test(params.userMessage)
  const priority: EscalationPriority = isUrgent
    ? EscalationPriority.URGENT
    : EscalationPriority.MEDIUM

  const summary = await summarizeThread(params.threadId).catch(() => 'No se pudo generar resumen.')

  const ticket = await prisma.escalationTicket.create({
    data: {
      userId: params.userId,
      threadId: params.threadId,
      fromAgent: params.fromAgent,
      toArea,
      priority,
      status: EscalationStatus.OPEN,
      reason: params.reason,
      summary,
      draftResponse: params.draftResponse,
    },
  })

  // Marcar thread como escalado
  await prisma.conversationThread.update({
    where: { id: params.threadId },
    data: {
      escalatedToArea: toArea,
      escalatedAt: new Date(),
    },
  })

  // Notificar al área
  await notifyArea(toArea, {
    ticketId: ticket.id,
    priority,
    preview: params.userMessage.slice(0, 200),
  }).catch(() => {})

  return { id: ticket.id, toArea }
}

// ─── Notificar a miembros del área ──────────────────────────
async function notifyArea(area: Area, data: {
  ticketId: string
  priority: EscalationPriority
  preview: string
}): Promise<void> {
  const areaMembers = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'SUPERADMIN' },
        { role: 'ADMIN' },
        { role: 'MANAGER_AREA', area },
        { role: 'EMPLOYEE', area },
      ],
      active: true,
    },
    select: { id: true },
    take: 20,
  })

  if (areaMembers.length === 0) return

  const title = `[${area}] Escalación IA ${data.priority}`
  const body = `${data.preview.slice(0, 150)}${data.preview.length > 150 ? '...' : ''}`

  await prisma.notification.createMany({
    data: areaMembers.map(m => ({
      userId: m.id,
      type: NotificationType.SYSTEM,
      title,
      body,
      link: `/admin/escalations?ticket=${data.ticketId}`,
      meta: { ticketId: data.ticketId, priority: data.priority, area } as any,
    })),
  })
}

// ─── Resolver ticket (desde /admin/escalations) ─────────────
export async function resolveTicket(params: {
  ticketId: string
  resolvedBy: string
  resolution: string
  replyToUser?: string
}): Promise<void> {
  const ticket = await prisma.escalationTicket.findUniqueOrThrow({
    where: { id: params.ticketId },
  })

  await prisma.escalationTicket.update({
    where: { id: params.ticketId },
    data: {
      status: EscalationStatus.RESOLVED,
      assignedTo: params.resolvedBy,
      assignedAt: ticket.assignedAt ?? new Date(),
      resolvedAt: new Date(),
      resolution: params.resolution,
      replyToUser: params.replyToUser,
    },
  })

  // Si hay respuesta al usuario, agregarla al thread como mensaje del asistente
  if (params.replyToUser) {
    await prisma.conversationMessage.create({
      data: {
        threadId: ticket.threadId,
        role: MessageRole.ASSISTANT,
        content: params.replyToUser,
        model: 'human',
        confidence: 1,
        source: 'human',
      },
    })

    // Notificar al usuario que tiene respuesta
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: NotificationType.SYSTEM,
        title: 'Respuesta del equipo Vitalcom',
        body: params.replyToUser.slice(0, 150),
        link: `/chat?thread=${ticket.threadId}`,
      },
    })
  }

  // Reabrir el thread (quitar flag de escalación)
  await prisma.conversationThread.update({
    where: { id: ticket.threadId },
    data: { escalatedToArea: null },
  })
}

// ─── Respuesta humanizada al usuario durante escalación ─────
export function humanizedEscalationResponse(
  priority: EscalationPriority,
  area: Area,
  firstName: string
): string {
  const areaLabel: Record<Area, string> = {
    DIRECCION: 'dirección',
    MARKETING: 'marketing',
    COMERCIAL: 'ventas',
    ADMINISTRATIVA: 'soporte',
    LOGISTICA: 'logística',
    CONTABILIDAD: 'finanzas',
  }
  const label = areaLabel[area] ?? 'el equipo'

  if (priority === EscalationPriority.URGENT) {
    return `${firstName}, entiendo que esto es urgente. Ya avisé al equipo de ${label} para que te contacten en los próximos minutos. Mientras, ¿me puedes contar un poco más del problema?`
  }
  return `${firstName}, déjame coordinar esto con ${label}. Te respondo en breve con la información completa — normalmente en 15-30 minutos.`
}
