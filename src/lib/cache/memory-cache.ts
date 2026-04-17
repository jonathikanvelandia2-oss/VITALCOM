// ── Cache in-memory con TTL + tags + LRU ─────────────────
// Para datos de lectura frecuente (catálogo, stats, ranking).
// No requiere Redis — funciona en cada instancia Vercel.
// Perfecto hasta ~10k usuarios concurrentes; después migrar a Upstash.

type CacheEntry<T> = {
  value: T
  expiresAt: number
  tags: readonly string[]
  hits: number
  createdAt: number
}

type CacheStats = {
  hits: number
  misses: number
  sets: number
  evictions: number
  size: number
  hitRate: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutos
const MAX_ENTRIES = 500
const CLEANUP_INTERVAL_MS = 2 * 60 * 1000 // cada 2 min

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private stats = { hits: 0, misses: 0, sets: 0, evictions: 0 }

  constructor() {
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS)
    }
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      this.stats.misses++
      return null
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      this.stats.misses++
      return null
    }

    entry.hits++
    this.stats.hits++
    // LRU: refrescar posición
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  set<T>(
    key: string,
    value: T,
    options: { ttlMs?: number; tags?: readonly string[] } = {},
  ): void {
    const ttl = options.ttlMs ?? DEFAULT_TTL_MS

    // Eviction LRU si llegamos al límite
    if (this.store.size >= MAX_ENTRIES && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey) {
        this.store.delete(oldestKey)
        this.stats.evictions++
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      tags: options.tags ?? [],
      hits: 0,
      createdAt: Date.now(),
    })
    this.stats.sets++
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  /** Invalida todas las entradas con un tag específico. */
  invalidateTag(tag: string): number {
    let count = 0
    for (const [key, entry] of this.store) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  /** Invalida por prefijo de key. */
  invalidatePrefix(prefix: string): number {
    let count = 0
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  clear(): void {
    this.store.clear()
  }

  /** Wrapper: devuelve cached o ejecuta fn y cachea. */
  async remember<T>(
    key: string,
    fn: () => Promise<T>,
    options: { ttlMs?: number; tags?: readonly string[] } = {},
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    const value = await fn()
    this.set(key, value, options)
    return value
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      size: this.store.size,
      hitRate: total > 0 ? Math.round((this.stats.hits / total) * 10000) / 100 : 0,
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (entry.expiresAt < now) this.store.delete(key)
    }
  }
}

// Singleton — persiste mientras viva la instancia de Vercel
declare global {
  // eslint-disable-next-line no-var
  var __vitalcomCache: MemoryCache | undefined
}

export const cache = globalThis.__vitalcomCache ?? new MemoryCache()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__vitalcomCache = cache
}

// ── TTL presets ──
export const CACHE_TTL = {
  /** 30s — datos hot que cambian frecuente (stock, cart) */
  short: 30 * 1000,
  /** 5min — datos tipo catálogo, stats de usuario */
  medium: 5 * 60 * 1000,
  /** 30min — catálogo completo, configuración */
  long: 30 * 60 * 1000,
  /** 1h — datos casi estáticos (categorías, países) */
  veryLong: 60 * 60 * 1000,
} as const

// ── Tags presets ──
export const CACHE_TAGS = {
  products: 'products',
  stock: 'stock',
  users: 'users',
  orders: 'orders',
  ranking: 'ranking',
  stats: 'stats',
} as const
