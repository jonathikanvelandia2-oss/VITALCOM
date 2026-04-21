'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Command, Brain, Store, Wand2, AlertTriangle, Package,
  RefreshCw, Loader2, ArrowRight, TrendingUp, TrendingDown,
  DollarSign, Target, Zap, Sparkles, Flame, CheckCircle2,
  BarChart3, ShoppingCart, ShieldAlert,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useCommandCenter,
  useRefreshCommandCenter,
  type UnifiedAction,
  type ActionSource,
} from '@/hooks/useCommandCenter'
import { useCurrentGoal } from '@/hooks/useGoals'

// ── Command Center IA — War Room del dropshipper ─────────
// Feed unificado de acciones priorizadas cross-agentes + KPIs del negocio.
// Un solo botón refresca los 3 agentes. Una sola vista para todo.

const SOURCE_META: Record<
  ActionSource,
  { label: string; icon: typeof Command; color: string; bg: string }
> = {
  MEDIA_BUYER: {
    label: 'MEDIA BUYER',
    icon: Brain,
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.15)',
  },
  STORE_OPTIMIZER: {
    label: 'STORE OPTIMIZER',
    icon: Store,
    color: 'var(--vc-lime-main)',
    bg: 'rgba(198,255,60,0.15)',
  },
  CREATIVE_MAKER: {
    label: 'CREATIVE MAKER',
    icon: Wand2,
    color: '#3CC6FF',
    bg: 'rgba(60,198,255,0.15)',
  },
  FINANCE_ALERT: {
    label: 'FINANZAS',
    icon: AlertTriangle,
    color: '#FF4757',
    bg: 'rgba(255,71,87,0.15)',
  },
}

function fmt(n: number | null | undefined, unit = '$'): string {
  if (n == null) return '—'
  if (unit === '%') return `${n.toFixed(1)}%`
  if (unit === 'x') return `${n.toFixed(2)}x`
  return `${unit}${Math.round(n).toLocaleString('es-CO')}`
}

function priorityMeta(p: number): {
  label: string
  color: string
  bg: string
  tier: 'critical' | 'high' | 'medium' | 'low'
} {
  if (p >= 85)
    return { label: 'CRÍTICO', color: '#FF4757', bg: 'rgba(255,71,87,0.12)', tier: 'critical' }
  if (p >= 60)
    return { label: 'ALTO', color: '#FFB800', bg: 'rgba(255,184,0,0.12)', tier: 'high' }
  if (p >= 40)
    return { label: 'MEDIO', color: '#3CC6FF', bg: 'rgba(60,198,255,0.12)', tier: 'medium' }
  return { label: 'BAJO', color: 'var(--vc-gray-mid)', bg: 'rgba(128,128,128,0.1)', tier: 'low' }
}

export default function CommandCenterPage() {
  const [sourceFilter, setSourceFilter] = useState<ActionSource | null>(null)

  const dataQ = useCommandCenter()
  const refreshMut = useRefreshCommandCenter()
  const goalQ = useCurrentGoal()

  const data = dataQ.data
  const actions = data?.actions ?? []
  const filtered = sourceFilter ? actions.filter((a) => a.source === sourceFilter) : actions

  const critical = filtered.filter((a) => a.priority >= 85)
  const high = filtered.filter((a) => a.priority >= 60 && a.priority < 85)
  const medium = filtered.filter((a) => a.priority >= 40 && a.priority < 60)
  const low = filtered.filter((a) => a.priority < 40)

  async function handleRefresh() {
    const r = await refreshMut.mutateAsync()
    if (r.totalNew === 0) {
      alert('Todos los agentes ya están al día. No hay nuevas acciones ✅')
    } else {
      alert(
        `✨ ${r.totalNew} nueva(s) acción(es)\n• MediaBuyer: ${r.mediaBuyer.created}\n• OptimizadorTienda: ${r.storeOptimizer.created}`,
      )
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunityTopbar
        title="Command Center IA"
        subtitle="Tu war room: todas las acciones IA priorizadas en un solo lugar"
      />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(198,255,60,0.08) 0%, rgba(168,85,247,0.06) 50%, rgba(60,198,255,0.06) 100%)',
          borderBottom: '1px solid rgba(198,255,60,0.15)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[300px]">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: 'var(--vc-gradient-primary)',
                    boxShadow: '0 0 32px var(--vc-glow-lime)',
                  }}
                >
                  <Command size={22} style={{ color: 'var(--vc-black)' }} />
                </div>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: 'var(--vc-lime-main)',
                    color: 'var(--vc-black)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  V19 · WAR ROOM
                </span>
              </div>
              <h1
                className="mb-2 text-4xl font-black"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
              >
                Command Center IA
              </h1>
              <p className="max-w-2xl text-base" style={{ color: 'var(--vc-white-dim)' }}>
                Los 3 agentes IA de Vitalcom trabajan por ti en un solo feed. Prioridad crítica
                arriba, acciones aplicables con 1 clic. Presiona "Analizar todo" y deja que la
                IA encuentre las próximas palancas de crecimiento.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshMut.isPending}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all disabled:opacity-50"
              style={{
                background: 'var(--vc-gradient-primary)',
                color: 'var(--vc-black)',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 0 24px var(--vc-glow-lime)',
                letterSpacing: '0.03em',
              }}
            >
              {refreshMut.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> ANALIZANDO TODO…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> ANALIZAR TODO
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Banner de meta mensual */}
        {goalQ.data?.goal && (
          <Link
            href="/metas"
            className="mb-4 block rounded-xl p-4 transition-all hover:translate-x-0.5"
            style={{
              background:
                goalQ.data.isOnTrack || goalQ.data.progressPct.revenue >= 100
                  ? 'linear-gradient(90deg, rgba(198,255,60,0.12), rgba(198,255,60,0.04))'
                  : 'linear-gradient(90deg, rgba(255,184,0,0.10), rgba(255,184,0,0.03))',
              border: `1px solid ${
                goalQ.data.isOnTrack || goalQ.data.progressPct.revenue >= 100
                  ? 'rgba(198,255,60,0.35)'
                  : 'rgba(255,184,0,0.35)'
              }`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background:
                    goalQ.data.progressPct.revenue >= 100
                      ? 'var(--vc-gradient-primary)'
                      : 'var(--vc-black-soft)',
                }}
              >
                <Target
                  size={15}
                  style={{
                    color:
                      goalQ.data.progressPct.revenue >= 100
                        ? 'var(--vc-black)'
                        : goalQ.data.isOnTrack
                          ? 'var(--vc-lime-main)'
                          : '#FFB800',
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                  >
                    Meta de {goalQ.data.goal.month}/{goalQ.data.goal.year}
                  </span>
                  <span
                    className="text-[11px] font-bold"
                    style={{
                      color:
                        goalQ.data.progressPct.revenue >= 100
                          ? 'var(--vc-lime-main)'
                          : goalQ.data.isOnTrack
                            ? 'var(--vc-lime-main)'
                            : '#FFB800',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {goalQ.data.progressPct.revenue}%
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'var(--vc-gray-dark)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, goalQ.data.progressPct.revenue)}%`,
                      background: 'var(--vc-gradient-primary)',
                    }}
                  />
                </div>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--vc-lime-main)' }} />
            </div>
          </Link>
        )}

        {/* Banner set-goal si no tiene meta */}
        {goalQ.data && !goalQ.data.goal && (
          <Link
            href="/metas"
            className="mb-4 flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:translate-x-0.5"
            style={{
              background:
                'linear-gradient(90deg, rgba(198,255,60,0.08), rgba(60,198,255,0.05))',
              border: '1px dashed rgba(198,255,60,0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <Target size={16} style={{ color: 'var(--vc-lime-main)' }} />
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                >
                  Define tu meta mensual
                </p>
                <p className="text-[12px]" style={{ color: 'var(--vc-white-dim)' }}>
                  Los dropshippers con meta venden 2.3x más. Define la tuya en 30s.
                </p>
              </div>
            </div>
            <ArrowRight size={14} style={{ color: 'var(--vc-lime-main)' }} />
          </Link>
        )}

        {/* Banner cross-link a Impacto IA */}
        <Link
          href="/impacto"
          className="mb-6 flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:translate-x-0.5"
          style={{
            background:
              'linear-gradient(90deg, rgba(198,255,60,0.08), rgba(168,85,247,0.08))',
            border: '1px solid rgba(198,255,60,0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--vc-gradient-primary)' }}
            >
              <TrendingUp size={16} style={{ color: 'var(--vc-black)' }} />
            </div>
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
              >
                Impacto IA (V21)
              </p>
              <p
                className="text-[13px]"
                style={{ color: 'var(--vc-white-soft)' }}
              >
                Mira cuánto dinero te han ahorrado y generado tus acciones aplicadas
              </p>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--vc-lime-main)' }} />
        </Link>

        {/* KPIs de negocio */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <KpiCard
            label="Facturación 30d"
            value={fmt(data?.kpis.revenue30d)}
            icon={DollarSign}
            color="var(--vc-lime-main)"
          />
          <KpiCard
            label="Utilidad neta"
            value={fmt(data?.kpis.netProfit30d)}
            icon={data && data.kpis.netProfit30d >= 0 ? TrendingUp : TrendingDown}
            color={
              data && data.kpis.netProfit30d >= 0
                ? 'var(--vc-lime-main)'
                : '#FF4757'
            }
          />
          <KpiCard
            label="Margen neto"
            value={fmt(data?.kpis.netMarginPct, '%')}
            icon={BarChart3}
            color={
              (data?.kpis.netMarginPct ?? 0) > 15
                ? 'var(--vc-lime-main)'
                : (data?.kpis.netMarginPct ?? 0) > 0
                  ? '#FFB800'
                  : '#FF4757'
            }
          />
          <KpiCard
            label="ROAS"
            value={data?.kpis.roas ? fmt(data.kpis.roas, 'x') : '—'}
            icon={Target}
            color={
              (data?.kpis.roas ?? 0) > 3
                ? 'var(--vc-lime-main)'
                : (data?.kpis.roas ?? 0) > 1.5
                  ? '#FFB800'
                  : '#FF4757'
            }
          />
          <KpiCard
            label="Pedidos 30d"
            value={String(data?.kpis.orders30d ?? 0)}
            icon={ShoppingCart}
            color="#3CC6FF"
          />
          <KpiCard
            label="Pendientes"
            value={String(data?.kpis.pendingOrders ?? 0)}
            icon={Package}
            color={
              (data?.kpis.pendingOrders ?? 0) >= 5 ? '#FF4757' : 'var(--vc-gray-mid)'
            }
          />
        </div>

        {/* Resumen por agente */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(Object.entries(SOURCE_META) as [ActionSource, typeof SOURCE_META.MEDIA_BUYER][]).map(
            ([src, meta]) => {
              const count = data?.bySource[src] ?? 0
              const active = sourceFilter === src
              const Icon = meta.icon
              return (
                <button
                  key={src}
                  onClick={() => setSourceFilter(active ? null : src)}
                  className="rounded-xl p-4 text-left transition-all"
                  style={{
                    background: active ? meta.bg : 'var(--vc-black-mid)',
                    border: `1px solid ${active ? meta.color : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: active ? `0 0 20px ${meta.color}40` : 'none',
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Icon size={18} style={{ color: meta.color }} />
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: meta.bg, color: meta.color, fontFamily: 'var(--font-mono)' }}
                    >
                      {count}
                    </span>
                  </div>
                  <p
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                  >
                    {meta.label}
                  </p>
                  <p
                    className="mt-0.5 text-sm font-bold"
                    style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                  >
                    {count === 0 ? 'Sin acciones' : `${count} acción${count === 1 ? '' : 'es'}`}
                  </p>
                </button>
              )
            },
          )}
        </div>

        {/* Feed de acciones */}
        {dataQ.isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
            <p className="mt-4 text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
              Cargando command center…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onRefresh={handleRefresh} loading={refreshMut.isPending} />
        ) : (
          <div className="space-y-6">
            {critical.length > 0 && (
              <Section title="CRÍTICO" color="#FF4757" icon={Flame} count={critical.length}>
                {critical.map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </Section>
            )}
            {high.length > 0 && (
              <Section title="ALTO" color="#FFB800" icon={Zap} count={high.length}>
                {high.map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </Section>
            )}
            {medium.length > 0 && (
              <Section title="MEDIO" color="#3CC6FF" icon={Target} count={medium.length}>
                {medium.map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </Section>
            )}
            {low.length > 0 && (
              <Section
                title="BAJO"
                color="var(--vc-gray-mid)"
                icon={CheckCircle2}
                count={low.length}
              >
                {low.map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: typeof DollarSign
  color: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.12)' }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </span>
      </div>
      <div
        className="text-xl font-black"
        style={{ color, fontFamily: 'var(--font-heading)', letterSpacing: '0.01em' }}
      >
        {value}
      </div>
    </div>
  )
}

function Section({
  title,
  color,
  icon: Icon,
  count,
  children,
}: {
  title: string
  color: string
  icon: typeof Flame
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        <h2
          className="text-xs font-black uppercase tracking-widest"
          style={{ color, fontFamily: 'var(--font-mono)' }}
        >
          {title}
        </h2>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: `${color}20`, color, fontFamily: 'var(--font-mono)' }}
        >
          {count}
        </span>
        <div
          className="ml-2 h-px flex-1"
          style={{ background: `linear-gradient(90deg, ${color}40 0%, transparent 100%)` }}
        />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ActionCard({ action }: { action: UnifiedAction }) {
  const src = SOURCE_META[action.source]
  const SrcIcon = src.icon
  const prio = priorityMeta(action.priority)

  return (
    <Link
      href={action.link}
      className="block rounded-xl p-4 transition-all hover:translate-x-0.5"
      style={{
        background: 'var(--vc-black-mid)',
        border: `1px solid ${prio.color}30`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail (imagen producto o icono fuente) */}
        {action.productImage ? (
          <div
            className="h-14 w-14 shrink-0 overflow-hidden rounded-lg"
            style={{ background: 'var(--vc-black)', border: `1px solid ${src.color}30` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={action.productImage}
              alt={action.productName ?? ''}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg"
            style={{ background: src.bg, border: `1px solid ${src.color}40` }}
          >
            <SrcIcon size={22} style={{ color: src.color }} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Header chips */}
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: src.bg, color: src.color, fontFamily: 'var(--font-mono)' }}
            >
              <SrcIcon size={9} /> {src.label}
            </span>
            <span
              className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: prio.bg, color: prio.color, fontFamily: 'var(--font-mono)' }}
            >
              {prio.label}
            </span>
            {action.confidence >= 0.8 && (
              <span
                className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                style={{
                  background: 'rgba(198,255,60,0.12)',
                  color: 'var(--vc-lime-main)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <ShieldAlert size={9} /> {Math.round(action.confidence * 100)}% conf
              </span>
            )}
            {action.productName && (
              <span
                className="truncate text-[10px]"
                style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
              >
                · {action.productName}
              </span>
            )}
          </div>

          <h3
            className="mb-1 text-sm font-bold leading-tight"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            {action.title}
          </h3>
          <p
            className="line-clamp-2 text-[12px] leading-relaxed"
            style={{ color: 'var(--vc-white-dim)' }}
          >
            {action.reasoning}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span
            className="text-[11px] font-bold"
            style={{ color: prio.color, fontFamily: 'var(--font-heading)' }}
          >
            {action.actionLabel}
          </span>
          <ArrowRight size={14} style={{ color: prio.color }} />
        </div>
      </div>
    </Link>
  )
}

function EmptyState({
  onRefresh,
  loading,
}: {
  onRefresh: () => void
  loading: boolean
}) {
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
        <Command size={28} style={{ color: 'var(--vc-black)' }} />
      </div>
      <h3
        className="mb-2 text-xl font-bold"
        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
      >
        Tu Command Center está limpio
      </h3>
      <p className="mb-6 max-w-md text-sm" style={{ color: 'var(--vc-white-dim)' }}>
        No hay acciones pendientes en ninguno de los 3 agentes. Presiona "Analizar todo"
        y la IA revisa campañas, tienda y finanzas para detectar próximas palancas.
      </p>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:opacity-50"
        style={{
          background: 'var(--vc-gradient-primary)',
          color: 'var(--vc-black)',
          fontFamily: 'var(--font-heading)',
          boxShadow: '0 0 24px var(--vc-glow-lime)',
          letterSpacing: '0.03em',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> ANALIZANDO…
          </>
        ) : (
          <>
            <Sparkles size={16} /> ANALIZAR TODO
          </>
        )}
      </button>
    </div>
  )
}
