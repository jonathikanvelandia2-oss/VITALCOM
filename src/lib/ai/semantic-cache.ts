// V28 — Semantic Cache con 2 capas
// ═══════════════════════════════════════════════════════════
// Capa 1 — Hit exacto por hash(userId+agent+query) · V26
// Capa 2 — V28: match semántico cross-user para respuestas
//          CANÓNICAS (sin datos personales). Cosine >0.92.
//          Solo se embebe/busca si EMBEDDINGS_ENABLED.
//
// Las respuestas con cifras personales no se cachean.
// Las respuestas educativas o de catálogo sí se marcan
// `isCanonical=true` y pueden servir a cualquier usuario.

import { prisma } from '@/lib/db/prisma'
import { ChatAgent } from '@prisma/client'
import { embed, cosine, EMBEDDINGS_ENABLED } from './llm-router'
import crypto from 'crypto'

export interface CacheEntry {
  response: string
  similarity: number
  ageMinutes: number
  layer: 'exact' | 'semantic'
}

export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[¿?!¡.,;:]/g, '')
    .trim()
}

export function hashQuery(userId: string | null, agentName: ChatAgent, text: string): string {
  const payload = `${userId ?? 'anon'}:${agentName}:${normalizeQuery(text)}`
  return crypto.createHash('sha256').update(payload).digest('hex')
}

export function containsPersonalData(response: string): boolean {
  return /(\$\s*\d|(\bCOP\b|\bUSD\b|\bCLP\b|\bGTQ\b)\s*\d|\d{1,2}\.\d{1,2}x|\bmargen.*\d|\bpedidos?:\s*\d)/i.test(response)
}

// TTL en minutos por agente
export const TTL_BY_AGENT: Record<ChatAgent, number> = {
  VITA: 120,
  MENTOR_FINANCIERO: 10,
  BLUEPRINT_ANALYST: 30,
  CEO_ADVISOR: 60,
  MEDIA_BUYER: 15,
  CREATIVO_MAKER: 360,
  OPTIMIZADOR_TIENDA: 30,
  SOPORTE_IA: 1440,
  ESCALATE_HUMAN: 0,
}

// Agentes cuyas respuestas pueden ser canónicas (educativas, de catálogo)
export const CANONICAL_AGENTS: ChatAgent[] = [
  ChatAgent.VITA,
  ChatAgent.SOPORTE_IA,
  ChatAgent.CREATIVO_MAKER,
]

export const SEMANTIC_THRESHOLD = 0.92

// Política de cacheo: decide si una respuesta debe cachearse y si es canónica
// (puede servir cross-user). Aislada para poder testear sin Prisma.
export function cachePolicy(agentName: ChatAgent, response: string): {
  shouldCache: boolean
  isCanonical: boolean
} {
  const hasPersonal = containsPersonalData(response)
  const canonicalAllowed = CANONICAL_AGENTS.includes(agentName)
  const isCanonical = !hasPersonal && canonicalAllowed
  // Si contiene datos personales y no es canónica, no se cachea (evita fugar
  // cifras entre sesiones del mismo user).
  const shouldCache = isCanonical || !hasPersonal
  return { shouldCache, isCanonical }
}

// ─── Lookup: exacto primero, semántico si falla ────────────
export async function lookup(params: {
  userId: string
  query: string
  agentName: ChatAgent
}): Promise<CacheEntry | null> {
  // Capa 1 — hit exacto
  const hash = hashQuery(params.userId, params.agentName, params.query)
  const entry = await prisma.semanticCache.findUnique({
    where: { queryHash: hash },
  })

  if (entry && entry.expiresAt > new Date()) {
    prisma.semanticCache.update({
      where: { id: entry.id },
      data: { hits: { increment: 1 }, lastHitAt: new Date() },
    }).catch(() => {})

    return {
      response: entry.response,
      similarity: 1,
      ageMinutes: (Date.now() - entry.createdAt.getTime()) / 60_000,
      layer: 'exact',
    }
  }

  // Capa 2 — match semántico cross-user SOLO en canónicas
  if (!EMBEDDINGS_ENABLED || !CANONICAL_AGENTS.includes(params.agentName)) {
    return null
  }

  try {
    const queryEmbed = await embed(params.query)
    // Traer top 50 canónicas del mismo agente no expiradas
    const candidates = await prisma.semanticCache.findMany({
      where: {
        agentName: params.agentName,
        isCanonical: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastHitAt: 'desc' },
      take: 50,
    })

    let best: { entry: typeof candidates[number]; sim: number } | null = null
    for (const c of candidates) {
      const emb = Array.isArray(c.embedding) ? (c.embedding as number[]) : null
      if (!emb) continue
      const sim = cosine(queryEmbed, emb)
      if (sim > SEMANTIC_THRESHOLD && (!best || sim > best.sim)) {
        best = { entry: c, sim }
      }
    }

    if (best) {
      prisma.semanticCache.update({
        where: { id: best.entry.id },
        data: { hits: { increment: 1 }, lastHitAt: new Date() },
      }).catch(() => {})

      return {
        response: best.entry.response,
        similarity: best.sim,
        ageMinutes: (Date.now() - best.entry.createdAt.getTime()) / 60_000,
        layer: 'semantic',
      }
    }
  } catch (err) {
    console.warn('[semantic-cache] layer 2 failed:', (err as Error).message)
  }

  return null
}

// ─── Save ───────────────────────────────────────────────────
export async function save(params: {
  userId: string
  query: string
  agentName: ChatAgent
  response: string
  ttlMinutes?: number
}): Promise<void> {
  if (params.response.length < 50) return
  const hasPersonal = containsPersonalData(params.response)

  const ttl = params.ttlMinutes ?? TTL_BY_AGENT[params.agentName] ?? 60
  if (ttl <= 0) return

  const expiresAt = new Date(Date.now() + ttl * 60_000)
  const hash = hashQuery(params.userId, params.agentName, params.query)

  // Determinar si es respuesta canónica (sin datos personales + agente canonical)
  const isCanonical = !hasPersonal && CANONICAL_AGENTS.includes(params.agentName)

  // Embeber solo si es canónica (para capa 2 cross-user)
  let embedding: number[] | null = null
  if (isCanonical && EMBEDDINGS_ENABLED) {
    try {
      embedding = await embed(params.query)
    } catch {
      embedding = null
    }
  }

  // Si contiene datos personales y no es canónica, ni siquiera cacheamos exacto
  // (evita fugar cifras entre sesiones del mismo user)
  if (hasPersonal && !isCanonical) return

  await prisma.semanticCache.upsert({
    where: { queryHash: hash },
    create: {
      queryHash: hash,
      userId: params.userId,
      agentName: params.agentName,
      query: params.query.slice(0, 500),
      response: params.response,
      embedding: (embedding ?? undefined) as never,
      isCanonical,
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
  canonicalEntries: number
  totalHits: number
  estimatedCostSavingUsd: number
  topAgents: Array<{ agentName: string; hits: number }>
}> {
  const since = new Date(Date.now() - days * 86400_000)
  const entries = await prisma.semanticCache.findMany({
    where: { lastHitAt: { gte: since } },
    select: { agentName: true, hits: true, isCanonical: true },
  })

  const totalHits = entries.reduce((s, e) => s + e.hits, 0)
  const canonicalEntries = entries.filter(e => e.isCanonical).length
  const estimatedCostSavingUsd = totalHits * 0.001

  const byAgent = new Map<string, number>()
  for (const e of entries) {
    byAgent.set(e.agentName, (byAgent.get(e.agentName) ?? 0) + e.hits)
  }

  return {
    totalEntries: entries.length,
    canonicalEntries,
    totalHits,
    estimatedCostSavingUsd,
    topAgents: [...byAgent.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agentName, hits]) => ({ agentName, hits })),
  }
}
