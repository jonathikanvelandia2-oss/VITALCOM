'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, DollarSign, ShieldCheck, Zap, Loader2, RefreshCw,
  Brain, Store, Wand2, Sparkles, CheckCircle2, ArrowRight, BarChart3,
  PiggyBank, Target,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useImpact, useRecomputeImpact,
  type AppliedSource, type AppliedActionItem,
} from '@/hooks/useImpact'

// ── V21 — Impact Tracking IA ────────────────────────────
// Dashboard "la IA prueba su ROI": muestra $ ahorrados + ganados
// por aplicar recomendaciones, con timeline + top actions + breakdown.

const SOURCE_META: Record<AppliedSource, { label: string; icon: typeof Brain; color: string; bg: string }> = {
  MEDIA_BUYER:     { label: 'MediaBuyer',      icon: Brain,  color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  STORE_OPTIMIZER: { label: 'OptimizadorTienda', icon: Store, color: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.12)' },
  CREATIVE_MAKER:  { label: 'CreativoMaker',    icon: Wand2, color: '#3CC6FF', bg: 'rgba(60,198,255,0.12)' },
}

const KIND_META: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
  savings:  { label: 'Ahorro',  icon: PiggyBank,   color: '#3CC6FF' },
  revenue:  { label: 'Ingreso', icon: TrendingUp,  color: 'var(--vc-lime-main)' },
  margin:   { label: 'Margen',  icon: BarChart3,   color: '#FFB800' },
  retention:{ label: 'Prevención', icon: ShieldCheck, color: 'var(--vc-gray-mid)' },
}

function fmtMoney(n: number): string {
  if (n === 0) return '$0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}k`
  return `${n < 0 ? '-' : ''}$${Math.round(abs).toLocaleString('es-CO')}`
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export default function ImpactoPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const impactQ = useImpact(days)
  const recomputeMut = useRecomputeImpact()

  const data = impactQ.data

  const maxDaily = data?.daily.reduce((m, d) => Math.max(m, d.estimated), 0) ?? 1

  async function handleRecompute() {
    const r = await recomputeMut.mutateAsync()
    if (r.updated > 0) {
      alert(`✨ ${r.updated} acción(es) actualizadas con datos reales post-apply`)
    } else {
      alert('Todas las acciones aplicadas aún están en periodo de medición (<7 días).')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunityTopbar
        title="Impacto IA"
        subtitle="Lo que tu IA ha ahorrado y ganado cada vez que aplicaste una recomendación"
      />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(198,255,60,0.1) 0%, rgba(60,198,255,0.05) 100%)',
          borderBottom: '1px solid rgba(198,255,60,0.18)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: 'var(--vc-gradient-primary)',
                    boxShadow: '0 0 32px var(--vc-glow-lime)',
                  }}
                >
                  <TrendingUp size={22} style={{ color: 'var(--vc-black)' }} />
                </div>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: 'var(--vc-lime-main)',
                    color: 'var(--vc-black)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  V21 · IA-PROVEN ROI
                </span>
              </div>
              <h1
                className="mb-2 text-4xl font-black"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
              >
                Impacto IA
              </h1>
              <p className="text-base" style={{ color: 'var(--vc-white-dim)' }}>
                Cada vez que aplicas una recomendación IA, la plataforma guarda el
                snapshot del momento y estima el impacto a 30 días con heurísticas
                calibradas. Los datos reales post-apply (7+ días) validan el estimado.
                Tu IA ya no solo sugiere — <span style={{ color: 'var(--vc-lime-main)', fontWeight: 600 }}>prueba su ROI</span>.
              </p>
            </div>

            {/* Total impact destacado */}
            <div
              className="min-w-[280px] rounded-2xl p-5 text-center"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid rgba(198,255,60,0.3)',
                boxShadow: '0 0 32px var(--vc-glow-lime)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
              >
                Impacto estimado {days}d
              </p>
              <p
                className="my-1 text-4xl font-black"
                style={{
                  background: 'var(--vc-gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {data ? fmtMoney(data.totals.estimatedImpactUsd) : '—'}
              </p>
              <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                en {data?.totals.appliedInPeriod ?? 0} acciones aplicadas
              </p>
              {data && data.totals.realizedImpactUsd !== 0 && (
                <p
                  className="mt-2 text-[11px] font-bold"
                  style={{ color: 'var(--vc-lime-main)' }}
                >
                  ✓ Realizado: {fmtMoney(data.totals.realizedImpactUsd)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Controles */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg p-1"
            style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="rounded-md px-3 py-1 text-[11px] font-semibold transition-all"
                style={{
                  background: days === d ? 'var(--vc-lime-main)' : 'transparent',
                  color: days === d ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={handleRecompute}
            disabled={recomputeMut.isPending}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-all disabled:opacity-50"
            style={{
              background: 'transparent',
              color: 'var(--vc-lime-main)',
              border: '1px solid rgba(198,255,60,0.3)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {recomputeMut.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Recalcular realizado
          </button>
        </div>

        {/* Desglose en KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiBreakdown
            label="Ahorros"
            value={data ? fmtMoney(data.totals.savingsUsd) : '—'}
            icon={PiggyBank}
            color="#3CC6FF"
            subtitle="Pausar · Reducir · Optimizar bid"
          />
          <KpiBreakdown
            label="Ingreso incremental"
            value={data ? fmtMoney(data.totals.revenueUsd) : '—'}
            icon={TrendingUp}
            color="var(--vc-lime-main)"
            subtitle="Escalar · Destacar · Cross-sell · Restock"
          />
          <KpiBreakdown
            label="Margen ganado"
            value={data ? fmtMoney(data.totals.marginUsd) : '—'}
            icon={BarChart3}
            color="#FFB800"
            subtitle="Ajuste de precios"
          />
          <KpiBreakdown
            label="Total aplicadas"
            value={String(data?.totals.allTimeApplied ?? 0)}
            icon={CheckCircle2}
            color="var(--vc-white-soft)"
            subtitle="Desde el inicio"
          />
        </div>

        {/* Timeline sparkline */}
        {data && data.daily.length > 0 && (
          <div
            className="mb-6 rounded-xl p-5"
            style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.12)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                >
                  Impacto diario estimado
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                >
                  Curva de valor generado por la IA
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
                <div className="h-2 w-2 rounded-full" style={{ background: 'var(--vc-lime-main)' }} />
                COP estimados
              </div>
            </div>
            <div className="flex h-32 items-end gap-1">
              {data.daily.map((d) => {
                const h = Math.max(2, (d.estimated / maxDaily) * 100)
                return (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${h}%`,
                        background: 'var(--vc-gradient-primary)',
                        boxShadow: '0 0 8px var(--vc-glow-lime)',
                      }}
                    />
                    <div
                      className="pointer-events-none absolute bottom-full mb-1 hidden rounded px-2 py-1 text-[10px] group-hover:block"
                      style={{
                        background: 'var(--vc-black-soft)',
                        color: 'var(--vc-white-soft)',
                        border: '1px solid var(--vc-lime-main)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtDay(d.day)} · {fmtMoney(d.estimated)} · {d.count} acc.
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Por agente */}
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {(['MEDIA_BUYER', 'STORE_OPTIMIZER', 'CREATIVE_MAKER'] as AppliedSource[]).map((src) => {
            const meta = SOURCE_META[src]
            const Icon = meta.icon
            const stats = data?.bySource.find((s) => s.source === src)
            return (
              <div
                key={src}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--vc-black-mid)',
                  border: `1px solid ${meta.color}30`,
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: meta.bg }}
                  >
                    <Icon size={14} style={{ color: meta.color }} />
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                  >
                    {meta.label}
                  </span>
                </div>
                <p
                  className="text-2xl font-black"
                  style={{ color: meta.color, fontFamily: 'var(--font-heading)' }}
                >
                  {stats ? fmtMoney(stats.estimatedImpactUsd) : '$0'}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                  {stats?.count ?? 0} acción{stats?.count === 1 ? '' : 'es'} aplicada{stats?.count === 1 ? '' : 's'}
                </p>
              </div>
            )
          })}
        </div>

        {/* Top 5 acciones + timeline */}
        {impactQ.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : !data || data.timeline.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Top 5 */}
            <div className="lg:col-span-2">
              <h3
                className="mb-3 text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
              >
                🏆 Top acciones con mayor impacto
              </h3>
              <div className="space-y-2">
                {data.topActions.map((a, i) => (
                  <TopActionCard key={a.id} action={a} rank={i + 1} />
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-3">
              <h3
                className="mb-3 text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}
              >
                📅 Timeline de acciones aplicadas
              </h3>
              <div className="space-y-2">
                {data.timeline.map((a) => (
                  <TimelineCard key={a.id} action={a} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiBreakdown({
  label, value, icon: Icon, color, subtitle,
}: {
  label: string; value: string; icon: typeof DollarSign; color: string; subtitle: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.12)' }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-2xl font-black"
        style={{ color, fontFamily: 'var(--font-heading)' }}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
        {subtitle}
      </p>
    </div>
  )
}

function TopActionCard({ action, rank }: { action: AppliedActionItem; rank: number }) {
  const src = SOURCE_META[action.source]
  const SrcIcon = src.icon
  const kind = action.estimatedImpactKind ? KIND_META[action.estimatedImpactKind] : null
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198,255,60,0.2)',
        boxShadow: rank === 1 ? '0 0 16px var(--vc-glow-lime)' : 'none',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black"
          style={{
            background: rank === 1 ? 'var(--vc-gradient-primary)' : src.bg,
            color: rank === 1 ? 'var(--vc-black)' : src.color,
            fontFamily: 'var(--font-heading)',
          }}
        >
          #{rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: src.bg, color: src.color, fontFamily: 'var(--font-mono)' }}
            >
              <SrcIcon size={8} /> {src.label.toUpperCase()}
            </span>
            {kind && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: `${kind.color}20`, color: kind.color, fontFamily: 'var(--font-mono)' }}
              >
                {kind.label.toUpperCase()}
              </span>
            )}
          </div>
          <p
            className="truncate text-[12px] font-semibold"
            style={{ color: 'var(--vc-white-soft)' }}
          >
            {action.title}
          </p>
          <p
            className="mt-1 text-lg font-black"
            style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}
          >
            {fmtMoney(action.estimatedImpactUsd)}
          </p>
        </div>
      </div>
    </div>
  )
}

function TimelineCard({ action }: { action: AppliedActionItem }) {
  const src = SOURCE_META[action.source]
  const SrcIcon = src.icon
  const kind = action.estimatedImpactKind ? KIND_META[action.estimatedImpactKind] : null
  const KindIcon = kind?.icon ?? Zap
  const positive = action.estimatedImpactUsd >= 0

  return (
    <div
      className="rounded-xl p-3 transition-all"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: src.bg }}
        >
          <SrcIcon size={15} style={{ color: src.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
            <span
              className="text-[9px] font-bold uppercase"
              style={{ color: src.color, fontFamily: 'var(--font-mono)' }}
            >
              {src.label}
            </span>
            <span
              className="text-[9px] uppercase"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              · {action.actionType.replace(/_/g, ' ')}
            </span>
            <span
              className="ml-auto text-[10px]"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              {fmtDay(action.appliedAt)}
            </span>
          </div>
          <p
            className="truncate text-[13px] font-semibold"
            style={{ color: 'var(--vc-white-soft)' }}
          >
            {action.title}
          </p>
          {action.estimatedRationale && (
            <p
              className="mt-1 line-clamp-2 text-[11px]"
              style={{ color: 'var(--vc-white-dim)' }}
            >
              {action.estimatedRationale}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div
            className="flex items-center gap-1 text-sm font-black"
            style={{
              color: positive
                ? 'var(--vc-lime-main)'
                : action.estimatedImpactUsd < 0
                  ? '#FF4757'
                  : 'var(--vc-gray-mid)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <KindIcon size={11} />
            {fmtMoney(action.estimatedImpactUsd)}
          </div>
          {action.realizedImpactUsd != null && (
            <div
              className="mt-0.5 flex items-center gap-0.5 text-[10px]"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
            >
              <CheckCircle2 size={9} /> real: {fmtMoney(action.realizedImpactUsd)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center rounded-2xl px-8 py-16 text-center"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px dashed rgba(198,255,60,0.3)',
      }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: 'var(--vc-gradient-primary)',
          boxShadow: '0 0 32px var(--vc-glow-lime)',
        }}
      >
        <TrendingUp size={28} style={{ color: 'var(--vc-black)' }} />
      </div>
      <h3
        className="mb-2 text-xl font-bold"
        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
      >
        Aún no has aplicado recomendaciones
      </h3>
      <p className="mb-6 max-w-md text-sm" style={{ color: 'var(--vc-white-dim)' }}>
        Cuando apliques tu primera acción desde MediaBuyer o OptimizadorTienda,
        el impacto estimado aparecerá aquí automáticamente.
      </p>
      <div className="flex gap-3">
        <Link
          href="/comando"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-bold transition-all"
          style={{
            background: 'var(--vc-gradient-primary)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 0 20px var(--vc-glow-lime)',
          }}
        >
          <Sparkles size={14} /> IR AL COMMAND CENTER <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
