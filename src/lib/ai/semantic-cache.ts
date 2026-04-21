// V26 — Semantic Cache (capa 1: hash exacto con userId)
// ═══════════════════════════════════════════════════════════
// Cache de respuestas del LLM para reducir costos. En V26 solo
// hit exacto por (userId, agentName, query normalizada) — evita
// fugas entre usuarios. En V28 se agregará columna embedding
// + match semántico >0.92 (cross-user si la respuesta es canónica).
//
// Mejora clave vs el blueprint original:
// - Incluye userId en el hash → cero fuga de datos entre dropshippers
// - Rechaza cachear respuestas que contengan datos personales ($, cifras)
// - TTL variable por agente

import { prisma } from '@/lib/db/prisma'
import { ChatAgent } from '@prisma/client'
import crypto from 'crypto'

export interface CacheEntry {
  response: string
  similarity: number
  ageMinutes: number
}

function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[¿?!¡.,;:]/g, '')
    .trim()
}

function hashQuery(userId: string | null, agentName: ChatAgent, text: string): string {
  const payload = `${userId ?? 'anon'}:${agentName}:${normalizeQuery(text)}`
  return crypto.createHash('sha256').update(payload).digest('hex')
}

// Heurística: ¿la respuesta contiene datos personales del usuario?
function containsPersonalData(response: string): boolean {
  // $ + número, COP, USD, ROAS específico (xx.xx), números >= 3 dígitos
  return /(\$\s*\d|(\bCOP\b|\bUSD\b|\bCLP\b|\bGTQ\b)\s*\d|\d{1,2}\.\d{1,2}x|\bmargen.*\d|\bpedidos?:\s*\d)/i.test(response)
}

// TTL en minutos por agente
const TTL_BY_AGENT: Record<ChatAgent, number> = {
  VITA: 120,                 // preguntas generales del catálogo
  MENTOR_FINANCIERO: 10,     // datos cambian rápido
  BLUEPRINT_ANALYST: 30,
  CEO_ADVISOR: 60,
  MEDIA_BUYER: 15,           // depende de campañas activas
  CREATIVO_MAKER: 360,       // copy es reutilizable horas
  OPTIMIZADOR_TIENDA: 30,
  SOPORTE_IA: 1440,          // 24h — soporte sobre plataforma no cambia
  ESCALATE_HUMAN: 0,
}

export async function lookup(params: {
  userId: string
  query: string
  agentName: ChatAgent
}): Promise<CacheEntry | null> {
  const hash = hashQuery(params.userId, params.agentName, params.query)
  const entry = await prisma.semanticCache.findUnique({
    where: { queryHash: hash },
  })

  if (!entry || entry.expiresAt <= new Date()) return null

  // Actualizar hits async sin esperar
  prisma.semanticCache.update({
    where: { id: entry.id },
    data: { hits: { increment: 1 }, lastHitAt: new Date() },
  }).catch(() => {})

  return {
    response: entry.response,
    similarity: 1,
    ageMinutes: (Date.now() - entry.createdAt.getTime()) / 60_000,
  }
}

export async function save(params: {
  userId: string
  query: string
  agentName: ChatAgent
  response: string
  ttlMinutes?: number
}): Promise<void> {
  if (params.response.length < 50) return
  if (containsPersonalData(params.response)) return

  const ttl = params.ttlMinutes ?? TTL_BY_AGENT[params.agentName] ?? 60
  if (ttl <= 0) return

  const expiresAt = new Date(Date.now() + ttl * 60_000)
  const hash = hashQuery(params.userId, params.agentName, params.query)

  await prisma.semanticCache.upsert({
    where: { queryHash: hash },
    create: {
      queryHash: hash,
      userId: params.userId,
      agentName: params.agentName,
      query: params.query.slice(0, 500),
      response: params.response,
      expiresAt,
    },
    update: {
      response: params.response,
      expiresAt,
      lastHitAt: new Date(),
    },
  }).catch(err => {
    console.warn('[semantic-cache] save failed:', (err as Error).message)
  })
}

export async function cleanup(): Promise<number> {
  const result = await prisma.semanticCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}

export async function getStats(days = 7): Promise<{
  totalEntries: number
  totalHits: number
  estimatedCostSavingUsd: number
  topAgents: Array<{ agentName: string; hits: number }>
}> {
  const since = new Date(Date.now() - days * 86400_000)
  const entries = await prisma.semanticCache.findMany({
    where: { lastHitAt: { gte: since } },
    select: { agentName: true, hits: true },
  })

  const totalHits = entries.reduce((s, e) => s + e.hits, 0)
  const estimatedCostSavingUsd = totalHits * 0.001

  const byAgent = new Map<string, number>()
  for (const e of entries) {
    byAgent.set(e.agentName, (byAgent.get(e.agentName) ?? 0) + e.hits)
  }

  return {
    totalEntries: entries.length,
    totalHits,
    estimatedCostSavingUsd,
    topAgents: [...byAgent.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agentName, hits]) => ({ agentName, hits })),
  }
}
