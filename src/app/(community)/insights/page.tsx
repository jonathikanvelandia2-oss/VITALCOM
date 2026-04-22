'use client'

import { Sparkles, History, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { WeeklyInsightCard } from '@/components/community/WeeklyInsightCard'
import {
  useMyInsightHistory,
  useMyWeeklyInsight,
  type WeeklyInsightData,
} from '@/hooks/useInsights'

// Página dedicada de Weekly Insights (V34) — vista completa + histórico.
// El card principal ya vive en /mi-score; aquí damos evolución 8 semanas
// + detalle de benchmarking vs tier.

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function formatMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return String(Math.round(v))
}

export default function InsightsPage() {
  const current = useMyWeeklyInsight()
  const history = useMyInsightHistory(8)

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(198,255,60,0.15)', border: '1px solid rgba(198,255,60,0.3)' }}
          >
            <Sparkles className="h-5 w-5" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
          <div>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
            >
              Insights semanales
            </h1>
            <p className="mt-1 text-sm text-[var(--vc-white-dim)]">
              Tu resumen IA de la semana con 3 acciones priorizadas. Se regenera cada domingo 4am.
            </p>
          </div>
        </div>

        {/* Card actual */}
        <WeeklyInsightCard />

        {/* Benchmarking detallado (solo si hay data + percentile válido) */}
        {current.data && current.data.tierPercentile !== null && current.data.tierAvgRevenue !== null && (
          <BenchmarkCard
            percentile={current.data.tierPercentile}
            tierAvgRevenue={current.data.tierAvgRevenue}
            userRevenue={current.data.revenue}
            segment={current.data.segment}
          />
        )}

        {/* Histórico */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4" style={{ color: 'var(--vc-white-dim)' }} />
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}
            >
              Últimas semanas
            </h2>
          </div>

          {history.isLoading && (
            <div className="flex items-center justify-center rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-8">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
            </div>
          )}

          {history.data?.items && history.data.items.length > 1 && (
            <div className="space-y-2">
              {history.data.items.slice(1).map(item => (
                <HistoryRow key={item.id} insight={item} />
              ))}
            </div>
          )}

          {history.data?.items && history.data.items.length <= 1 && !history.isLoading && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center">
              <p className="text-xs text-[var(--vc-gray-mid)]">
                Aún no hay insights previos. Tu primer histórico aparece la próxima semana.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BenchmarkCard({
  percentile,
  tierAvgRevenue,
  userRevenue,
  segment,
}: {
  percentile: number
  tierAvgRevenue: number
  userRevenue: number
  segment: WeeklyInsightData['segment']
}) {
  const delta = userRevenue - tierAvgRevenue
  const above = delta >= 0

  return (
    <div
      className="mt-4 rounded-2xl border p-5"
      style={{
        borderColor: above ? 'rgba(198,255,60,0.25)' : 'rgba(255,184,0,0.25)',
        background: 'var(--vc-black-mid)',
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: above ? 'rgba(198,255,60,0.15)' : 'rgba(255,184,0,0.15)',
            color: above ? 'var(--vc-lime-main)' : 'var(--vc-warning)',
          }}
        >
          Benchmark {segment ?? 'tier'}
        </span>
        <span className="text-xs text-[var(--vc-gray-mid)]">
          vs VITALCOMMERS del mismo segmento
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Tu percentil"
          value={`${percentile}%`}
          hint={
            percentile >= 75 ? 'Top 25%' :
            percentile >= 50 ? 'Arriba del promedio' :
            percentile >= 25 ? 'Abajo del promedio' : 'Últimos 25%'
          }
          color={percentile >= 50 ? 'var(--vc-lime-main)' : 'var(--vc-warning)'}
        />
        <Stat
          label="Tu revenue"
          value={formatMoney(userRevenue)}
          hint="esta semana"
          color="var(--vc-white-soft)"
        />
        <Stat
          label="Promedio tier"
          value={formatMoney(tierAvgRevenue)}
          hint={`${above ? '+' : ''}${formatMoney(delta)} vs ti`}
          color="var(--vc-white-dim)"
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  color,
}: {
  label: string
  value: string
  hint: string
  color: string
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">{label}</div>
      <div
        className="mt-0.5 text-2xl font-black"
        style={{ color, fontFamily: 'var(--font-mono)' }}
      >
        {value}
      </div>
      <div className="text-[10px] text-[var(--vc-white-dim)]">{hint}</div>
    </div>
  )
}

function HistoryRow({ insight }: { insight: WeeklyInsightData }) {
  const trend =
    insight.revenueDeltaPct > 2 ? 'up' :
    insight.revenueDeltaPct < -2 ? 'down' : 'flat'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? 'var(--vc-lime-main)' :
    trend === 'down' ? 'var(--vc-error)' : 'var(--vc-gray-mid)'

  return (
    <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4 transition hover:border-[var(--vc-lime-main)]/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              {formatShortDate(insight.weekStart)} → {formatShortDate(insight.weekEnd)}
            </span>
            <TrendIcon className="h-3 w-3" style={{ color: trendColor }} />
            <span className="text-[10px] font-bold" style={{ color: trendColor }}>
              {insight.revenueDeltaPct > 0 ? '+' : ''}{insight.revenueDeltaPct.toFixed(1)}%
            </span>
          </div>
          <p
            className="mt-1 text-sm font-bold leading-snug"
            style={{ color: 'var(--vc-white-soft)' }}
          >
            {insight.headline}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div
            className="text-xs font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}
          >
            {formatMoney(insight.revenue)}
          </div>
          <div className="text-[10px] text-[var(--vc-gray-mid)]">
            {insight.orderCount} pedidos
          </div>
        </div>
      </div>
    </div>
  )
}
