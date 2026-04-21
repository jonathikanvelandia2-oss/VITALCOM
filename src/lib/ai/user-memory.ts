// V26 — User Memory (corto + estructurada, sin embeddings)
// ═══════════════════════════════════════════════════════════
// Combina 3 capas de memoria:
// 1. CORTA: últimos N mensajes del thread actual
// 2. LARGA: UserMemory rows (facts, goals, pain_points, etc.)
//    En V26 sin embeddings — recuperación por importance+kind+fecha
//    En V28 se añade búsqueda semántica por embedding
// 3. ESTRUCTURADA: datos objetivos del usuario (pedidos, nombre, país)
//
// extractAndStoreFacts() corre ASÍNCRONO después de cada respuesta
// con probabilidad 0.3 (sampling) para no duplicar costo LLM en cada
// turno — en V27 se batcha nocturno.

import { prisma } from '@/lib/db/prisma'
import { MemoryKind } from '@prisma/client'
import { route } from './llm-router'

export interface MemoryItem {
  id: string
  kind: MemoryKind
  content: string
  importance: number
  createdAt: Date
}

// ─── Memoria corta ──────────────────────────────────────────
export async function getRecentMessages(
  threadId: string,
  limit = 10
): Promise<Array<{ role: string; content: string }>> {
  const messages = await prisma.conversationMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { role: true, content: true },
  })
  return messages.reverse().map(m => ({
    role: m.role.toLowerCase(),
    content: m.content,
  }))
}

// ─── Memoria larga — sin embeddings (V26) ──────────────────
// En V26 recuperamos las memorias más importantes y recientes,
// filtrando por keywords simples. Es un fallback razonable.
export async function recallRelevantMemories(
  userId: string,
  query: string,
  limit = 5
): Promise<MemoryItem[]> {
  const now = new Date()

  // Eliminar memorias expiradas on-the-fly
  await prisma.userMemory.deleteMany({
    where: { userId, expiresAt: { not: null, lt: now } },
  }).catch(() => {})

  const queryLower = query.toLowerCase()
  // Keywords de relevancia por kind
  const relevanceKeywords = queryLower.split(/\s+/).filter(w => w.length > 3)

  const memories = await prisma.userMemory.findMany({
    where: { userId },
    orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
    take: 20,
  })

  // Scoring: importance + match keywords
  const scored = memories.map(m => {
    const contentLower = m.content.toLowerCase()
    const keywordMatches = relevanceKeywords.filter(kw => contentLower.includes(kw)).length
    const score = m.importance + keywordMatches * 0.2
    return { memory: m, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => ({
      id: s.memory.id,
      kind: s.memory.kind,
      content: s.memory.content,
      importance: s.memory.importance,
      createdAt: s.memory.createdAt,
    }))
}

// ─── Guardar fact con dedup por content exacto ─────────────
export async function rememberFact(params: {
  userId: string
  kind: MemoryKind
  content: string
  importance?: number
  sourceThreadId?: string
  expiresInDays?: number
}): Promise<void> {
  // Dedup por content exacto (caso-insensitivo)
  const existing = await prisma.userMemory.findFirst({
    where: {
      userId: params.userId,
      kind: params.kind,
      content: { equals: params.content, mode: 'insensitive' },
    },
  })

  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 86400_000)
    : null

  if (existing) {
    // Ya existe — solo incrementar importancia
    await prisma.userMemory.update({
      where: { id: existing.id },
      data: {
        importance: Math.min(1, existing.importance + 0.1),
        updatedAt: new Date(),
      },
    })
    return
  }

  await prisma.userMemory.create({
    data: {
      userId: params.userId,
      kind: params.kind,
      content: params.content.slice(0, 500),
      importance: params.importance ?? 0.5,
      sourceThreadId: params.sourceThreadId,
      expiresAt,
    },
  })
}

// ─── Extracción automática de hechos (sampling 0.3) ────────
const EXTRACTION_SAMPLE_RATE = 0.3

export async function extractAndStoreFacts(
  userId: string,
  threadId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  // Sampling: solo corre 30% de las veces, si el mensaje es sustantivo
  if (userMessage.length < 40) return
  if (Math.random() > EXTRACTION_SAMPLE_RATE) return

  const prompt = `Analiza este intercambio entre un dropshipper y el asistente Vitalcom.
Extrae ÚNICAMENTE hechos duraderos y útiles sobre el usuario (no datos efímeros).

Categorías válidas (usa EXACTAMENTE estos valores):
- PREFERENCE: cómo prefiere comunicarse, formato, horario
- FACT: datos objetivos del negocio (países, productos top, nicho)
- GOAL: metas explícitas mencionadas
- PAIN_POINT: problemas recurrentes o frustraciones
- SUCCESS: algo que le funcionó
- WARNING: algo a evitar según su contexto

Responde SOLO JSON:
{"facts": [{"kind": "GOAL", "content": "quiere facturar 5M COP este mes", "importance": 0.8}]}

Si no hay hechos relevantes: {"facts": []}

Usuario: ${userMessage}
Asistente: ${assistantResponse}`

  const res = await route({
    taskType: 'extraction',
    systemPrompt: 'Eres un extractor de hechos conciso. Solo extrae información duradera que valga la pena recordar.',
    messages: [{ role: 'user', content: prompt }],
    jsonMode: true,
    maxTokens: 300,
    temperature: 0,
    userId,
  })

  if (res.provider === 'rules') return

  try {
    const parsed = JSON.parse(res.content)
    if (!Array.isArray(parsed.facts)) return
    for (const fact of parsed.facts.slice(0, 3)) {
      if (!fact.kind || !fact.content) continue
      const kindUpper = String(fact.kind).toUpperCase()
      if (!(kindUpper in MemoryKind)) continue
      await rememberFact({
        userId,
        kind: kindUpper as MemoryKind,
        content: String(fact.content),
        importance: Math.min(1, Math.max(0, Number(fact.importance) || 0.5)),
        sourceThreadId: threadId,
      })
    }
  } catch {
    // silenciar — extracción es best-effort
  }
}

// ─── Construir bloque de contexto para inyectar en prompt ──
export async function buildUserContext(
  userId: string,
  query: string,
  threadId?: string
): Promise<string> {
  const [user, orderCount, memories, recentMessages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true, createdAt: true, country: true },
    }),
    prisma.order.count({ where: { userId } }),
    recallRelevantMemories(userId, query, 5),
    threadId ? getRecentMessages(threadId, 6) : Promise.resolve([]),
  ])

  const parts: string[] = ['## Contexto del usuario']
  if (user) {
    parts.push(`- Nombre: ${user.name ?? 'sin nombre'}`)
    parts.push(`- Rol: ${user.role}`)
    parts.push(`- Miembro desde: ${user.createdAt.toISOString().slice(0, 10)}`)
    parts.push(`- País: ${user.country ?? 'no definido'}`)
    parts.push(`- Pedidos totales: ${orderCount}`)
  }

  if (memories.length > 0) {
    parts.push('\n## Lo que recordamos de este usuario')
    for (const m of memories) {
      parts.push(`- [${m.kind}] ${m.content}`)
    }
  }

  if (recentMessages.length > 0) {
    parts.push('\n## Mensajes recientes del thread')
    for (const msg of recentMessages) {
      parts.push(`${msg.role}: ${msg.content.slice(0, 200)}`)
    }
  }

  return parts.join('\n')
}

// ─── Decay (cron diario) ────────────────────────────────────
// Baja importancia 0.02 por día sin update; elimina las <0.05
export async function decayMemoryImportance(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000)
  await prisma.$executeRaw`
    UPDATE "UserMemory"
    SET "importance" = GREATEST(0, "importance" - 0.02),
        "updatedAt" = NOW()
    WHERE "updatedAt" < ${sevenDaysAgo}
      AND "importance" > 0.05
  `
  const deleted = await prisma.userMemory.deleteMany({
    where: { importance: { lt: 0.05 } },
  })
  return deleted.count
}
