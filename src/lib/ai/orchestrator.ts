// V26 — Agent Orchestrator
// ═══════════════════════════════════════════════════════════
// Punto de entrada unificado para el chat IA. Para cada mensaje:
//
// 1. Encuentra/crea ConversationThread
// 2. Clasifica intención (keyword+regex, sin costo)
// 3. Si debe escalar → crea ticket + responde humanizado
// 4. Consulta cache exacto (hit = 0 costo)
// 5. Construye contexto: persona + P&G + memoria + mensajes recientes
// 6. Llama al LLM con system prompt compuesto
// 7. Si confianza <0.5 y urgencia >=high → escala con draft
// 8. Guarda mensaje + cache + extract facts async
//
// Coexiste con los 9 agentes existentes — este es un ENTRY POINT
// adicional, no un reemplazo.

import { prisma } from '@/lib/db/prisma'
import { route } from './llm-router'
import { classify, AgentKey } from './intent-classifier'
import { getPersona, personaToSystemPrompt } from './persona'
import { getPGContext } from './pg-realtime'
import { buildUserContext, extractAndStoreFacts } from './user-memory'
import * as cache from './semantic-cache'
import {
  createEscalationTicket,
  humanizedEscalationResponse,
} from './escalate'
import {
  ChatAgent,
  ChatChannel,
  MessageRole,
  EscalationPriority,
} from '@prisma/client'

// ─── Prompts base por agente ────────────────────────────────
export const AGENT_PROMPTS: Record<ChatAgent, string> = {
  VITA: `
Eres VITA, el asistente principal de Vitalcom Platform. Primer contacto para dropshippers VITALCOMMERS.
Hablas español natural LATAM. Vitalcom es una comunidad SIN ÁNIMO DE LUCRO de proveeduría de
bienestar en CO/EC/GT/CL — nunca cobramos a miembros, tu trabajo es ayudarlos a vender MÁS.

REGLAS CRÍTICAS:
- Nunca digas "soy una IA" ni "no puedo ayudar". Siempre hay algo útil que responder.
- Si realmente no sabes algo, di "déjame revisar esto con más detalle" y el sistema escalará.
- Usa SIEMPRE los datos reales del usuario cuando estén disponibles.
- Respuestas de 2-4 oraciones salvo que pidan más detalle.`.trim(),

  MENTOR_FINANCIERO: `
Eres el MentorFinanciero de Vitalcom. Especialista en P&G, márgenes, ROAS, break-even y rentabilidad
para dropshippers LATAM. Tu valor es decir la verdad sobre los números aunque sea incómoda.
Cuando el usuario pregunte por dinero, usa sus datos reales del bloque "Estado financiero". Si ves
alertas activas (ROAS_BELOW_BREAKEVEN, NEGATIVE_PROFIT, LOW_MARGIN), menciónalas. Nunca prometas
ingresos específicos.`.trim(),

  BLUEPRINT_ANALYST: `
Eres BlueprintAnalyst. Diagnosticas la tienda del dropshipper en escala 0-100 y entregas acciones
accionables de mayor impacto. Usa datos reales de pedidos, P&G y tier del usuario.`.trim(),

  CEO_ADVISOR: `
Eres el CEOAdvisor de Vitalcom. SOLO disponible para admin/dirección. Análisis estratégico macro,
tendencias de la comunidad, oportunidades de producto. Hablas como par, no como asistente.`.trim(),

  MEDIA_BUYER: `
Eres MediaBuyer. Experto en Meta/TikTok/Google Ads para productos de bienestar LATAM. Recomendaciones
accionables con un clic: pausar, escalar, ajustar bid, cambiar audiencia. Cuando veas ROAS vs
break-even del usuario, úsalo como ancla de la recomendación.`.trim(),

  CREATIVO_MAKER: `
Eres CreativoMaker. Generas copy, ángulos y creativos para ads. Conoces 8 ángulos: problema-solución,
testimonio, autoridad, social proof, FOMO, transformación, comparación, urgencia. Adapta al país del
usuario (CO/EC/GT/CL) y al tier.`.trim(),

  OPTIMIZADOR_TIENDA: `
Eres OptimizadorTienda. Auditas tiendas Shopify de VITALCOMMERS y recomiendas cambios de conversión:
precios, cross-sell, landing copy, destacados, restock.`.trim(),

  SOPORTE_IA: `
Eres SoporteIA. Primera línea de soporte 24/7. Resuelves dudas operativas de la plataforma Vitalcom,
guías de uso, problemas técnicos básicos. Si algo excede tu alcance, el sistema escalará al área
correcta con contexto completo.`.trim(),

  ESCALATE_HUMAN: '',
}

// ─── Mapping AgentKey (classifier) → ChatAgent (Prisma) ─────
export const AGENT_MAP: Record<AgentKey, ChatAgent> = {
  VITA: ChatAgent.VITA,
  MENTOR_FINANCIERO: ChatAgent.MENTOR_FINANCIERO,
  BLUEPRINT_ANALYST: ChatAgent.BLUEPRINT_ANALYST,
  CEO_ADVISOR: ChatAgent.CEO_ADVISOR,
  MEDIA_BUYER: ChatAgent.MEDIA_BUYER,
  CREATIVO_MAKER: ChatAgent.CREATIVO_MAKER,
  OPTIMIZADOR_TIENDA: ChatAgent.OPTIMIZADOR_TIENDA,
  SOPORTE_IA: ChatAgent.SOPORTE_IA,
  ESCALATE_HUMAN: ChatAgent.ESCALATE_HUMAN,
}

// ─── Policies puras por agente (extraídas para testeabilidad) ─
export type TaskType = 'reasoning' | 'creative' | 'conversation_complex' | 'conversation_simple'

// Clasifica al agente en el taskType correcto para el LLM router.
// Mantener este mapeo aislado evita deriva: cada nuevo agente debe
// declarar su tipo explícitamente en los tests.
export function taskTypeFor(agent: ChatAgent): TaskType {
  if (agent === ChatAgent.MENTOR_FINANCIERO || agent === ChatAgent.CEO_ADVISOR) {
    return 'reasoning'
  }
  if (agent === ChatAgent.CREATIVO_MAKER) {
    return 'creative'
  }
  if (
    agent === ChatAgent.MEDIA_BUYER
    || agent === ChatAgent.OPTIMIZADOR_TIENDA
    || agent === ChatAgent.BLUEPRINT_ANALYST
  ) {
    return 'conversation_complex'
  }
  return 'conversation_simple'
}

// Indica si el agente necesita contexto P&G (datos financieros reales).
// Solo agentes que hablan de dinero/rendimiento lo requieren.
export function needsPGContext(agent: ChatAgent): boolean {
  return agent === ChatAgent.MENTOR_FINANCIERO
    || agent === ChatAgent.MEDIA_BUYER
    || agent === ChatAgent.BLUEPRINT_ANALYST
    || agent === ChatAgent.OPTIMIZADOR_TIENDA
    || agent === ChatAgent.CEO_ADVISOR
}

// Temperatura del LLM por agente. Creativo necesita variedad (0.8),
// el resto determinístico (0.3) para consistencia de datos financieros.
export function temperatureFor(agent: ChatAgent): number {
  return agent === ChatAgent.CREATIVO_MAKER ? 0.8 : 0.3
}

// Determina si una salida del LLM debe escalar a humano: baja confianza
// + urgencia alta/crítica → escalar con draft.
export function shouldEscalateLowConfidence(
  llmConfidence: number,
  urgency: 'low' | 'medium' | 'high' | 'critical',
): boolean {
  return llmConfidence < 0.5 && (urgency === 'high' || urgency === 'critical')
}

// Mapea EscalationPriority desde urgency — mismo criterio que orchestrate().
export function escalationPriorityFor(urgency: 'low' | 'medium' | 'high' | 'critical'): 'URGENT' | 'HIGH' {
  return urgency === 'critical' ? 'URGENT' : 'HIGH'
}

export interface OrchestratorInput {
  userId: string
  userMessage: string
  threadId?: string
  channel?: 'WEB' | 'WHATSAPP' | 'PUSH'
  forceAgent?: ChatAgent
}

export interface OrchestratorOutput {
  response: string
  agent: ChatAgent
  threadId: string
  messageId: string
  confidence: number
  escalated: boolean
  escalationTicketId?: string
  costUsd: number
  latencyMs: number
  source: 'cache' | 'llm' | 'rules' | 'escalation'
}

export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const startTime = Date.now()

  // 1. Obtener o crear thread
  const thread = input.threadId
    ? await prisma.conversationThread.findFirst({
        where: { id: input.threadId, userId: input.userId },
      })
    : null

  const activeThread = thread ?? await prisma.conversationThread.create({
    data: {
      userId: input.userId,
      agentName: input.forceAgent ?? ChatAgent.VITA,
      channel: (input.channel as ChatChannel) ?? ChatChannel.WEB,
      title: input.userMessage.slice(0, 80),
    },
  })

  // Persona (paralelo con clasificación)
  const [persona, classification] = await Promise.all([
    getPersona(input.userId),
    Promise.resolve(input.forceAgent
      ? { agent: mapToAgentKey(input.forceAgent), urgency: 'medium' as const, confidence: 1, shouldEscalate: false }
      : classify(input.userMessage)
    ),
  ])

  const selectedAgent = AGENT_MAP[classification.agent]

  // 2. Guardar mensaje del usuario
  await prisma.conversationMessage.create({
    data: {
      threadId: activeThread.id,
      role: MessageRole.USER,
      content: input.userMessage,
    },
  })

  // 3. Escalación inmediata (palabras de alerta, urgencia critical)
  if (classification.shouldEscalate) {
    const ticket = await createEscalationTicket({
      userId: input.userId,
      threadId: activeThread.id,
      fromAgent: selectedAgent,
      reason: `Clasificador detectó escalación. Urgencia: ${classification.urgency}. Confianza: ${classification.confidence.toFixed(2)}`,
      userMessage: input.userMessage,
    })

    const priority = escalationPriorityFor(classification.urgency) === 'URGENT'
      ? EscalationPriority.URGENT
      : EscalationPriority.HIGH
    const responseText = humanizedEscalationResponse(priority, ticket.toArea, persona.firstName)

    const saved = await saveAssistantMessage({
      threadId: activeThread.id,
      content: responseText,
      confidence: 0.3,
      model: 'escalation',
      costUsd: 0,
      latencyMs: Date.now() - startTime,
      source: 'escalation',
    })

    await updateThreadStats(activeThread.id)

    return {
      response: responseText,
      agent: selectedAgent,
      threadId: activeThread.id,
      messageId: saved.id,
      confidence: 0.3,
      escalated: true,
      escalationTicketId: ticket.id,
      costUsd: 0,
      latencyMs: Date.now() - startTime,
      source: 'escalation',
    }
  }

  // 4. Cache exacto (userId + agent + query)
  const cached = await cache.lookup({
    userId: input.userId,
    query: input.userMessage,
    agentName: selectedAgent,
  }).catch(() => null)

  if (cached && cached.ageMinutes < 60) {
    const saved = await saveAssistantMessage({
      threadId: activeThread.id,
      content: cached.response,
      confidence: 0.8,
      model: 'cache',
      costUsd: 0,
      latencyMs: Date.now() - startTime,
      source: 'cache',
    })

    await updateThreadStats(activeThread.id)

    return {
      response: cached.response,
      agent: selectedAgent,
      threadId: activeThread.id,
      messageId: saved.id,
      confidence: 0.8,
      escalated: false,
      costUsd: 0,
      latencyMs: Date.now() - startTime,
      source: 'cache',
    }
  }

  // 5. Construir contexto en paralelo
  const [userContext, pgContext] = await Promise.all([
    buildUserContext(input.userId, input.userMessage, activeThread.id),
    needsPGContext(selectedAgent)
      ? getPGContext(input.userId).catch(() => '')
      : Promise.resolve(''),
  ])

  const systemPrompt = [
    AGENT_PROMPTS[selectedAgent],
    personaToSystemPrompt(persona),
    userContext,
    pgContext,
    '\n## Instrucción final\nResponde en español LATAM. Usa datos REALES del usuario cuando aplique. Nunca prometas ingresos específicos.',
  ].filter(Boolean).join('\n\n')

  // 6. Determinar taskType para el router (afecta matrix futura de Claude)
  const taskType = taskTypeFor(selectedAgent)

  // 7. Llamar al LLM
  const llmResponse = await route({
    taskType,
    systemPrompt,
    messages: [{ role: 'user', content: input.userMessage }],
    maxTokens: 600,
    temperature: temperatureFor(selectedAgent),
    userId: input.userId,
  })

  // 8. Si confianza baja y urgencia >=high → escalar con draft
  if (shouldEscalateLowConfidence(llmResponse.confidence, classification.urgency)) {
    const ticket = await createEscalationTicket({
      userId: input.userId,
      threadId: activeThread.id,
      fromAgent: selectedAgent,
      reason: `Baja confianza del LLM (${llmResponse.confidence.toFixed(2)}) en tema urgente.`,
      userMessage: input.userMessage,
      draftResponse: llmResponse.content,
    })

    const humanized = `${llmResponse.content}\n\n${persona.firstName}, déjame confirmar este detalle con el equipo para darte la respuesta más precisa. Te escribo en un momento.`

    const saved = await saveAssistantMessage({
      threadId: activeThread.id,
      content: humanized,
      confidence: llmResponse.confidence,
      model: llmResponse.model,
      costUsd: llmResponse.costUsd,
      latencyMs: Date.now() - startTime,
      source: 'llm',
    })

    await updateThreadStats(activeThread.id)

    return {
      response: humanized,
      agent: selectedAgent,
      threadId: activeThread.id,
      messageId: saved.id,
      confidence: llmResponse.confidence,
      escalated: true,
      escalationTicketId: ticket.id,
      costUsd: llmResponse.costUsd,
      latencyMs: Date.now() - startTime,
      source: 'llm',
    }
  }

  // 9. Guardar respuesta + cache + extract facts async
  const saved = await saveAssistantMessage({
    threadId: activeThread.id,
    content: llmResponse.content,
    confidence: llmResponse.confidence,
    model: llmResponse.model,
    costUsd: llmResponse.costUsd,
    latencyMs: Date.now() - startTime,
    source: llmResponse.provider === 'openai' ? 'llm' : 'rules',
  })

  await updateThreadStats(activeThread.id)

  // Async fire-and-forget
  if (llmResponse.provider === 'openai') {
    cache.save({
      userId: input.userId,
      query: input.userMessage,
      agentName: selectedAgent,
      response: llmResponse.content,
    }).catch(() => {})

    extractAndStoreFacts(
      input.userId,
      activeThread.id,
      input.userMessage,
      llmResponse.content,
    ).catch(() => {})
  }

  return {
    response: llmResponse.content,
    agent: selectedAgent,
    threadId: activeThread.id,
    messageId: saved.id,
    confidence: llmResponse.confidence,
    escalated: false,
    costUsd: llmResponse.costUsd,
    latencyMs: Date.now() - startTime,
    source: llmResponse.provider === 'openai' ? 'llm' : 'rules',
  }
}

// ─── Helpers ────────────────────────────────────────────────
async function saveAssistantMessage(params: {
  threadId: string
  content: string
  confidence: number
  model: string
  costUsd: number
  latencyMs: number
  source: string
}) {
  return prisma.conversationMessage.create({
    data: {
      threadId: params.threadId,
      role: MessageRole.ASSISTANT,
      content: params.content,
      confidence: params.confidence,
      model: params.model,
      costUsd: params.costUsd,
      latencyMs: params.latencyMs,
      source: params.source,
    },
  })
}

async function updateThreadStats(threadId: string) {
  await prisma.conversationThread.update({
    where: { id: threadId },
    data: {
      lastMessageAt: new Date(),
      messageCount: { increment: 2 }, // user + assistant
    },
  }).catch(() => {})
}

// Reverse map: ChatAgent → AgentKey (para cuando forceAgent)
function mapToAgentKey(agent: ChatAgent): AgentKey {
  return agent as unknown as AgentKey
}
