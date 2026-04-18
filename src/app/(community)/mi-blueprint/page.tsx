'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Loader2, Sparkles, TrendingUp, Target, Layers, Activity, ShieldCheck,
  Zap, Clock, ArrowRight, CheckCircle2, AlertTriangle, XCircle, MinusCircle,
  Gauge, Award, Megaphone, Package, ShoppingCart, DollarSign, Rocket,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useBlueprint } from '@/hooks/useFinance'

// ── /mi-blueprint — Diagnóstico 0-100 del dropshipper ───
// Inspirado en ConvertMate (score + 5 acciones semanales) + AI-First pipelines.

type Period = '7d' | '30d' | '90d'
const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
}

const PILLAR_ICONS: Record<string, any> = {
  profitability: TrendingUp,
  ads: Megaphone,
  offer: Package,
  activity: Activity,
  quality: ShieldCheck,
}

const STATUS_COLORS: Record<string, string> = {
  good: 'var(--vc-lime-main)',
  warning: '#FFB800',
  critical: '#FF4757',
  empty: '#4A4A4A',
}

const STATUS_ICONS: Record<string, any> = {
  good: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
  empty: MinusCircle,
}

const CATEGORY_ICONS: Record<string, any> = {
  profit: TrendingUp,
  ads: Megaphone,
  offer: Package,
  activity: ShoppingCart,
  quality: ShieldCheck,
  scale: Rocket,
}

const IMPACT_COLORS: Record<string, string> = {
  high: '#FF4757',
  medium: '#FFB800',
  low: 'var(--vc-lime-main)',
}

const IMPACT_LABELS: Record<string, string> = {
  high: 'Alto impacto',
  medium: 'Impacto medio',
  low: 'Mantenimiento',
}

const EFFORT_LABELS: Record<string, string> = {
  quick: '< 30 min',
  medium: '1-3 hrs',
  deep: 'Día completo',
}

function formatCOPCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

export default function MiBlueprintPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const { data, isLoading, error } = useBlueprint(period)

  const diagnostic = data?.diagnostic
  const actions = data?.actions ?? []

  return (
    <>
      <CommunityTopbar
        title="Mi Blueprint"
        subtitle="Tu diagnóstico 0-100 + 5 acciones esta semana"
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Selector de periodo */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
              style={{
                background: period === p ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                color: period === p ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                border: `1px solid ${period === p ? 'var(--vc-lime-main)' : 'var(--vc-gray-dark)'}`,
                fontFamily: 'var(--font-heading)',
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : error ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(255,71,87,0.25)' }}>
            <AlertTriangle size={32} className="mx-auto mb-2" style={{ color: '#FF4757' }} />
            <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
              No pudimos generar tu Blueprint. Intenta de nuevo en unos segundos.
            </p>
          </div>
        ) : diagnostic ? (
          <>
            {/* Hero: Score 0-100 tipo odómetro */}
            <HeroScore diagnostic={diagnostic} />

            {/* 5 Pilares */}
            <PillarsGrid pillars={diagnostic.pillars} />

            {/* 5 Acciones esta semana */}
            <ActionsSection actions={actions} />

            {/* Comparación comunidad */}
            <CommunityCompareCard diagnostic={diagnostic} />
          </>
        ) : null}
      </div>
    </>
  )
}

function HeroScore({ diagnostic }: { diagnostic: any }) {
  const pct = diagnostic.score / 100
  const circumference = 2 * Math.PI * 72
  const offset = circumference - pct * circumference

  return (
    <div
      className="rounded-2xl p-6 md:p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(198,255,60,0.10) 0%, rgba(60,198,255,0.04) 100%)',
        border: `1px solid ${diagnostic.tierColor}55`,
      }}
    >
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-8">
        {/* Gauge circular */}
        <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r="72" stroke="var(--vc-gray-dark)" strokeWidth="10" fill="none" />
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke={diagnostic.tierColor}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${diagnostic.tierColor}aa)` }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span
              className="text-6xl font-black"
              style={{ color: diagnostic.tierColor, fontFamily: 'var(--font-heading)' }}
            >
              {diagnostic.score}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
              / 100
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
            <Sparkles size={14} style={{ color: 'var(--vc-lime-main)' }} />
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
              Vitalcom Score
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <Award size={22} style={{ color: diagnostic.tierColor }} />
            <h2
              className="text-3xl font-bold md:text-4xl"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              {diagnostic.tier}
            </h2>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            {scoreMessage(diagnostic.score)}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 md:max-w-md">
            <MiniStat label="Ingreso" value={formatCOPCompact(diagnostic.signals.ingresoBruto)} />
            <MiniStat label="Ganancia" value={formatCOPCompact(diagnostic.signals.gananciaNeta)} tone={diagnostic.signals.gananciaNeta >= 0 ? 'good' : 'bad'} />
            <MiniStat label="Órdenes" value={diagnostic.signals.ordersCount.toString()} />
          </div>
        </div>
      </div>
    </div>
  )
}

function scoreMessage(score: number): string {
  if (score >= 85) return 'Rendimiento élite — foco total en escalar sin romper el sistema.'
  if (score >= 70) return 'Negocio saludable y rentable — queda espacio para optimizar y crecer.'
  if (score >= 55) return 'Base sólida — ajusta los pilares más débiles y subirás rápido.'
  if (score >= 40) return 'En construcción — enfócate en los fundamentos rentables.'
  if (score >= 20) return 'Arrancando — las primeras acciones de esta semana marcan la dirección.'
  return 'Onboarding — aún no hay datos suficientes. Empieza por lo básico.'
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div
      className="rounded-lg p-2 text-center md:text-left"
      style={{ background: 'rgba(10,10,10,0.5)', border: '1px solid rgba(198,255,60,0.1)' }}
    >
      <p className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--vc-white-dim)' }}>
        {label}
      </p>
      <p
        className="text-sm font-bold"
        style={{
          color: tone === 'bad' ? '#FF4757' : tone === 'good' ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {value}
      </p>
    </div>
  )
}

function PillarsGrid({ pillars }: { pillars: any[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Gauge size={14} style={{ color: 'var(--vc-lime-main)' }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          5 Pilares del diagnóstico
        </h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {pillars.map((p) => {
          const Icon = PILLAR_ICONS[p.id] ?? Layers
          const StatusIcon = STATUS_ICONS[p.status] ?? MinusCircle
          const color = STATUS_COLORS[p.status]
          const pct = (p.score / p.max) * 100
          return (
            <div
              key={p.id}
              className="rounded-xl p-4"
              style={{
                background: 'var(--vc-black-mid)',
                border: `1px solid ${p.status === 'empty' ? 'rgba(198,255,60,0.1)' : `${color}40`}`,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color }} />
                  <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--vc-white-dim)' }}>
                    {p.label}
                  </span>
                </div>
                <StatusIcon size={14} style={{ color }} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>
                  {p.score}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
                  / {p.max}
                </span>
              </div>
              {/* Barra de progreso */}
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--vc-black-soft)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: color,
                    boxShadow: p.status === 'good' ? `0 0 8px ${color}88` : 'none',
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                {p.note}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActionsSection({ actions }: { actions: any[] }) {
  if (actions.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Target size={14} style={{ color: 'var(--vc-lime-main)' }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          5 acciones esta semana
        </h3>
        <span className="text-[10px]" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
          · generadas por IA
        </span>
      </div>
      <div className="space-y-3">
        {actions.map((a, i) => (
          <ActionCard key={i} action={a} />
        ))}
      </div>
    </div>
  )
}

function ActionCard({ action }: { action: any }) {
  const Icon = CATEGORY_ICONS[action.category] ?? Zap
  const impactColor = IMPACT_COLORS[action.impact]

  return (
    <div
      className="group rounded-xl p-4 transition-all hover:-translate-y-0.5"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198,255,60,0.15)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Número */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          style={{
            background: 'var(--vc-gradient-primary)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {action.order}
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              {action.title}
            </h4>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
              style={{
                background: `${impactColor}22`,
                color: impactColor,
                border: `1px solid ${impactColor}44`,
              }}
            >
              {IMPACT_LABELS[action.impact]}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
              <Clock size={10} /> {EFFORT_LABELS[action.effort] ?? action.effort}
            </span>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
            {action.description}
          </p>

          {action.link && (
            <Link
              href={action.link}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition"
              style={{
                background: 'rgba(198,255,60,0.1)',
                color: 'var(--vc-lime-main)',
                border: '1px solid rgba(198,255,60,0.3)',
              }}
            >
              <Icon size={12} />
              {action.linkLabel ?? 'Ir a la herramienta'}
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function CommunityCompareCard({ diagnostic }: { diagnostic: any }) {
  const { community, signals } = diagnostic
  const relativeLabel =
    community.relativeActivity === 'above' ? 'Por encima del promedio' :
    community.relativeActivity === 'below' ? 'Por debajo del promedio' :
    'En promedio'
  const relativeColor =
    community.relativeActivity === 'above' ? 'var(--vc-lime-main)' :
    community.relativeActivity === 'below' ? '#FFB800' :
    'var(--vc-white-dim)'

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.15)' }}
    >
      <div className="mb-3 flex items-center gap-2">
        <DollarSign size={14} style={{ color: 'var(--vc-lime-main)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          Tú vs comunidad Vitalcom
        </h3>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <CompareStat
          label="Tu ticket promedio"
          value={formatCOPCompact(signals.ticketPromedio)}
          subline={`Comunidad: ${formatCOPCompact(community.avgTicket)}`}
          tone={community.relativeActivity === 'above' ? 'good' : community.relativeActivity === 'below' ? 'warn' : 'neutral'}
          tag={relativeLabel}
          tagColor={relativeColor}
        />
        <CompareStat
          label="Dropshippers activos"
          value={community.totalDropshippers.toString()}
          subline="En la comunidad ahora"
          tone="neutral"
        />
        <CompareStat
          label="Tu ritmo"
          value={`${signals.ordersCount} órdenes`}
          subline={`${signals.productsSold} productos distintos`}
          tone="neutral"
        />
      </div>
    </div>
  )
}

function CompareStat({
  label,
  value,
  subline,
  tone,
  tag,
  tagColor,
}: {
  label: string
  value: string
  subline: string
  tone: 'good' | 'warn' | 'neutral'
  tag?: string
  tagColor?: string
}) {
  const valueColor =
    tone === 'good' ? 'var(--vc-lime-main)' :
    tone === 'warn' ? '#FFB800' :
    'var(--vc-white-soft)'

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--vc-black-soft)' }}>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--vc-white-dim)' }}>
        {label}
      </p>
      <p className="mt-1 text-xl font-bold" style={{ color: valueColor, fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
        {subline}
      </p>
      {tag && (
        <p className="mt-1 text-[10px] font-semibold" style={{ color: tagColor }}>
          {tag}
        </p>
      )}
    </div>
  )
}
