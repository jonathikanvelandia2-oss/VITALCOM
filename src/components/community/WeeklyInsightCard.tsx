'use client'

import Link from 'next/link'
import {
  Sparkles, TrendingUp, TrendingDown, Minus, RefreshCw, Loader2,
  AlertTriangle, AlertOctagon, Info, CheckCircle2, ArrowRight,
} from 'lucide-react'
import {
  useMyWeeklyInsight,
  useRegenerateWeeklyInsight,
  type WeeklyHighlight,
  type WeeklyRecommendation,
} from '@/hooks/useInsights'

// Weekly Insight Card — resume la semana del VITALCOMMER en un solo lugar.
// Unifica P&G + Health Score + alertas + recomendaciones accionables.

const PRIORITY_META: Record<WeeklyRecommendation['priority'], { label: string; color: string; icon: typeof AlertOctagon }> = {
  critical: { label: 'Crítico', color: 'var(--vc-error)', icon: AlertOctagon },
  high:     { label: 'Alta',    color: 'var(--vc-warning)', icon: AlertTriangle },
  medium:   { label: 'Media',   color: 'var(--vc-info)', icon: Info },
  low:      { label: 'Tranquilo', color: 'var(--vc-lime-main)', icon: CheckCircle2 },
}

function TrendIcon({ trend, className }: { trend: WeeklyHighlight['trend']; className?: string }) {
  if (trend === 'up')   return <TrendingUp className={className} style={{ color: 'var(--vc-lime-main)' }} />
  if (trend === 'down') return <TrendingDown className={className} style={{ color: 'var(--vc-error)' }} />
  if (trend === 'flat') return <Minus className={className} style={{ color: 'var(--vc-gray-mid)' }} />
  return null
}

export function WeeklyInsightCard() {
  const q = useMyWeeklyInsight()
  const regen = useRegenerateWeeklyInsight()

  if (q.isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--vc-lime-main)]/15 bg-[var(--vc-black-mid)] p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          <span className="text-xs text-[var(--vc-white-dim)]">Generando tu resumen semanal…</span>
        </div>
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <div className="rounded-2xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6">
        <div className="text-xs text-[var(--vc-white-dim)]">
          No se pudo cargar el resumen semanal.{' '}
          <button
            className="underline hover:text-[var(--vc-lime-main)]"
            onClick={() => q.refetch()}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const insight = q.data
  const weekStart = new Date(insight.weekStart)
  const weekEnd = new Date(insight.weekEnd)

  return (
    <div
      className="rounded-2xl border bg-[var(--vc-black-mid)] p-6"
      style={{ borderColor: 'rgba(198, 255, 60, 0.2)' }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(198,255,60,0.15)' }}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
              >
                Tu semana IA
              </span>
              <span className="text-[10px] text-[var(--vc-gray-mid)]">
                {weekStart.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                {' → '}
                {weekEnd.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            <h3
              className="mt-1 text-base font-bold leading-tight"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              {insight.headline}
            </h3>
          </div>
        </div>

        <button
          onClick={() => regen.mutate()}
          disabled={regen.isPending}
          title="Recalcular ahora"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] transition hover:border-[var(--vc-lime-main)]/40 disabled:opacity-40"
        >
          {regen.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--vc-white-dim)' }} />
          )}
        </button>
      </div>

      {/* Highlights */}
      {insight.highlights.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {insight.highlights.slice(0, 6).map((h, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2"
            >
              <div className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">
                {h.label}
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}
                >
                  {h.value}
                </span>
                <TrendIcon trend={h.trend} className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recomendaciones */}
      {insight.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
            Qué hacer esta semana
          </div>
          {insight.recommendations.map((r, i) => {
            const meta = PRIORITY_META[r.priority]
            const Icon = meta.icon
            const inner = (
              <>
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}40` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs font-bold text-[var(--vc-white-soft)]">{r.title}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--vc-white-dim)]">
                    {r.action}
                  </p>
                </div>
                {r.href && (
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--vc-gray-mid)]" />
                )}
              </>
            )
            const common = 'group flex items-start gap-2.5 rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-3 transition hover:border-[var(--vc-lime-main)]/30'
            return r.href ? (
              <Link key={i} href={r.href} className={common}>
                {inner}
              </Link>
            ) : (
              <div key={i} className={common}>
                {inner}
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-right text-[9px] text-[var(--vc-gray-mid)]">
        Generado {new Date(insight.generatedAt).toLocaleString('es-CO')}
      </p>
    </div>
  )
}
