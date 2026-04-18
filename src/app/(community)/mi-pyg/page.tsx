'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent, Package,
  Plus, Loader2, ArrowUpRight, ArrowDownRight, Sparkles, Calendar,
  Megaphone, Truck, Box, Receipt, Settings, Trash2, X, Info,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { usePnL, useFinanceEntries, useCreateEntry, useDeleteEntry, useMentorInsights } from '@/hooks/useFinance'

// ── /mi-pyg — Estado de resultados del dropshipper ──────
// Inspirado en Meta Business: KPIs grandes, breakdown, evolución, insights IA

type Period = '7d' | '30d' | '90d' | 'month' | 'year'
const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  month: 'Este mes',
  year: 'Este año',
}

const CATEGORY_META: Record<string, { icon: any; color: string; label: string }> = {
  VENTA: { icon: ShoppingCart, color: '#C6FF3C', label: 'Ventas' },
  COSTO_PRODUCTO: { icon: Package, color: '#FFB800', label: 'Costo producto' },
  ENVIO: { icon: Truck, color: '#FFB800', label: 'Envío' },
  PUBLICIDAD: { icon: Megaphone, color: '#FF4757', label: 'Publicidad' },
  COMISION_PLATAFORMA: { icon: Percent, color: '#FFB800', label: 'Comisiones' },
  DEVOLUCION: { icon: ArrowDownRight, color: '#FF4757', label: 'Devoluciones' },
  EMPAQUE: { icon: Box, color: '#FFB800', label: 'Empaque' },
  OPERATIVO: { icon: Settings, color: '#FFB800', label: 'Operativo' },
  IMPUESTO: { icon: Receipt, color: '#FFB800', label: 'Impuestos' },
  OTRO: { icon: Info, color: '#B8B8B8', label: 'Otro' },
}

function formatCOP(value: number): string {
  return `$ ${Math.round(value).toLocaleString('es-CO')}`
}

function formatCOPCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

export default function MiPyGPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [showAddModal, setShowAddModal] = useState(false)

  const { data, isLoading } = usePnL(period)
  const summary = data?.summary
  const timeseries = data?.timeseries ?? []
  const profitability = data?.profitability ?? []

  return (
    <>
      <CommunityTopbar
        title="Mi P&G"
        subtitle="Tu estado de resultados en tiempo real"
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Selector de periodo + acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <button
            onClick={() => setShowAddModal(true)}
            className="vc-btn-primary inline-flex items-center gap-2 text-xs"
          >
            <Plus size={14} /> Registrar gasto
          </button>
        </div>

        {isLoading || !summary ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <>
            {/* KPI hero: ganancia neta */}
            <HeroKpi summary={summary} />

            {/* Grid de KPIs secundarios */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi
                label="Ingreso bruto"
                value={formatCOPCompact(summary.ingresoBruto)}
                icon={DollarSign}
                accent="var(--vc-lime-main)"
              />
              <Kpi
                label="Ganancia bruta"
                value={formatCOPCompact(summary.gananciaBruta)}
                icon={TrendingUp}
                accent={summary.gananciaBruta >= 0 ? 'var(--vc-lime-main)' : '#FF4757'}
                hint={`Margen ${summary.margenBruto.toFixed(1)}%`}
              />
              <Kpi
                label="Órdenes"
                value={summary.ordersCount.toString()}
                icon={ShoppingCart}
                accent="#3CC6FF"
                hint={`Ticket ${formatCOPCompact(summary.ticketPromedio)}`}
              />
              <Kpi
                label="ROI"
                value={`${summary.roi.toFixed(1)}%`}
                icon={Percent}
                accent={summary.roi >= 0 ? 'var(--vc-lime-main)' : '#FF4757'}
                hint="Ganancia / Inversión"
              />
            </div>

            {/* Insights del MentorFinanciero */}
            <MentorInsightsCard period={period === 'month' || period === 'year' ? '30d' : period} />

            {/* Gráfico + breakdown */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TimeseriesChart data={timeseries} />
              </div>
              <BreakdownCard summary={summary} />
            </div>

            {/* Productos más rentables */}
            <ProfitabilityTable rows={profitability} />

            {/* Listado de movimientos recientes */}
            <RecentEntries />
          </>
        )}
      </div>

      {showAddModal && <AddEntryModal onClose={() => setShowAddModal(false)} />}
    </>
  )
}

function HeroKpi({ summary }: { summary: any }) {
  const positive = summary.gananciaNeta >= 0
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: positive
          ? 'linear-gradient(135deg, rgba(198,255,60,0.12) 0%, rgba(168,255,0,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255,71,87,0.15) 0%, rgba(255,71,87,0.05) 100%)',
        border: `1px solid ${positive ? 'rgba(198,255,60,0.35)' : 'rgba(255,71,87,0.4)'}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}
          >
            Ganancia neta
          </p>
          <p
            className="mt-2 text-4xl font-bold md:text-5xl"
            style={{
              color: positive ? 'var(--vc-lime-main)' : '#FF4757',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {formatCOP(summary.gananciaNeta)}
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            Margen neto: <strong style={{ color: 'var(--vc-white-soft)' }}>{summary.margenNeto.toFixed(1)}%</strong>
          </p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: positive ? 'rgba(198,255,60,0.2)' : 'rgba(255,71,87,0.2)' }}
        >
          {positive ? (
            <TrendingUp size={24} style={{ color: 'var(--vc-lime-main)' }} />
          ) : (
            <TrendingDown size={24} style={{ color: '#FF4757' }} />
          )}
        </div>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string
  value: string
  icon: any
  accent: string
  hint?: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198,255,60,0.15)',
      }}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--vc-white-dim)' }}>
          {label}
        </span>
      </div>
      <p
        className="mt-2 text-2xl font-bold"
        style={{ color: accent, fontFamily: 'var(--font-heading)' }}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function TimeseriesChart({ data }: { data: Array<{ date: string; ingreso: number; egreso: number; neto: number }> }) {
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.ingreso, d.egreso)))

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.15)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
          Evolución diaria
        </h3>
        <div className="flex gap-3 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--vc-lime-main)' }} /> Ingreso
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: '#FF4757' }} /> Egreso
          </span>
        </div>
      </div>

      <div className="flex h-40 items-end gap-0.5">
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col justify-end gap-0.5" title={`${d.date}: +${formatCOP(d.ingreso)} / -${formatCOP(d.egreso)}`}>
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${(d.ingreso / maxVal) * 100}%`,
                background: 'var(--vc-lime-main)',
                minHeight: d.ingreso > 0 ? '2px' : '0',
              }}
            />
            <div
              className="w-full"
              style={{
                height: `${(d.egreso / maxVal) * 60}%`,
                background: '#FF4757',
                minHeight: d.egreso > 0 ? '2px' : '0',
                opacity: 0.7,
              }}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
        {data.length} días
      </p>
    </div>
  )
}

function BreakdownCard({ summary }: { summary: any }) {
  const rows = [
    { label: 'Ingresos', value: summary.ingresoBruto, type: 'INGRESO' },
    { label: 'Costo producto', value: -summary.costoProducto, type: 'EGRESO' },
    { label: 'Envío', value: -summary.costoEnvio, type: 'EGRESO' },
    { label: 'Publicidad', value: -summary.gastoPublicidad, type: 'EGRESO' },
    { label: 'Devoluciones', value: -summary.devoluciones, type: 'EGRESO' },
    { label: 'Otros', value: -summary.otrosEgresos, type: 'EGRESO' },
  ]

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.15)' }}
    >
      <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
        Desglose
      </h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--vc-white-dim)' }}>{r.label}</span>
            <span
              className="font-bold"
              style={{
                color: r.value >= 0 ? 'var(--vc-lime-main)' : '#FF4757',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {r.value >= 0 ? '+' : ''}{formatCOP(r.value)}
            </span>
          </div>
        ))}
        <div className="mt-3 border-t pt-3" style={{ borderColor: 'rgba(198,255,60,0.15)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
              Neto
            </span>
            <span
              className="text-lg font-bold"
              style={{
                color: summary.gananciaNeta >= 0 ? 'var(--vc-lime-main)' : '#FF4757',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {formatCOP(summary.gananciaNeta)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfitabilityTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.1)' }}
      >
        <Package size={32} className="mx-auto mb-2" style={{ color: 'var(--vc-gray-mid)' }} />
        <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
          Aún no hay productos con ventas en este periodo
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.15)' }}
    >
      <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
        Productos más rentables
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'var(--vc-white-dim)' }}>
              <th className="pb-2 text-left font-normal">Producto</th>
              <th className="pb-2 text-right font-normal">Unidades</th>
              <th className="pb-2 text-right font-normal">Ingreso</th>
              <th className="pb-2 text-right font-normal">Ganancia</th>
              <th className="pb-2 text-right font-normal">Margen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.productId} style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
                <td className="py-2" style={{ color: 'var(--vc-white-soft)' }}>
                  {p.name}
                </td>
                <td className="py-2 text-right" style={{ color: 'var(--vc-white-dim)' }}>
                  {p.unitsSold}
                </td>
                <td className="py-2 text-right" style={{ color: 'var(--vc-white-dim)' }}>
                  {formatCOPCompact(p.revenue)}
                </td>
                <td
                  className="py-2 text-right font-bold"
                  style={{ color: p.profit >= 0 ? 'var(--vc-lime-main)' : '#FF4757' }}
                >
                  {formatCOPCompact(p.profit)}
                </td>
                <td className="py-2 text-right" style={{ color: 'var(--vc-white-dim)' }}>
                  {p.margin.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RecentEntries() {
  const { data } = useFinanceEntries({ limit: 10 })
  const entries = data?.entries ?? []
  const del = useDeleteEntry()

  if (entries.length === 0) return null

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.15)' }}
    >
      <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
        Movimientos recientes
      </h3>
      <div className="space-y-1.5">
        {entries.map((e: any) => {
          const meta = CATEGORY_META[e.category] ?? CATEGORY_META.OTRO
          const Icon = meta.icon
          const isIngreso = e.type === 'INGRESO'
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-lg p-2"
              style={{ background: 'var(--vc-black-soft)' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${meta.color}22`, color: meta.color }}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs" style={{ color: 'var(--vc-white-soft)' }}>
                  {e.description ?? meta.label}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
                  {new Date(e.date).toLocaleDateString('es-CO')} · {e.source === 'MANUAL' ? 'Manual' : 'Auto'}
                </p>
              </div>
              <p
                className="text-xs font-bold"
                style={{
                  color: isIngreso ? 'var(--vc-lime-main)' : '#FF4757',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {isIngreso ? '+' : '-'}{formatCOP(e.amount)}
              </p>
              {e.source === 'MANUAL' && (
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar este movimiento?')) del.mutate(e.id)
                  }}
                  className="opacity-60 transition hover:opacity-100"
                  style={{ color: 'var(--vc-white-dim)' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MentorInsightsCard({ period }: { period: '7d' | '30d' | '90d' }) {
  const { data, isLoading, error } = useMentorInsights(period)

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(198,255,60,0.08) 0%, rgba(60,198,255,0.04) 100%)',
        border: '1px solid rgba(198,255,60,0.25)',
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'rgba(198,255,60,0.2)' }}
        >
          <Sparkles size={14} style={{ color: 'var(--vc-lime-main)' }} />
        </div>
        <div>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
          >
            Mentor Financiero · VITA
          </p>
          <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
            Sugerencias personalizadas para tu negocio
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
          Analizando tu P&G…
        </p>
      ) : error ? (
        <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
          Necesitas más datos de ventas para recibir sugerencias.
        </p>
      ) : data?.insights ? (
        <div className="space-y-2">
          {data.insights.map((ins: any, i: number) => (
            <div
              key={i}
              className="rounded-lg p-3"
              style={{ background: 'rgba(10,10,10,0.4)', borderLeft: `3px solid ${ins.severity === 'high' ? '#FF4757' : ins.severity === 'medium' ? '#FFB800' : 'var(--vc-lime-main)'}` }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                {ins.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                {ins.message}
              </p>
              {ins.action && (
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--vc-lime-main)' }}>
                  → {ins.action}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
          Todo bajo control. Sigue así.
        </p>
      )}
    </div>
  )
}

function AddEntryModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    type: 'EGRESO',
    category: 'PUBLICIDAD',
    amount: '',
    description: '',
  })
  const create = useCreateEntry()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return
    try {
      await create.mutateAsync({
        type: form.type as any,
        category: form.category as any,
        amount: amt,
        description: form.description || undefined,
      })
      onClose()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Registrar movimiento
          </h2>
          <button onClick={onClose} style={{ color: 'var(--vc-white-dim)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(['INGRESO', 'EGRESO'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className="rounded-lg px-3 py-2 text-xs font-semibold transition"
                style={{
                  background: form.type === t ? (t === 'INGRESO' ? 'var(--vc-lime-main)' : '#FF4757') : 'var(--vc-black-soft)',
                  color: form.type === t ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: `1px solid ${form.type === t ? 'transparent' : 'var(--vc-gray-dark)'}`,
                }}
              >
                {t === 'INGRESO' ? 'Ingreso' : 'Egreso'}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide" style={{ color: 'var(--vc-white-dim)' }}>
              Categoría
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            >
              {Object.entries(CATEGORY_META)
                .filter(([k]) => (form.type === 'INGRESO' ? k === 'VENTA' || k === 'OTRO' : k !== 'VENTA'))
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide" style={{ color: 'var(--vc-white-dim)' }}>
              Monto (COP)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide" style={{ color: 'var(--vc-white-dim)' }}>
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Campaña Meta colágeno"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
          </div>

          <button
            type="submit"
            disabled={create.isPending}
            className="vc-btn-primary mt-2 w-full text-sm"
          >
            {create.isPending ? 'Guardando...' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
