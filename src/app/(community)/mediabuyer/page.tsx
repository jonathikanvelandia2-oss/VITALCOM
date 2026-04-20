'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Brain, RefreshCw, Loader2, CheckCircle2, XCircle, ArrowRight,
  TrendingUp, TrendingDown, Pause, Play, Sparkles, Target,
  AlertTriangle, Zap, DollarSign, Eye, Clock,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useMediaBuyerRecs,
  useGenerateMediaBuyerRecs,
  useApplyMediaBuyerRec,
  useDismissMediaBuyerRec,
  type CampaignRecommendation,
  type RecommendationType,
} from '@/hooks/useMediaBuyer'

// ── MediaBuyer IA ────────────────────────────────────────
// Analiza campañas activas y recomienda acciones concretas.
// Cada recomendación se puede aplicar con un clic o descartar.

const TYPE_META: Record<
  RecommendationType,
  { label: string; icon: typeof Brain; color: string; bg: string }
> = {
  PAUSE_CAMPAIGN:   { label: 'PAUSAR',        icon: Pause,           color: '#FF4757', bg: 'rgba(255,71,87,0.12)' },
  SCALE_BUDGET:     { label: 'ESCALAR',       icon: TrendingUp,      color: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.12)' },
  REDUCE_BUDGET:    { label: 'REDUCIR',       icon: TrendingDown,    color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
  TEST_CREATIVE:    { label: 'NUEVO CREATIVO', icon: Sparkles,       color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  TEST_AUDIENCE:    { label: 'NUEVA AUDIENCIA', icon: Target,        color: '#3CC6FF', bg: 'rgba(60,198,255,0.12)' },
  OPTIMIZE_BID:     { label: 'OPTIMIZAR',     icon: Zap,             color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
  RESTART_CAMPAIGN: { label: 'REACTIVAR',     icon: Play,            color: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.12)' },
  ADD_TRACKING:    { label: 'MÁS DATOS',     icon: Eye,             color: 'var(--vc-gray-mid)', bg: 'rgba(128,128,128,0.12)' },
}

function formatMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

function priorityLabel(p: number): { label: string; color: string } {
  if (p >= 85) return { label: 'Crítico', color: '#FF4757' }
  if (p >= 60) return { label: 'Alto', color: '#FFB800' }
  if (p >= 40) return { label: 'Medio', color: 'var(--vc-info)' }
  return { label: 'Bajo', color: 'var(--vc-gray-mid)' }
}

export default function MediaBuyerPage() {
  const [showHistory, setShowHistory] = useState(false)

  const recsQ = useMediaBuyerRecs(showHistory)
  const generateMut = useGenerateMediaBuyerRecs()

  const items = recsQ.data?.items ?? []
  const counts = recsQ.data?.counts ?? {}

  const pending = items.filter((r) => r.status === 'PENDING')
  const otros = items.filter((r) => r.status !== 'PENDING')

  const kpis = {
    total: pending.length,
    critico: pending.filter((r) => r.priority >= 85).length,
    alto: pending.filter((r) => r.priority >= 60 && r.priority < 85).length,
    aplicadas: counts.APPLIED ?? 0,
  }

  async function handleGenerate() {
    const r = await generateMut.mutateAsync({ days: 7 })
    if (r.created === 0 && r.total === 0) {
      alert('MediaBuyer necesita al menos 3 días de gasto publicitario registrado. Registra gastos en Publicidad primero.')
    } else if (r.created === 0) {
      alert(`${r.deduped} recomendaciones ya existían. No hay nuevas por ahora — buen signo ✅`)
    } else {
      alert(`✨ ${r.created} nueva(s) recomendación(es) creadas`)
    }
  }

  return (
    <>
      <CommunityTopbar title="MediaBuyer IA" subtitle="Tu media buyer con inteligencia artificial" />
      <div className="flex-1 space-y-6 p-4 md:p-6">

        {/* Header hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(198,255,60,0.08), rgba(168,85,247,0.06))',
            border: '1px solid rgba(198,255,60,0.2)',
          }}
        >
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
            style={{ background: 'radial-gradient(var(--vc-lime-main), transparent 70%)' }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(198,255,60,0.15)', border: '1px solid rgba(198,255,60,0.35)' }}
                >
                  <Brain size={18} color="var(--vc-lime-main)" />
                </div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Tu MediaBuyer con IA
                </h1>
              </div>
              <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
                Analiza tus campañas 24/7 y te dice <strong>qué pausar, qué escalar y dónde invertir</strong> el próximo peso. Basado en ROAS, CTR, CPC y benchmarks LATAM de dropshipping.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generateMut.isPending}
              className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold uppercase disabled:opacity-50"
              style={{
                background: 'var(--vc-lime-main)',
                color: 'var(--vc-black)',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 0 24px var(--vc-glow-lime)',
              }}
            >
              {generateMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Analizar campañas
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Pendientes" value={kpis.total} icon={Clock} />
          <KpiCard label="Críticas" value={kpis.critico} icon={AlertTriangle} danger />
          <KpiCard label="Alta prioridad" value={kpis.alto} icon={Zap} warning />
          <KpiCard label="Aplicadas" value={kpis.aplicadas} icon={CheckCircle2} success />
        </div>

        {/* Toggle historial */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[11px]"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-heading)' }}
          >
            {showHistory ? '← Solo pendientes' : 'Ver historial completo →'}
          </button>
        </div>

        {/* Recomendaciones */}
        {recsQ.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin" size={24} color="var(--vc-lime-main)" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState onGenerate={handleGenerate} generating={generateMut.isPending} />
        ) : (
          <div className="space-y-3">
            {pending.length > 0 && (
              <>
                <SectionTitle title="Pendientes" count={pending.length} />
                {pending.map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} />
                ))}
              </>
            )}

            {showHistory && otros.length > 0 && (
              <>
                <SectionTitle title="Historial" count={otros.length} />
                {otros.map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} isHistory />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <h2 className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        {title}
      </h2>
      <span className="text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>· {count}</span>
    </div>
  )
}

function KpiCard({
  label, value, icon: Icon, danger, warning, success,
}: {
  label: string
  value: number
  icon: typeof Brain
  danger?: boolean
  warning?: boolean
  success?: boolean
}) {
  const color = danger ? '#FF4757' : warning ? '#FFB800' : success ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)'
  const border = danger
    ? '1px solid rgba(255,71,87,0.3)'
    : warning
    ? '1px solid rgba(255,184,0,0.3)'
    : success
    ? '1px solid rgba(198,255,60,0.3)'
    : '1px solid var(--vc-gray-dark)'

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--vc-black-mid)', border }}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} color={color} />
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
    </div>
  )
}

function RecommendationCard({ rec, isHistory }: { rec: CampaignRecommendation; isHistory?: boolean }) {
  const meta = TYPE_META[rec.type]
  const Icon = meta.icon
  const prio = priorityLabel(rec.priority)

  const applyMut = useApplyMediaBuyerRec()
  const dismissMut = useDismissMediaBuyerRec()

  const isLoading = applyMut.isPending || dismissMut.isPending
  const isDone = rec.status !== 'PENDING'

  const statusBadge =
    rec.status === 'APPLIED' ? { label: '✓ Aplicada', color: 'var(--vc-lime-main)' } :
    rec.status === 'DISMISSED' ? { label: 'Descartada', color: 'var(--vc-gray-mid)' } :
    rec.status === 'EXPIRED' ? { label: 'Expirada', color: 'var(--vc-gray-mid)' } : null

  return (
    <div
      className="relative rounded-xl p-5"
      style={{
        background: 'var(--vc-black-mid)',
        border: isDone ? '1px solid var(--vc-gray-dark)' : `1px solid ${meta.color}40`,
        opacity: isDone ? 0.6 : 1,
      }}
    >
      <div className="flex flex-wrap items-start gap-4">
        {/* Icono tipo */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
          style={{ background: meta.bg, border: `1px solid ${meta.color}40` }}
        >
          <Icon size={22} color={meta.color} />
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[9px] font-bold uppercase"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}60` }}
            >
              {meta.label}
            </span>
            {!isHistory && (
              <span
                className="rounded px-2 py-0.5 text-[9px] font-bold uppercase"
                style={{ background: `${prio.color}20`, color: prio.color }}
              >
                {prio.label}
              </span>
            )}
            {rec.account && (
              <span className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
                · {rec.account.platform}
              </span>
            )}
            {rec.confidence != null && (
              <span className="ml-auto text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                Confianza {Math.round(rec.confidence * 100)}%
              </span>
            )}
          </div>

          <h3
            className="mb-1.5 text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            {rec.title}
          </h3>
          <p className="mb-3 text-[12px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
            {rec.reasoning}
          </p>

          {/* Métricas snapshot */}
          {(rec.roas != null || rec.spend != null) && (
            <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {rec.roas != null && (
                <MetricChip label="ROAS" value={`${rec.roas.toFixed(2)}x`} />
              )}
              {rec.spend != null && (
                <MetricChip label="Gasto" value={formatMoney(rec.spend)} />
              )}
              {rec.revenue != null && (
                <MetricChip label="Ingresos" value={formatMoney(rec.revenue)} />
              )}
              {rec.clicks != null && rec.clicks > 0 && (
                <MetricChip label="Clicks" value={rec.clicks.toLocaleString('es-CO')} />
              )}
            </div>
          )}

          {/* Acciones */}
          {!isDone && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyMut.mutate(rec.id)}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold uppercase disabled:opacity-50"
                style={{
                  background: meta.color,
                  color: meta.color === 'var(--vc-lime-main)' ? 'var(--vc-black)' : 'white',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {applyMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {rec.actionLabel}
              </button>

              {rec.type === 'TEST_CREATIVE' && rec.campaignId && (
                <Link
                  href="/creativo"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-dim)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <Sparkles size={12} /> Generar variantes IA
                </Link>
              )}

              {rec.type === 'ADD_TRACKING' && (
                <Link
                  href="/publicidad"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-dim)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <ArrowRight size={12} /> Ir a Publicidad
                </Link>
              )}

              <button
                onClick={() => dismissMut.mutate(rec.id)}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase disabled:opacity-50"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--vc-gray-dark)',
                  color: 'var(--vc-gray-mid)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <XCircle size={12} /> Descartar
              </button>
            </div>
          )}

          {statusBadge && (
            <p className="mt-2 text-[11px] font-bold uppercase" style={{ color: statusBadge.color, fontFamily: 'var(--font-heading)' }}>
              {statusBadge.label}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
    >
      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </p>
      <p className="text-xs font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
    </div>
  )
}

function EmptyState({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{ background: 'var(--vc-black-mid)', border: '1px dashed rgba(198,255,60,0.25)' }}
    >
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'rgba(198,255,60,0.1)' }}
      >
        <Brain size={32} color="var(--vc-lime-main)" />
      </div>
      <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
        Sin recomendaciones todavía
      </h3>
      <p className="mx-auto mb-6 max-w-md text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
        Haz clic en <strong>Analizar</strong> y MediaBuyer escanea tus campañas activas. Necesita al menos 3 días de gasto registrado en <Link href="/publicidad" style={{ color: 'var(--vc-lime-main)' }}>Publicidad</Link> para dar recomendaciones con confianza.
      </p>
      <button
        onClick={onGenerate}
        disabled={generating}
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold uppercase disabled:opacity-50"
        style={{
          background: 'var(--vc-lime-main)',
          color: 'var(--vc-black)',
          fontFamily: 'var(--font-heading)',
          boxShadow: '0 0 20px var(--vc-glow-lime)',
        }}
      >
        {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Analizar ahora
      </button>
    </div>
  )
}
