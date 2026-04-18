'use client'

import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, Database, TrendingUp, Zap, AlertCircle } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// ── Debug de cache en memoria ────────────────────────────
// Hit rate, entries, evictions. Permite limpiar cache manualmente.

type CacheStats = {
  hits: number
  misses: number
  sets: number
  evictions: number
  size: number
  hitRate: number
}

export default function CacheStatsPage() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/cache-stats')
      const json = await res.json()
      if (json.ok) setStats(json.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    if (!confirm('¿Limpiar todo el cache? Las próximas consultas irán directo a la BD.')) return
    setClearing(true)
    try {
      const res = await fetch('/api/admin/cache-stats', { method: 'DELETE' })
      if (res.ok) await fetchStats()
    } finally {
      setClearing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchStats, 2000)
    return () => clearInterval(id)
  }, [autoRefresh])

  return (
    <>
      <AdminTopbar
        title="Cache stats"
        subtitle="Debug del cache in-memory. No persiste entre restarts de Vercel."
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px solid rgba(198, 255, 60, 0.3)',
              color: 'var(--vc-white-soft)',
            }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>

          <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4"
            />
            Auto-refresh 2s
          </label>

          <button
            onClick={clearCache}
            disabled={clearing}
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
            style={{
              background: 'rgba(255, 71, 87, 0.15)',
              border: '1px solid rgba(255, 71, 87, 0.4)',
              color: '#FF4757',
            }}
          >
            <Trash2 className="h-4 w-4" />
            {clearing ? 'Limpiando...' : 'Limpiar cache'}
          </button>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric
                icon={TrendingUp}
                label="Hit rate"
                value={`${stats.hitRate}%`}
                hint={stats.hitRate >= 70 ? 'Saludable' : stats.hitRate >= 40 ? 'Normal' : 'Bajo — espera tráfico'}
                accent={stats.hitRate >= 70 ? '#C6FF3C' : stats.hitRate >= 40 ? '#FFB800' : '#FF4757'}
              />
              <Metric icon={Database} label="Entries" value={stats.size.toString()} hint={`Máx. 500`} />
              <Metric icon={Zap} label="Hits" value={stats.hits.toLocaleString()} hint="Cache golpeado" />
              <Metric icon={AlertCircle} label="Misses" value={stats.misses.toLocaleString()} hint="Fue a BD" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <StatRow label="Sets" value={stats.sets} desc="Veces que se escribió al cache" />
              <StatRow label="Evictions" value={stats.evictions} desc="Entradas eliminadas por llegar al límite LRU" />
            </div>

            <div
              className="rounded-xl p-5 text-sm"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid rgba(198, 255, 60, 0.15)',
                color: 'var(--vc-white-dim)',
              }}
            >
              <h3 className="mb-3 text-base font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                Cómo leer esto
              </h3>
              <ul className="space-y-2 leading-relaxed">
                <li>
                  <strong style={{ color: 'var(--vc-lime-main)' }}>Hit rate &gt;70%</strong> con tráfico real: el cache está haciendo su trabajo.
                </li>
                <li>
                  <strong style={{ color: '#FFB800' }}>Misses altos con pocos hits</strong>: aún no hay consultas repetidas. Normal al inicio.
                </li>
                <li>
                  <strong style={{ color: '#FF4757' }}>Evictions subiendo</strong>: el límite de 500 entradas es bajo para el tráfico. Considerar Redis.
                </li>
                <li>
                  <strong style={{ color: 'var(--vc-white-soft)' }}>Restart de Vercel</strong> → todo se borra. Es esperado, no es un bug.
                </li>
              </ul>
            </div>
          </>
        ) : loading ? (
          <div className="text-center" style={{ color: 'var(--vc-white-dim)' }}>
            Cargando...
          </div>
        ) : (
          <div className="text-center" style={{ color: '#FF4757' }}>
            Error cargando stats
          </div>
        )}
      </div>
    </>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: any
  label: string
  value: string
  hint: string
  accent?: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198, 255, 60, 0.15)',
      }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: accent ?? 'var(--vc-lime-main)' }} />
        <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--vc-white-dim)' }}>
          {label}
        </span>
      </div>
      <div
        className="mt-2 text-2xl font-bold"
        style={{
          color: accent ?? 'var(--vc-white-soft)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
        {hint}
      </div>
    </div>
  )
}

function StatRow({ label, value, desc }: { label: string; value: number; desc: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198, 255, 60, 0.1)',
      }}
    >
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--vc-white-soft)' }}>
          {label}
        </div>
        <div className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
          {desc}
        </div>
      </div>
      <div className="text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}
