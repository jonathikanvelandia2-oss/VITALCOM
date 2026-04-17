// ─── Cache inteligente para VITA ───
// Almacena respuestas frecuentes para evitar llamadas repetidas a OpenAI
// Auto-aprende: si una consulta similar se repite, usa la cache

type CacheEntry = {
  response: string
  intent: string
  hitCount: number
  createdAt: number
  lastUsedAt: number
  toolResults?: Record<string, unknown>
}

type LearnedPattern = {
  pattern: string
  normalizedForm: string
  intent: string
  frequency: number
  lastSeen: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const MAX_CACHE_SIZE = 200
const MAX_PATTERNS = 500

const responseCache = new Map<string, CacheEntry>()
const learnedPatterns = new Map<string, LearnedPattern>()

// Limpieza periódica
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of responseCache) {
    if (now - entry.lastUsedAt > CACHE_TTL) responseCache.delete(key)
  }
  // Limpiar patrones con baja frecuencia (más de 1 hora sin uso)
  for (const [key, pattern] of learnedPatterns) {
    if (now - pattern.lastSeen > 60 * 60 * 1000 && pattern.frequency < 3) {
      learnedPatterns.delete(key)
    }
  }
}, 60_000)

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function generateCacheKey(userId: string, normalizedQuery: string, intent: string): string {
  return `${userId}:${intent}:${normalizedQuery.slice(0, 80)}`
}

// Genera una firma semántica simplificada para matching similar
function semanticSignature(query: string): string {
  const stopWords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'a', 'por',
    'para', 'con', 'que', 'me', 'mi', 'mis', 'es', 'son', 'hay', 'tiene',
    'como', 'cual', 'donde', 'cuando', 'muestrame', 'dame', 'dime', 'ver',
    'quiero', 'necesito', 'puedes', 'podrias', 'favor', 'todos', 'todas',
  ])

  return normalizeQuery(query)
    .split(' ')
    .filter(w => w.length > 2 && !stopWords.has(w))
    .sort()
    .join(' ')
}

/**
 * Busca en cache una respuesta para esta consulta
 */
export function getCachedResponse(
  userId: string,
  query: string,
  intent: string
): { response: string; toolResults?: Record<string, unknown> } | null {
  const normalized = normalizeQuery(query)
  const key = generateCacheKey(userId, normalized, intent)

  // Match exacto
  const exact = responseCache.get(key)
  if (exact && Date.now() - exact.lastUsedAt < CACHE_TTL) {
    exact.hitCount++
    exact.lastUsedAt = Date.now()
    return { response: exact.response, toolResults: exact.toolResults }
  }

  // Match semántico (queries similares)
  const sig = semanticSignature(query)
  for (const [cKey, entry] of responseCache) {
    if (cKey.startsWith(`${userId}:${intent}:`) && Date.now() - entry.lastUsedAt < CACHE_TTL) {
      const cachedSig = semanticSignature(cKey.split(':').slice(2).join(':'))
      if (cachedSig === sig && sig.length > 5) {
        entry.hitCount++
        entry.lastUsedAt = Date.now()
        return { response: entry.response, toolResults: entry.toolResults }
      }
    }
  }

  return null
}

/**
 * Guarda respuesta en cache
 */
export function cacheResponse(
  userId: string,
  query: string,
  intent: string,
  response: string,
  toolResults?: Record<string, unknown>
): void {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    // Evictar entrada más antigua o menos usada
    let oldestKey = ''
    let oldestTime = Infinity
    for (const [key, entry] of responseCache) {
      if (entry.lastUsedAt < oldestTime) {
        oldestTime = entry.lastUsedAt
        oldestKey = key
      }
    }
    if (oldestKey) responseCache.delete(oldestKey)
  }

  const normalized = normalizeQuery(query)
  const key = generateCacheKey(userId, normalized, intent)

  responseCache.set(key, {
    response,
    intent,
    hitCount: 1,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    toolResults,
  })
}

/**
 * Registra un patrón de consulta para auto-aprendizaje
 * Cuando un patrón se repite mucho, VITA aprende a responder más rápido
 */
export function learnPattern(query: string, intent: string): void {
  const normalized = normalizeQuery(query)
  const sig = semanticSignature(query)

  if (sig.length < 3) return

  const existing = learnedPatterns.get(sig)
  if (existing) {
    existing.frequency++
    existing.lastSeen = Date.now()
  } else {
    if (learnedPatterns.size >= MAX_PATTERNS) {
      let leastKey = ''
      let leastFreq = Infinity
      for (const [key, p] of learnedPatterns) {
        if (p.frequency < leastFreq) {
          leastFreq = p.frequency
          leastKey = key
        }
      }
      if (leastKey) learnedPatterns.delete(leastKey)
    }

    learnedPatterns.set(sig, {
      pattern: query,
      normalizedForm: normalized,
      intent,
      frequency: 1,
      lastSeen: Date.now(),
    })
  }
}

/**
 * Obtiene patrones frecuentes para incluir en el prompt
 * Le dice a VITA qué preguntan más para que responda mejor
 */
export function getFrequentPatterns(topN: number = 5): Array<{ pattern: string; intent: string; frequency: number }> {
  return [...learnedPatterns.values()]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, topN)
    .map(({ pattern, intent, frequency }) => ({ pattern, intent, frequency }))
}

/**
 * Stats de cache para monitoreo
 */
export function getCacheStats() {
  let totalHits = 0
  for (const entry of responseCache.values()) {
    totalHits += entry.hitCount
  }
  return {
    cacheSize: responseCache.size,
    patternsLearned: learnedPatterns.size,
    totalHits,
  }
}
