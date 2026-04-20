'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Store, RefreshCw, Loader2, CheckCircle2, XCircle, ArrowRight,
  TrendingUp, Sparkles, AlertTriangle, Package, Tag, FileText,
  Layers, Zap, BarChart3, DollarSign, Clock, Trash2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useStoreOptimizations,
  useGenerateOptimizations,
  useApplyOptimization,
  useDismissOptimization,
  type StoreOptimization,
  type OptimizationType,
} from '@/hooks/useStoreOptimizer'

// ── OptimizadorTienda IA ─────────────────────────────────
// Analiza catálogo + ventas + tienda Shopify + P&G y recomienda
// acciones concretas: destacar, ajustar precio, mejorar copy,
// cross-sell, restock, remover underperformers.

const TYPE_META: Record<
  OptimizationType,
  { label: string; icon: typeof Store; color: string; bg: string; desc: string }
> = {
  HIGHLIGHT_PRODUCT: {
    label: 'DESTACAR', icon: TrendingUp, color: 'var(--vc-lime-main)',
    bg: 'rgba(198,255,60,0.12)', desc: 'Producto ganador al home',
  },
  PRICING_ADJUSTMENT: {
    label: 'AJUSTE PRECIO', icon: Tag, color: '#3CC6FF',
    bg: 'rgba(60,198,255,0.12)', desc: 'Optimizar precio de venta',
  },
  LANDING_COPY: {
    label: 'COPY IA', icon: FileText, color: '#A855F7',
    bg: 'rgba(168,85,247,0.12)', desc: 'Mejorar landing',
  },
  CROSS_SELL: {
    label: 'CROSS-SELL', icon: Layers, color: '#FFB800',
    bg: 'rgba(255,184,0,0.12)', desc: 'Bundle de productos',
  },
  PRODUCT_MIX: {
    label: 'MIX', icon: Package, color: 'var(--vc-lime-main)',
    bg: 'rgba(198,255,60,0.12)', desc: 'Añadir producto al catálogo',
  },
  MARGIN_IMPROVEMENT: {
    label: 'MARGEN', icon: DollarSign, color: '#FFB800',
    bg: 'rgba(255,184,0,0.12)', desc: 'Subir margen',
  },
  RESTOCK_URGENT: {
    label: 'RESTOCK', icon: AlertTriangle, color: '#FF4757',
    bg: 'rgba(255,71,87,0.12)', desc: 'Pedir reposición urgente',
  },
  REMOVE_UNDERPERFORMER: {
    label: 'REMOVER', icon: Trash2, color: 'var(--vc-gray-mid)',
    bg: 'rgba(128,128,128,0.12)', desc: 'Producto sin ventas',
  },
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

export default function OptimizadorPage() {
  const [showHistory, setShowHistory] = useState(false)
  const [typeFilter, setTypeFilter] = useState<OptimizationType | null>(null)

  const recsQ = useStoreOptimizations({
    type: typeFilter ?? undefined,
    history: showHistory,
  })
  const generateMut = useGenerateOptimizations()

  const items = recsQ.data?.items ?? []
  const counts = recsQ.data?.counts ?? {}
  const byType = recsQ.data?.byType ?? {}

  const pending = items.filter((r) => r.status === 'PENDING')
  const otros = items.filter((r) => r.status !== 'PENDING')

  const kpis = {
    total: pending.length,
    critico: pending.filter((r) => r.priority >= 85).length,
    alto: pending.filter((r) => r.priority >= 60 && r.priority < 85).length,
    aplicadas: counts.APPLIED ?? 0,
  }

  async function handleGenerate() {
    const r = await generateMut.mutateAsync()
    if (r.created === 0 && r.total === 0) {
      alert('Sin datos suficientes. Sincroniza tu Shopify o registra algunas ventas en Pedidos primero.')
    } else if (r.created === 0) {
      alert(`${r.deduped} recomendaciones ya existían. No hay nuevas por ahora — tu tienda está optimizada ✅`)
    } else {
      alert(`✨ ${r.created} nueva(s) recomendación(es) para optimizar tu tienda`)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunityTopbar
        title="OptimizadorTienda IA"
        subtitle="Consultor Shopify 24/7: qué destacar, precios, cross-sell, landing copy"
      />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(198,255,60,0.08) 0%, rgba(60,198,255,0.06) 100%)',
          borderBottom: '1px solid rgba(198,255,60,0.15)',
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
                  <Store size={24} style={{ color: 'var(--vc-black)' }} />
                </div>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: 'var(--vc-lime-main)',
                    color: 'var(--vc-black)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  V18 · NEW
                </span>
              </div>
              <h1
                className="mb-2 text-4xl font-black"
                style={{
                  color: 'var(--vc-white-soft)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                OptimizadorTienda IA
              </h1>
              <p className="text-base" style={{ color: 'var(--vc-white-dim)' }}>
                Tu consultor Shopify 24/7. Analiza tu catálogo, ventas y márgenes para decirte
                qué destacar, qué precio poner, qué bundles armar y qué remover. Datos reales
                del ecosistema Vitalcom, ejecutable en 1 clic.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generateMut.isPending}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all disabled:opacity-50"
              style={{
                background: 'var(--vc-gradient-primary)',
                color: 'var(--vc-black)',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 0 24px var(--vc-glow-lime)',
                letterSpacing: '0.03em',
              }}
            >
              {generateMut.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> ANALIZANDO…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> ANALIZAR TIENDA
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Recomendaciones', value: kpis.total, icon: Sparkles, color: 'var(--vc-lime-main)' },
            { label: 'Críticas', value: kpis.critico, icon: AlertTriangle, color: '#FF4757' },
            { label: 'Prioridad alta', value: kpis.alto, icon: TrendingUp, color: '#FFB800' },
            { label: 'Aplicadas total', value: kpis.aplicadas, icon: CheckCircle2, color: '#3CC6FF' },
          ].map((k) => {
            const Icon = k.icon
            return (
              <div
                key={k.label}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--vc-black-mid)',
                  border: '1px solid rgba(198,255,60,0.15)',
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={14} style={{ color: k.color }} />
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                  >
                    {k.label}
                  </span>
                </div>
                <div
                  className="text-3xl font-black"
                  style={{ color: k.color, fontFamily: 'var(--font-heading)' }}
                >
                  {k.value}
                </div>
              </div>
            )
          })}
        </div>

        {/* Filtros por tipo */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTypeFilter(null)}
            className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
            style={{
              background: !typeFilter ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
              color: !typeFilter ? 'var(--vc-black)' : 'var(--vc-white-dim)',
              border: '1px solid rgba(198,255,60,0.2)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            TODAS ({kpis.total})
          </button>
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const count = byType[type] ?? 0
            if (count === 0 && typeFilter !== type) return null
            const Icon = meta.icon
            const active = typeFilter === type
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(active ? null : (type as OptimizationType))}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
                style={{
                  background: active ? meta.color : meta.bg,
                  color: active ? 'var(--vc-black)' : meta.color,
                  border: `1px solid ${active ? meta.color : 'transparent'}`,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <Icon size={12} /> {meta.label} {count > 0 && `· ${count}`}
              </button>
            )
          })}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
              style={{
                background: showHistory ? 'var(--vc-black-soft)' : 'transparent',
                color: 'var(--vc-white-dim)',
                border: '1px solid var(--vc-gray-dark)',
              }}
            >
              <Clock size={12} /> {showHistory ? 'Ocultar histórico' : 'Ver histórico'}
            </button>
            <button
              onClick={() => recsQ.refetch()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
              style={{
                background: 'transparent',
                color: 'var(--vc-lime-main)',
                border: '1px solid rgba(198,255,60,0.3)',
              }}
            >
              <RefreshCw size={12} /> Refrescar
            </button>
          </div>
        </div>

        {/* Lista de recomendaciones */}
        {recsQ.isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
            <p className="mt-4 text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
              Cargando recomendaciones…
            </p>
          </div>
        ) : pending.length === 0 && otros.length === 0 ? (
          <EmptyState onGenerate={handleGenerate} loading={generateMut.isPending} />
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <OptimizationCard key={r.id} rec={r} />
            ))}

            {showHistory && otros.length > 0 && (
              <>
                <div
                  className="mt-8 mb-2 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                >
                  · Histórico ·
                </div>
                {otros.map((r) => (
                  <OptimizationCard key={r.id} rec={r} disabled />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function OptimizationCard({ rec, disabled }: { rec: StoreOptimization; disabled?: boolean }) {
  const meta = TYPE_META[rec.type]
  const Icon = meta.icon
  const prio = priorityLabel(rec.priority)
  const applyMut = useApplyOptimization()
  const dismissMut = useDismissOptimization()

  const isApplied = rec.status === 'APPLIED'
  const isDismissed = rec.status === 'DISMISSED'
  const isExpired = rec.status === 'EXPIRED'

  async function handleApply() {
    // Redirects según tipo (acciones que viven en otras páginas)
    if (rec.type === 'LANDING_COPY' && rec.productId) {
      window.location.href = `/creativo?productId=${rec.productId}`
      return
    }
    if (rec.type === 'PRODUCT_MIX' && !rec.productId) {
      window.location.href = '/herramientas/catalogo'
      return
    }
    if (rec.type === 'PRODUCT_MIX' && rec.productId) {
      window.location.href = `/herramientas/catalogo?highlight=${rec.productId}`
      return
    }
    await applyMut.mutateAsync(rec.id)
  }

  return (
    <div
      className="rounded-xl p-5 transition-all"
      style={{
        background: disabled ? 'rgba(255,255,255,0.02)' : 'var(--vc-black-mid)',
        border: `1px solid ${disabled ? 'var(--vc-gray-dark)' : 'rgba(198,255,60,0.15)'}`,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icono tipo */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
          style={{ background: meta.bg, border: `1px solid ${meta.color}40` }}
        >
          <Icon size={20} style={{ color: meta.color }} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: meta.bg, color: meta.color, fontFamily: 'var(--font-mono)' }}
            >
              {meta.label}
            </span>
            <span
              className="rounded-md px-2 py-0.5 text-[9px] font-bold"
              style={{
                background: `${prio.color}20`,
                color: prio.color,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {prio.label}
            </span>
            {rec.product && (
              <Link
                href={`/herramientas/catalogo?productId=${rec.product.id}`}
                className="text-[10px] underline-offset-2 hover:underline"
                style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
              >
                SKU {rec.product.sku}
              </Link>
            )}
            {isApplied && (
              <span
                className="flex items-center gap-1 text-[10px] font-bold"
                style={{ color: 'var(--vc-lime-main)' }}
              >
                <CheckCircle2 size={12} /> APLICADA
              </span>
            )}
            {isDismissed && (
              <span className="text-[10px] font-bold" style={{ color: 'var(--vc-gray-mid)' }}>
                DESCARTADA
              </span>
            )}
            {isExpired && (
              <span className="text-[10px] font-bold" style={{ color: 'var(--vc-gray-mid)' }}>
                EXPIRADA
              </span>
            )}
          </div>

          {/* Título */}
          <h3
            className="mb-2 text-base font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            {rec.title}
          </h3>

          {/* Reasoning */}
          <p className="mb-3 text-[13px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
            {rec.reasoning}
          </p>

          {/* Copy sugerido si aplica */}
          {rec.suggestedText && (
            <div
              className="mb-3 rounded-lg p-3 text-[12px] italic"
              style={{
                background: 'rgba(168,85,247,0.08)',
                border: '1px dashed rgba(168,85,247,0.3)',
                color: 'var(--vc-white-soft)',
              }}
            >
              💡 <span className="font-semibold">Copy sugerido:</span> "{rec.suggestedText}"
            </div>
          )}

          {/* Métricas */}
          <div className="mb-3 flex flex-wrap gap-4 text-[11px]">
            {rec.salesLast30 != null && (
              <Metric label="Ventas 30d" value={`${rec.salesLast30}u`} icon={BarChart3} />
            )}
            {rec.revenueLast30 != null && rec.revenueLast30 > 0 && (
              <Metric label="Revenue" value={formatMoney(rec.revenueLast30)} icon={DollarSign} />
            )}
            {rec.marginPct != null && (
              <Metric
                label="Margen"
                value={`${rec.marginPct.toFixed(0)}%`}
                icon={TrendingUp}
                color={rec.marginPct < 25 ? '#FF4757' : rec.marginPct > 45 ? 'var(--vc-lime-main)' : undefined}
              />
            )}
            {rec.stockLevel != null && rec.stockLevel > 0 && (
              <Metric
                label="Stock"
                value={`${rec.stockLevel}u`}
                icon={Package}
                color={rec.stockLevel < 20 ? '#FF4757' : undefined}
              />
            )}
            {rec.suggestedValue != null && (
              <Metric
                label="Sugerido"
                value={
                  rec.type === 'PRICING_ADJUSTMENT' || rec.type === 'MARGIN_IMPROVEMENT'
                    ? formatMoney(rec.suggestedValue)
                    : `${rec.suggestedValue}u`
                }
                icon={Zap}
                color="var(--vc-lime-main)"
              />
            )}
            {rec.confidence != null && (
              <Metric
                label="Confianza"
                value={`${Math.round(rec.confidence * 100)}%`}
                icon={Sparkles}
              />
            )}
          </div>

          {/* Acciones */}
          {!disabled && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleApply}
                disabled={applyMut.isPending}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-bold transition-all disabled:opacity-50"
                style={{
                  background: 'var(--vc-gradient-primary)',
                  color: 'var(--vc-black)',
                  fontFamily: 'var(--font-heading)',
                  boxShadow: '0 0 16px var(--vc-glow-lime)',
                  letterSpacing: '0.03em',
                }}
              >
                {applyMut.isPending && applyMut.variables === rec.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                {rec.actionLabel.toUpperCase()}
                <ArrowRight size={12} />
              </button>
              <button
                onClick={() => dismissMut.mutate(rec.id)}
                disabled={dismissMut.isPending}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-all disabled:opacity-50"
                style={{
                  background: 'transparent',
                  color: 'var(--vc-gray-mid)',
                  border: '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <XCircle size={12} /> Descartar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: typeof BarChart3
  color?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} style={{ color: color ?? 'var(--vc-gray-mid)' }} />
      <span style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        {label}:
      </span>
      <span
        style={{
          color: color ?? 'var(--vc-white-soft)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function EmptyState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
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
        <Store size={28} style={{ color: 'var(--vc-black)' }} />
      </div>
      <h3
        className="mb-2 text-xl font-bold"
        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
      >
        Aún no hay recomendaciones
      </h3>
      <p className="mb-6 max-w-md text-sm" style={{ color: 'var(--vc-white-dim)' }}>
        Presiona el botón para que IA analice tu catálogo, ventas, márgenes y tienda
        Shopify. En segundos te damos un plan accionable para subir ventas y margen.
      </p>
      <button
        onClick={onGenerate}
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
            <Sparkles size={16} /> GENERAR RECOMENDACIONES
          </>
        )}
      </button>
    </div>
  )
}
