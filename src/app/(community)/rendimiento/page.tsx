'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3,
  Target, ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw,
  Package, Users, Percent, AlertTriangle, CheckCircle2, Lightbulb,
  Calendar,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { MOCK_METRICS, MOCK_STORE, formatCOP } from '@/lib/integrations/shopify'

// ── Rendimiento — Dashboard de métricas de tu tienda ─────
// Analítica de ventas, productos top, tendencias y
// recomendaciones IA para mejorar resultados.

type Period = '7d' | '30d' | '90d'

export default function RendimientoPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const metrics = MOCK_METRICS

  // Cálculos derivados
  const profitMargin = ((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(1)
  const ordersDelivered = metrics.ordersByStatus.delivered || 0
  const totalProcessed = metrics.totalOrders - (metrics.ordersByStatus.cancelled || 0)
  const deliveryRate = ((ordersDelivered / totalProcessed) * 100).toFixed(1)

  return (
    <>
      <CommunityTopbar
        title="Rendimiento"
        subtitle={`${MOCK_STORE.storeName} · Métricas en tiempo real`}
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Periodo selector */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: period === p ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                  color: period === p ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: period === p ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
            <RefreshCw size={12} /> Actualizar
          </button>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <BigKpi label="Ingresos" value={formatCOP(metrics.totalRevenue)} change={12.5} icon={DollarSign} />
          <BigKpi label="Ganancia neta" value={formatCOP(metrics.totalProfit)} change={8.3} icon={TrendingUp} highlight />
          <BigKpi label="Pedidos" value={metrics.totalOrders} change={15.2} icon={ShoppingCart} />
          <BigKpi label="Ticket promedio" value={formatCOP(metrics.avgOrderValue)} change={-2.1} icon={Target} />
        </div>

        {/* Segunda fila de métricas */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniMetric label="Margen de ganancia" value={`${profitMargin}%`} icon={Percent} status="good" />
          <MiniMetric label="Tasa de conversión" value={`${metrics.conversionRate}%`} icon={Users} status={metrics.conversionRate > 2.5 ? 'good' : 'warning'} />
          <MiniMetric label="Tasa de devolución" value={`${metrics.returnRate}%`} icon={Package} status={metrics.returnRate < 10 ? 'good' : 'warning'} />
          <MiniMetric label="Tasa de entrega" value={`${deliveryRate}%`} icon={CheckCircle2} status={Number(deliveryRate) > 85 ? 'good' : 'warning'} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de ingresos (barras simples) */}
          <div className="vc-card">
            <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Ingresos últimos 7 días
            </h3>
            <div className="flex items-end gap-2" style={{ height: 160 }}>
              {metrics.revenueByDay.map((day) => {
                const maxRevenue = Math.max(...metrics.revenueByDay.map(d => d.revenue))
                const height = (day.revenue / maxRevenue) * 100
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <p className="text-[8px] font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                      {(day.revenue / 1000).toFixed(0)}K
                    </p>
                    <div className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${height}%`,
                        background: 'var(--vc-gradient-primary)',
                        boxShadow: '0 0 12px var(--vc-glow-lime)',
                        minHeight: 8,
                      }}
                    />
                    <p className="text-[8px]" style={{ color: 'var(--vc-gray-mid)' }}>
                      {new Date(day.date).toLocaleDateString('es-CO', { weekday: 'short' })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Estado de pedidos */}
          <div className="vc-card">
            <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Estado de pedidos
            </h3>
            <div className="space-y-3">
              {Object.entries(metrics.ordersByStatus).map(([status, count]) => {
                const total = metrics.totalOrders
                const pct = ((count / total) * 100).toFixed(0)
                const colors: Record<string, string> = {
                  pending: 'var(--vc-warning)',
                  confirmed: 'var(--vc-info)',
                  processing: 'var(--vc-lime-main)',
                  shipped: 'var(--vc-lime-electric)',
                  delivered: 'var(--vc-lime-deep)',
                  cancelled: 'var(--vc-error)',
                }
                const labels: Record<string, string> = {
                  pending: 'Pendientes',
                  confirmed: 'Confirmados',
                  processing: 'Procesando',
                  shipped: 'Enviados',
                  delivered: 'Entregados',
                  cancelled: 'Cancelados',
                }
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span style={{ color: 'var(--vc-white-dim)' }}>{labels[status] || status}</span>
                      <span style={{ color: colors[status], fontFamily: 'var(--font-mono)' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--vc-gray-dark)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[status] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top productos */}
        <div className="vc-card">
          <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Top productos por ventas
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.topProducts.map((p, i) => (
              <div key={p.name} className="rounded-lg p-3 text-center"
                style={{ background: 'var(--vc-black-soft)', border: i === 0 ? '1px solid rgba(198,255,60,0.4)' : '1px solid var(--vc-gray-dark)' }}>
                <span className="mb-1 inline-block text-lg font-black"
                  style={{ color: i === 0 ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)', fontFamily: 'var(--font-display)' }}>
                  #{i + 1}
                </span>
                <p className="text-[11px] font-bold" style={{ color: 'var(--vc-white-soft)' }}>{p.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  {p.sold} vendidos
                </p>
                <p className="mt-1 text-xs font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                  {formatCOP(p.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendaciones IA */}
        <div className="vc-card" style={{ borderColor: 'rgba(198,255,60,0.3)' }}>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={16} color="var(--vc-lime-main)" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              Recomendaciones para mejorar tus ventas
            </h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Recommendation
              icon={TrendingUp}
              title="Aumenta tu ticket promedio"
              text="Tu ticket promedio es $43.3K. Agrega productos complementarios como Gummis Vitamina C junto al Colágeno Marino para bundles de $65K+."
              priority="high"
            />
            <Recommendation
              icon={Target}
              title="Mejora tu conversión"
              text="Tu tasa de conversión es 3.2%. Agrega testimonios de clientes reales y fotos de resultados. Los dropshippers con reseñas convierten 40% más."
              priority="medium"
            />
            <Recommendation
              icon={Package}
              title="Reduce devoluciones"
              text="Tu tasa de devolución (8.5%) está bien. Para bajarla más, envía un mensaje WhatsApp automático 24h antes de la entrega con instrucciones."
              priority="low"
            />
            <Recommendation
              icon={Lightbulb}
              title="Producto estrella sin explotar"
              text="El Ryze tiene margen del 45% y solo 22 ventas. Con su tendencia de hongos medicinales, podrías posicionarlo en TikTok con contenido educativo."
              priority="high"
            />
          </div>
        </div>

        {/* Comparación con la comunidad */}
        <div className="vc-card">
          <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Tu rendimiento vs. la comunidad VITALCOMMERS
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <ComparisonMetric label="Ingresos mensuales" yours={formatCOP(4_850_000)} avg={formatCOP(2_800_000)} better />
            <ComparisonMetric label="Pedidos mensuales" yours="112" avg="67" better />
            <ComparisonMetric label="Tasa de devolución" yours="8.5%" avg="12.3%" better />
          </div>
          <div className="mt-4 rounded-lg p-3 text-center" style={{ background: 'rgba(198,255,60,0.08)', border: '1px solid rgba(198,255,60,0.2)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              Estás en el TOP 15% de VITALCOMMERS por ingresos
            </p>
            <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
              Sigue así — a este ritmo llegarás a Nivel 5 (Rama) en 2 semanas
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Componentes auxiliares ────────────────────────────────

function BigKpi({ label, value, change, icon: Icon, highlight }: {
  label: string; value: string | number; change: number; icon: typeof DollarSign; highlight?: boolean
}) {
  const positive = change >= 0
  return (
    <div className="vc-card" style={{ padding: '1rem' }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
        <Icon size={14} style={{ color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
      </div>
      <p className="text-lg font-black"
        style={{ color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <div className="mt-1 flex items-center gap-1">
        {positive ? <ArrowUpRight size={11} color="var(--vc-lime-main)" /> : <ArrowDownRight size={11} color="var(--vc-error)" />}
        <span className="text-[10px] font-bold" style={{ color: positive ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}>
          {positive ? '+' : ''}{change}%
        </span>
        <span className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>vs anterior</span>
      </div>
    </div>
  )
}

function MiniMetric({ label, value, icon: Icon, status }: {
  label: string; value: string; icon: typeof Percent; status: 'good' | 'warning'
}) {
  return (
    <div className="vc-card flex items-center gap-3" style={{ padding: '0.75rem 1rem' }}>
      <Icon size={16} style={{ color: status === 'good' ? 'var(--vc-lime-main)' : 'var(--vc-warning)' }} />
      <div>
        <p className="text-xs font-bold" style={{ color: status === 'good' ? 'var(--vc-lime-main)' : 'var(--vc-warning)', fontFamily: 'var(--font-mono)' }}>
          {value}
        </p>
        <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>{label}</p>
      </div>
    </div>
  )
}

function Recommendation({ icon: Icon, title, text, priority }: {
  icon: typeof TrendingUp; title: string; text: string; priority: 'high' | 'medium' | 'low'
}) {
  const colors = { high: 'var(--vc-lime-main)', medium: 'var(--vc-info)', low: 'var(--vc-white-dim)' }
  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} style={{ color: colors[priority] }} />
        <p className="text-xs font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>{title}</p>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>{text}</p>
    </div>
  )
}

function ComparisonMetric({ label, yours, avg, better }: {
  label: string; yours: string; avg: string; better: boolean
}) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)' }}>{label}</p>
      <p className="mt-1 text-sm font-black" style={{ color: better ? 'var(--vc-lime-main)' : 'var(--vc-error)', fontFamily: 'var(--font-display)' }}>
        {yours}
      </p>
      <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>Promedio comunidad: {avg}</p>
    </div>
  )
}
