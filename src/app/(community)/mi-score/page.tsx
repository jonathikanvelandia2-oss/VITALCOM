'use client'

import Link from 'next/link'
import { Heart, RefreshCw, Loader2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import {
  useMyHealthScore, useRefreshMyHealthScore,
  SEGMENT_META, FACTOR_META, type HealthBreakdown,
} from '@/hooks/useHealthScore'
import { WeeklyInsightCard } from '@/components/community/WeeklyInsightCard'

export default function MiScorePage() {
  const scoreQ = useMyHealthScore()
  const refresh = useRefreshMyHealthScore()

  const data = scoreQ.data

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
            >
              Mi Health Score
            </h1>
            <p className="mt-1 text-sm text-[var(--vc-white-dim)]">
              Un número 0-100 que resume qué tan activo estás en Vitalcom.
              Se recalcula cada noche.
            </p>
          </div>
          <button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-white-soft)] transition hover:border-[var(--vc-lime-main)]/40 disabled:opacity-40"
          >
            {refresh.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Recalcular
          </button>
        </div>

        {/* Loading */}
        {scoreQ.isLoading && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-10 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
            <div className="text-xs text-[var(--vc-white-dim)]">Calculando tu score…</div>
          </div>
        )}

        {data && (
          <>
            {/* Score hero */}
            <ScoreHero data={data} />

            {/* Weekly Insight (V34) — resumen IA accionable */}
            <div className="mt-6">
              <WeeklyInsightCard />
            </div>

            {/* Breakdown */}
            <div className="mt-6">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Desglose por factor
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(FACTOR_META) as (keyof HealthBreakdown)[]).map(factor => {
                  const meta = FACTOR_META[factor]
                  const value = data.breakdown[factor] ?? 0
                  const pct = meta.max === 0 ? 0 : Math.round((value / meta.max) * 100)
                  return (
                    <Link
                      key={factor}
                      href={meta.link}
                      className="group rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3 transition hover:border-[var(--vc-lime-main)]/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[var(--vc-white-soft)]">{meta.label}</div>
                        <div className="text-xs font-bold" style={{ color: pct >= 60 ? '#C6FF3C' : pct >= 30 ? '#FFB800' : '#FF4757' }}>
                          {value}/{meta.max}
                        </div>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--vc-black-soft)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 60 ? 'var(--vc-lime-main)' : pct >= 30 ? 'var(--vc-warning)' : 'var(--vc-error)',
                          }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[var(--vc-white-dim)]">{meta.hint}</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0 text-[var(--vc-gray-mid)] transition group-hover:translate-x-0.5 group-hover:text-[var(--vc-lime-main)]" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ScoreHero({ data }: { data: NonNullable<ReturnType<typeof useMyHealthScore>['data']> }) {
  const seg = SEGMENT_META[data.segment]

  // Arco SVG simple de 0 a 100
  const radius = 68
  const circumference = Math.PI * radius // semicírculo
  const pctRatio = Math.min(100, Math.max(0, data.score)) / 100

  return (
    <div className="rounded-2xl border border-[var(--vc-lime-main)]/20 bg-[var(--vc-black-mid)] p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative flex-shrink-0">
          <svg width="180" height="110" viewBox="0 0 180 110">
            {/* Track */}
            <path
              d="M 20 100 A 68 68 0 0 1 160 100"
              fill="none"
              stroke="var(--vc-black-soft)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Progress */}
            <path
              d="M 20 100 A 68 68 0 0 1 160 100"
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pctRatio)}
              style={{ filter: `drop-shadow(0 0 8px ${seg.color}80)` }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-3 text-center">
            <div
              className="text-5xl font-black"
              style={{ fontFamily: 'var(--font-display)', color: seg.color }}
            >
              {data.score}
            </div>
            <div className="text-[9px] uppercase tracking-widest text-[var(--vc-white-dim)]">/ 100</div>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${seg.color}20`, color: seg.color }}
            >
              <Heart className="mr-1 inline h-2.5 w-2.5" />
              {seg.label}
            </span>
            {data.scoreDelta !== null && data.scoreDelta !== 0 && (
              <span
                className="flex items-center gap-0.5 rounded bg-[var(--vc-black-soft)] px-1.5 py-0.5 text-[10px] font-bold"
                style={{ color: data.scoreDelta > 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}
              >
                {data.scoreDelta > 0 ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                {data.scoreDelta > 0 ? '+' : ''}{data.scoreDelta}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-[var(--vc-white-soft)]">{seg.tagline}</p>
          <p className="mt-1 text-[10px] text-[var(--vc-gray-mid)]">
            Último cálculo: {new Date(data.computedAt).toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    </div>
  )
}
