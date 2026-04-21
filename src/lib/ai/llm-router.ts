// V26 — LLM Router
// ═══════════════════════════════════════════════════════════
// Router unificado para llamadas al LLM. En V26 solo OpenAI;
// en V28 se añadirá Claude Haiku con fallback automático.
//
// Criterio de ruteo por tipo de tarea (matriz interna):
//  - classification / extraction / conversation_simple  → gpt-4o-mini
//  - conversation_complex / reasoning / creative        → gpt-4o-mini (V26)
//  - multimodal_vision / multimodal_audio               → gpt-4o-mini / whisper-1 (V27)
//
// Si OpenAI falla por completo, devuelve un fallback de reglas
// para que el usuario NUNCA vea un error — siempre recibe una
// respuesta humanizada.

import OpenAI from 'openai'

export type LLMProvider = 'openai' | 'rules'

export type TaskType =
  | 'classification'
  | 'extraction'
  | 'conversation_simple'
  | 'conversation_complex'
  | 'reasoning'
  | 'creative'
  | 'multimodal_vision'
  | 'multimodal_audio'

export interface LLMRequest {
  taskType: TaskType
  systemPrompt: string
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  jsonMode?: boolean
  maxTokens?: number
  temperature?: number
  userId?: string
}

export interface LLMResponse {
  content: string
  provider: LLMProvider
  model: string
  latencyMs: number
  tokenCount: number
  costUsd: number
  confidence: number
}

// ─── Cliente singleton ──────────────────────────────────────
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no configurada')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

// ─── Pricing gpt-4o-mini (precios reales por token) ─────────
const PRICING = {
  input: 0.15 / 1_000_000,   // $0.15 / 1M input tokens
  output: 0.60 / 1_000_000,  // $0.60 / 1M output tokens
}

// ─── Circuit breaker: si OpenAI falla 5 veces en 60s, se salta a rules ─
let consecutiveFailures = 0
let lastFailureAt = 0
const FAILURE_THRESHOLD = 5
const RESET_WINDOW_MS = 60_000

function isCircuitOpen(): boolean {
  if (consecutiveFailures < FAILURE_THRESHOLD) return false
  if (Date.now() - lastFailureAt > RESET_WINDOW_MS) {
    consecutiveFailures = 0
    return false
  }
  return true
}

// ─── Fallback de reglas cuando OpenAI no está disponible ────
function rulesFallback(): LLMResponse {
  return {
    content: 'Déjame revisar esto con más detalle y te respondo en unos minutos.',
    provider: 'rules',
    model: 'fallback',
    latencyMs: 0,
    tokenCount: 0,
    costUsd: 0,
    confidence: 0.2,
  }
}

// ─── Router principal ───────────────────────────────────────
export async function route(req: LLMRequest): Promise<LLMResponse> {
  if (isCircuitOpen()) {
    return rulesFallback()
  }

  try {
    const response = await callOpenAI(req)
    consecutiveFailures = 0
    return response
  } catch (err) {
    consecutiveFailures++
    lastFailureAt = Date.now()
    console.warn('[llm-router] OpenAI falló:', (err as Error).message)
    return rulesFallback()
  }
}

async function callOpenAI(req: LLMRequest): Promise<LLMResponse> {
  const start = Date.now()
  const client = getOpenAI()
  const model = 'gpt-4o-mini'

  const messages = [
    { role: 'system' as const, content: req.systemPrompt },
    ...req.messages,
  ]

  const completion = await client.chat.completions.create({
    model,
    messages: messages as any,
    response_format: req.jsonMode ? { type: 'json_object' } : undefined,
    max_tokens: req.maxTokens ?? 600,
    temperature: req.temperature ?? 0.3,
    user: req.userId,
  })

  const choice = completion.choices[0]
  const content = choice.message.content ?? ''
  const usage = completion.usage

  const inputTokens = usage?.prompt_tokens ?? 0
  const outputTokens = usage?.completion_tokens ?? 0
  const cost = inputTokens * PRICING.input + outputTokens * PRICING.output

  return {
    content,
    provider: 'openai',
    model,
    latencyMs: Date.now() - start,
    tokenCount: inputTokens + outputTokens,
    costUsd: cost,
    confidence: estimateConfidence(choice.finish_reason, content),
  }
}

// Heurística de confianza basada en finish_reason + palabras de incertidumbre
function estimateConfidence(finishReason: string | null, content: string): number {
  if (!content || content.length < 10) return 0.2
  if (finishReason === 'length') return 0.5
  if (finishReason === 'stop') {
    const lowConf = /(no estoy seguro|no sé|déjame verificar|no tengo información|no puedo confirmar)/i
    if (lowConf.test(content)) return 0.4
    return 0.85
  }
  return 0.6
}
