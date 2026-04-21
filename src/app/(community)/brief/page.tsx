'use client'

import Link from 'next/link'
import {
  Sun, TrendingUp, TrendingDown, ArrowRight, Loader2, Target,
  Brain, Store, Wand2, AlertTriangle, Sparkles, Calendar,
  DollarSign, ShoppingCart, Megaphone, Flame,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useMorningBrief, type BriefAction } from '@/hooks/useMorningBrief'

// ── V25 — Morning Brief ─────────────────────────────────
// Hábito diario: el VITALCOMMER entra en la mañana, ve sus top 3
// acciones, deltas de KPIs vs ayer y su meta del mes. Cada elemento
// linkea al agente origen para aplicar sin fricción.

const SOURCE_META: Record<
  BriefAction['source'],
  { label: string; icon: typeof Brain; color: string; bg: string }
> = {
  MEDIA_BUYER:     { label: 'MediaBuyer',      icon: Brain,           color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  STORE_OPTIMIZER: { label: 'Tienda',          icon: Store,           color: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.12)' },
  CREATIVE_MAKER:  { label: 'Creativo',        icon: Wand2,           color: '#3CC6FF', bg: 'rgba(60,198,255,0.12)' },
  FINANCE_ALERT:   { label: 'Operación',       icon: AlertTriangle,   color: '#FF4757', bg: 'rgba(255,71,87,0.12)' },
}

function fmtMoney(n: number): string {
  if (n === 0) return '$0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}k`
  return `${n < 0 ? '-' : ''}$${Math.round(abs).toLocaleString('es-CO')}`
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        —
      </span>
    )
  }
  const positive = pct >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  const color = positive ? 'var(--vc-lime-main)' : '#FF4757'
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
      style={{ background: `${color}22`, color, fontFamily: 'var(--font-mono)' }}
    >
      <Icon size={10} /> {positive ? '+' : ''}{pct}%
    </span>
  )
}

export default function BriefPage() {
  const briefQ = useMorningBrief()
  const data = briefQ.data

  const dateLabel = data
    ? new Date(data.date).toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : ''

  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunityTopbar
        title="Morning Brief"
        subtitle="Tu resumen diario de lo que importa — primera cosa en la mañana"
      />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(198,255,60,0.12) 0%, rgba(255,184,0,0.05) 100%)',
          borderBottom: '1px solid rgba(198,255,60,0.18)',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[260px]">
              <div className="mb-2 flex items-center gap-2">
                <Sun size={18} style={{ color: 'var(--vc-lime-main)' }} />
                <span
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                >
                  V25 · Brief del día
                </span>
              </div>
              <h1
                className="mb-2 text-4xl md:text-5xl font-black leading-tight"
                style={{
                  background: 'var(--vc-gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {data?.greeting ?? 'Buenos días'}
              </h1>
              <p
                className="text-sm capitalize"
                style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}
              >
                <Calendar size={12} className="inline mr-1" /> {dateLabel}
              </p>
              {data?.summary && (
                <p
                  className="mt-3 text-sm"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-body)' }}
                >
                  {data.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {briefQ.isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        )}

        {!briefQ.isLoading && data && (
          <>
            {/* KPI Delta cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                icon={DollarSign}
                label="Ingreso hoy"
                value={fmtMoney(data.kpiDelta.revenueToday)}
                delta={data.kpiDelta.revenueDeltaPct}
                sub={`Ayer: ${fmtMoney(data.kpiDelta.revenueYesterday)}`}
              />
              <KpiCard
                icon={ShoppingCart}
                label="Pedidos hoy"
                value={String(data.kpiDelta.ordersToday)}
                delta={null}
                sub={`Ayer: ${data.kpiDelta.ordersYesterday}`}
              />
              <KpiCard
                icon={Megaphone}
                label="Gasto ads hoy"
                value={fmtMoney(data.kpiDelta.adSpendToday)}
                delta={null}
                sub="Presupuesto ejecutado"
              />
              <KpiCard
                icon={TrendingUp}
                label="Revenue 7d"
                value={fmtMoney(data.kpiDelta.revenue7d)}
                delta={data.kpiDelta.revenue7dDeltaPct}
                sub={`Semana pasada: ${fmtMoney(data.kpiDelta.revenue7dPrev)}`}
              />
            </div>

            {/* Top 3 acciones */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid rgba(198,255,60,0.15)',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className="flex items-center gap-2 text-lg font-bold"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                >
                  <Flame size={18} style={{ color: 'var(--vc-lime-main)' }} />
                  TOP 3 acciones de hoy
                </h2>
                <Link
                  href="/comando"
                  className="flex items-center gap-1 text-[11px] font-semibold hover:underline"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                >
                  Command Center <ArrowRight size={11} />
                </Link>
              </div>

              {data.topActions.length === 0 ? (
                <div
                  className="rounded-xl p-6 text-center"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px dashed var(--vc-gray-dark)',
                  }}
                >
                  <Sparkles size={22} className="mx-auto mb-2" style={{ color: 'var(--vc-lime-main)' }} />
                  <p
                    className="text-sm"
                    style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-body)' }}
                  >
                    No hay acciones urgentes hoy. Aprovecha para revisar métricas o lanzar un curso.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.topActions.map((action, idx) => {
                    const meta = SOURCE_META[action.source]
                    const Icon = meta.icon
                    return (
                      <Link
                        key={action.actionId}
                        href={action.link}
                        className="group block rounded-xl p-4 transition-all hover:translate-x-1"
                        style={{
                          background: 'var(--vc-black-soft)',
                          border: `1px solid ${meta.bg.replace('0.12', '0.3')}`,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-black"
                            style={{
                              background: meta.bg,
                              color: meta.color,
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                                style={{ background: meta.bg, color: meta.color, fontFamily: 'var(--font-mono)' }}
                              >
                                <Icon size={10} /> {meta.label}
                              </span>
                              <span
                                className="text-[9px]"
                                style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                              >
                                prioridad {action.priority}
                              </span>
                            </div>
                            <p
                              className="mb-1 text-sm font-semibold"
                              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                            >
                              {action.title}
                            </p>
                            <p
                              className="text-xs line-clamp-2"
                              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-body)' }}
                            >
                              {action.reasoning}
                            </p>
                          </div>
                          <ArrowRight
                            size={16}
                            className="mt-2 opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ color: meta.color }}
                          />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Meta mensual */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid rgba(198,255,60,0.15)',
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2
                  className="flex items-center gap-2 text-lg font-bold"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                >
                  <Target size={18} style={{ color: 'var(--vc-lime-main)' }} />
                  Meta del mes
                </h2>
                <Link
                  href="/metas"
                  className="flex items-center gap-1 text-[11px] font-semibold hover:underline"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                >
                  Ver detalle <ArrowRight size={11} />
                </Link>
              </div>

              {!data.goal.hasGoal ? (
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px dashed rgba(198,255,60,0.3)',
                  }}
                >
                  <p className="mb-2 text-sm" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-body)' }}>
                    {data.goal.message}
                  </p>
                  <Link
                    href="/metas"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"
                    style={{
                      background: 'var(--vc-lime-main)',
                      color: 'var(--vc-black)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    DEFINIR META <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.15em]"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                      >
                        Progreso
                      </p>
                      <p
                        className="text-3xl font-black"
                        style={{
                          color: data.goal.progressPct >= 100 ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {data.goal.progressPct}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-[10px] uppercase tracking-[0.15em]"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                      >
                        Quedan
                      </p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                      >
                        {data.goal.daysRemaining} días
                      </p>
                    </div>
                  </div>

                  <div
                    className="mb-3 h-2 overflow-hidden rounded-full"
                    style={{ background: 'var(--vc-gray-dark)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, data.goal.progressPct)}%`,
                        background: data.goal.isOnTrack ? 'var(--vc-gradient-primary)' : '#FFB800',
                        boxShadow: '0 0 8px var(--vc-glow-lime)',
                      }}
                    />
                  </div>

                  <p
                    className="text-xs"
                    style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-body)' }}
                  >
                    {data.goal.message}
                  </p>
                </>
              )}
            </div>

            {/* Motivacional */}
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(198,255,60,0.08) 0%, rgba(60,198,255,0.04) 100%)',
                border: '1px solid rgba(198,255,60,0.2)',
              }}
            >
              <Sparkles size={18} className="mx-auto mb-2" style={{ color: 'var(--vc-lime-main)' }} />
              <p
                className="text-sm italic"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-body)' }}
              >
                “{data.motivational}”
              </p>
            </div>

            {/* Cross-links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <CrossLink href="/comando" label="Command Center" sub="War room IA" />
              <CrossLink href="/impacto" label="Impacto IA" sub="ROI en $" />
              <CrossLink href="/historial" label="Historial acciones" sub="Con revert 1-clic" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  sub,
}: {
  icon: typeof Sun
  label: string
  value: string
  delta: number | null
  sub: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198,255,60,0.15)',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <Icon size={14} style={{ color: 'var(--vc-lime-main)' }} />
        <DeltaBadge pct={delta} />
      </div>
      <p
        className="text-[10px] uppercase tracking-[0.15em]"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-xl font-black"
        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-[10px]"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
      >
        {sub}
      </p>
    </div>
  )
}

function CrossLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl p-3 transition-all hover:border-[rgba(198,255,60,0.4)]"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid var(--vc-gray-dark)',
      }}
    >
      <div>
        <p
          className="text-xs font-bold"
          style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
        >
          {label}
        </p>
        <p
          className="text-[10px]"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
        >
          {sub}
        </p>
      </div>
      <ArrowRight size={14} style={{ color: 'var(--vc-lime-main)' }} />
    </Link>
  )
}
