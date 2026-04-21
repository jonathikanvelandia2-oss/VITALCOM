// V28 — LLM Router mejorado: OpenAI + Claude Haiku opt-in
// ═══════════════════════════════════════════════════════════
// Mejoras sobre V26:
// - Claude Haiku 4.5 via fetch (opt-in, solo si ANTHROPIC_API_KEY presente)
// - embed() util para vectores (text-embedding-3-small)
// - Matriz de ruteo por taskType: reasoning/complex → Claude si disponible
// - Circuit breaker independiente por proveedor
// - Fallback 3 niveles: preferred → alternate → rules

import OpenAI from 'openai'

export type LLMProvider = 'openai' | 'anthropic' | 'rules'

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
  forceProvider?: LLMProvider
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

// ─── Feature flags ──────────────────────────────────────────
export const ANTHROPIC_ENABLED = Boolean(process.env.ANTHROPIC_API_KEY)
export const EMBEDDINGS_ENABLED = process.env.EMBEDDINGS_ENABLED !== 'false'

// ─── Matriz de ruteo — Claude para reasoning/complex si disponible ──
const ROUTING_MATRIX: Record<TaskType, LLMProvider> = {
  classification:       'openai',
  extraction:           'openai',
  conversation_simple:  'openai',
  conversation_complex: ANTHROPIC_ENABLED ? 'anthropic' : 'openai',
  reasoning:            ANTHROPIC_ENABLED ? 'anthropic' : 'openai',
  creative:             'openai',
  multimodal_vision:    'openai',
  multimodal_audio:     'openai',
}

// ─── Clientes singleton ─────────────────────────────────────
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY no configurada')
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

// ─── Pricing ────────────────────────────────────────────────
const PRICING = {
  'gpt-4o-mini':       { input: 0.15 / 1_000_000,  output: 0.60 / 1_000_000 },
  'claude-haiku-4-5':  { input: 1.00 / 1_000_000,  output: 5.00 / 1_000_000 },
  'text-embedding-3-small': { input: 0.02 / 1_000_000, output: 0 },
}

// ─── Circuit breaker por proveedor ──────────────────────────
interface CircuitState { failures: number; lastFailAt: number }
const FAILURE_THRESHOLD = 5
const RESET_WINDOW_MS = 60_000
const circuits: Record<LLMProvider, CircuitState> = {
  openai:    { failures: 0, lastFailAt: 0 },
  anthropic: { failures: 0, lastFailAt: 0 },
  rules:     { failures: 0, lastFailAt: 0 },
}

function circuitOpen(provider: LLMProvider): boolean {
  const c = circuits[provider]
  if (c.failures < FAILURE_THRESHOLD) return false
  if (Date.now() - c.lastFailAt > RESET_WINDOW_MS) {
    c.failures = 0
    return false
  }
  return true
}

function recordFailure(provider: LLMProvider) {
  circuits[provider].failures++
  circuits[provider].lastFailAt = Date.now()
}

function recordSuccess(provider: LLMProvider) {
  circuits[provider].failures = 0
}

// ─── Fallback final ─────────────────────────────────────────
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
  const preferred = req.forceProvider ?? ROUTING_MATRIX[req.taskType] ?? 'openai'

  // Intentar preferred si circuito abierto → saltar
  if (!circuitOpen(preferred)) {
    try {
      const res = await callProvider(preferred, req)
      recordSuccess(preferred)
      return res
    } catch (err) {
      recordFailure(preferred)
      console.warn(`[llm-router] ${preferred} falló:`, (err as Error).message)
    }
  }

  // Fallback a alternate
  const alternate: LLMProvider = preferred === 'openai' && ANTHROPIC_ENABLED
    ? 'anthropic'
    : 'openai'

  if (alternate !== preferred && !circuitOpen(alternate)) {
    try {
      const res = await callProvider(alternate, req)
      recordSuccess(alternate)
      return res
    } catch (err) {
      recordFailure(alternate)
      console.warn(`[llm-router] fallback ${alternate} falló:`, (err as Error).message)
    }
  }

  return rulesFallback()
}

async function callProvider(provider: LLMProvider, req: LLMRequest): Promise<LLMResponse> {
  if (provider === 'openai') return callOpenAI(req)
  if (provider === 'anthropic') return callAnthropic(req)
  throw new Error(`Unsupported provider: ${provider}`)
}

// ─── OpenAI ─────────────────────────────────────────────────
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
    messages: messages as never,
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
  const cost = inputTokens * PRICING[model].input + outputTokens * PRICING[model].output

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

// ─── Anthropic (Claude Haiku 4.5) via fetch ─────────────────
async function callAnthropic(req: LLMRequest): Promise<LLMResponse> {
  const start = Date.now()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada')

  const model = 'claude-haiku-4-5-20251001'

  // Claude separa system del array de messages
  const userMessages = req.messages.filter(m => m.role !== 'system')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      system: req.systemPrompt,
      messages: userMessages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: req.maxTokens ?? 600,
      temperature: req.temperature ?? 0.3,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json() as {
    content: Array<{ type: string; text?: string }>
    usage: { input_tokens: number; output_tokens: number }
    stop_reason?: string
  }

  const textBlocks = data.content.filter(c => c.type === 'text')
  const content = textBlocks.map(b => b.text ?? '').join('\n')
  const inputTokens = data.usage.input_tokens
  const outputTokens = data.usage.output_tokens
  const cost = inputTokens * PRICING['claude-haiku-4-5'].input
             + outputTokens * PRICING['claude-haiku-4-5'].output

  return {
    content,
    provider: 'anthropic',
    model,
    latencyMs: Date.now() - start,
    tokenCount: inputTokens + outputTokens,
    costUsd: cost,
    confidence: estimateConfidence(data.stop_reason ?? null, content),
  }
}

function estimateConfidence(finishReason: string | null, content: string): number {
  if (!content || content.length < 10) return 0.2
  if (finishReason === 'length' || finishReason === 'max_tokens') return 0.5
  if (finishReason === 'stop' || finishReason === 'end_turn') {
    const lowConf = /(no estoy seguro|no sé|déjame verificar|no tengo información|no puedo confirmar)/i
    if (lowConf.test(content)) return 0.4
    return 0.85
  }
  return 0.6
}

// ─── Embeddings (OpenAI) ────────────────────────────────────
export async function embed(text: string): Promise<number[]> {
  const client = getOpenAI()
  const res = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return res.data[0].embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const client = getOpenAI()
  const res = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts.map(t => t.slice(0, 8000)),
  })
  return res.data.map(d => d.embedding)
}

// Cosine similarity para matching en memoria
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// ─── Diagnósticos para /admin/ops ──────────────────────────
export function getRouterHealth() {
  return {
    anthropicEnabled: ANTHROPIC_ENABLED,
    embeddingsEnabled: EMBEDDINGS_ENABLED,
    circuits: {
      openai: { ...circuits.openai, open: circuitOpen('openai') },
      anthropic: { ...circuits.anthropic, open: circuitOpen('anthropic') },
    },
  }
}
