'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3,
  Target, ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw,
  Package, Users, Percent, AlertTriangle, CheckCircle2, Lightbulb,
  Loader2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useMyStores, useStoreMetrics } from '@/hooks/useShopify'

// ── Rendimiento — Dashboard de métricas reales ──────────

type Period = '7d' | '30d' | '90d'
const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 }

function formatCOP(value: number): string {
  return `$ ${Math.round(value).toLocaleString('es-CO')}`
}

export default function RendimientoPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const { data: storesData, isLoading: storesLoading } = useMyStores()
  const stores = storesData?.stores ?? []
  const activeStore = stores[0] ?? null

  const { data: metricsData, isLoading: metricsLoading } = useStoreMetrics(
    activeStore?.id ?? null,
    PERIOD_DAYS[period]
  )

  const isLoading = storesLoading || metricsLoading

  if (isLoading) {
    return (
      <>
        <CommunityTopbar title="Rendimiento" subtitle="Cargando métricas..." />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </>
    )
  }

  if (!activeStore) {
    return (
      <>
        <CommunityTopbar title="Rendimiento" subtitle="Conecta tu tienda para ver métricas" />
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="text-center">
            <BarChart3 size={48} color="var(--vc-gray-dark)" className="mx-auto mb-4" />
            <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>No tienes tiendas conectadas</p>
            <a href="/mi-tienda" className="vc-btn-primary mt-4 inline-flex items-center gap-2 text-xs">
              Conectar tienda
            </a>
          </div>
        </div>
      </>
    )
  }

  const summary = metricsData?.summary ?? { totalRevenue: 0, totalProfit: 0, totalOrders: 0, avgOrderValue: 0, syncedProducts: 0, conversionRate: 0, returnRate: 0 }
  const topProducts = metricsData?.topProducts ?? []
  const ordersByStatus = metricsData?.ordersByStatus ?? {}
  const revenueByDay = metricsData?.revenueByDay ?? []

  const profitMargin = summary.totalRevenue > 0
    ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)
    : '0'

  return (
    <>
      <CommunityTopbar
        title="Rendimiento"
        subtitle={`${activeStore.storeName} · Métricas en tiempo real`}
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Periodo selector */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: period === p ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                  color: period === p ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: period === p ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}>
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
          <BigKpi label="Ingresos" value={formatCOP(summary.totalRevenue)} icon={DollarSign} />
          <BigKpi label="Ganancia neta" value={formatCOP(summary.totalProfit)} icon={TrendingUp} highlight />
          <BigKpi label="Pedidos" value={summary.totalOrders} icon={ShoppingCart} />
          <BigKpi label="Ticket promedio" value={formatCOP(summary.avgOrderValue)} icon={Target} />
        </div>

        {/* Segunda fila */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniMetric label="Margen de ganancia" value={`${profitMargin}%`} icon={Percent} status="good" />
          <MiniMetric label="Productos sincronizados" value={String(summary.syncedProducts)} icon={Package} status="good" />
          <MiniMetric label="Tasa de entrega" value={`${summary.conversionRate}%`} icon={CheckCircle2} status={summary.conversionRate > 50 ? 'good' : 'warning'} />
          <MiniMetric label="Tasa de devolución" value={`${summary.returnRate}%`} icon={AlertTriangle} status={summary.returnRate < 15 ? 'good' : 'warning'} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de ingresos */}
          <div className="vc-card">
            <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Ingresos por día
            </h3>
            {revenueByDay.length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin datos para este periodo</p>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {revenueByDay.map((day: any) => {
                  const maxRevenue = Math.max(...revenueByDay.map((d: any) => d.revenue), 1)
                  const height = Math.max(5, (day.revenue / maxRevenue) * 100)
                  return (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                      <p className="text-[8px] font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                        {day.revenue > 0 ? `${(day.revenue / 1000).toFixed(0)}K` : ''}
                      </p>
                      <div className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${height}%`,
                          background: 'var(--vc-gradient-primary)',
                          boxShadow: '0 0 12px var(--vc-glow-lime)',
                          minHeight: 4,
                        }}
                        title={`${formatCOP(day.revenue)} — ${day.orders} pedidos`} />
                      <p className="text-[8px]" style={{ color: 'var(--vc-gray-mid)' }}>
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short' })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Estado de pedidos */}
          <div className="vc-card">
            <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Estado de pedidos
            </h3>
            {Object.keys(ordersByStatus).length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin pedidos en este periodo</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(ordersByStatus).map(([status, count]: [string, any]) => {
                  const total = summary.totalOrders || 1
                  const pct = ((count / total) * 100).toFixed(0)
                  const colors: Record<string, string> = {
                    PENDING: 'var(--vc-warning)', CONFIRMED: 'var(--vc-info)', PROCESSING: 'var(--vc-lime-main)',
                    DISPATCHED: 'var(--vc-lime-electric)', DELIVERED: 'var(--vc-lime-deep)', CANCELLED: 'var(--vc-error)', RETURNED: 'var(--vc-error)',
                  }
                  const labels: Record<string, string> = {
                    PENDING: 'Pendientes', CONFIRMED: 'Confirmados', PROCESSING: 'Procesando',
                    DISPATCHED: 'Despachados', DELIVERED: 'Entregados', CANCELLED: 'Cancelados', RETURNED: 'Devueltos',
                  }
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span style={{ color: 'var(--vc-white-dim)' }}>{labels[status] || status}</span>
                        <span style={{ color: colors[status] || 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--vc-gray-dark)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[status] || 'var(--vc-gray-mid)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top productos */}
        {topProducts.length > 0 && (
          <div className="vc-card">
            <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Top productos por ventas
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {topProducts.map((p: any, i: number) => (
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
        )}

        {/* Recomendaciones */}
        <div className="vc-card" style={{ borderColor: 'rgba(198,255,60,0.3)' }}>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={16} color="var(--vc-lime-main)" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              Recomendaciones para mejorar tus ventas
            </h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {summary.syncedProducts < 10 && (
              <Recommendation icon={Package} title="Amplía tu catálogo"
                text="Tienes pocos productos sincronizados. Importa al menos 10 productos del catálogo Vitalcom para ofrecer más variedad a tus clientes."
                priority="high" />
            )}
            {summary.avgOrderValue > 0 && summary.avgOrderValue < 50000 && (
              <Recommendation icon={TrendingUp} title="Aumenta tu ticket promedio"
                text="Agrega productos complementarios y ofrece bundles para elevar el valor promedio de cada pedido."
                priority="high" />
            )}
            <Recommendation icon={Target} title="Mejora tu conversión"
              text="Agrega testimonios de clientes reales y fotos de resultados. Los dropshippers con reseñas convierten 40% más."
              priority="medium" />
            <Recommendation icon={Lightbulb} title="Contenido educativo"
              text="Crea contenido en TikTok e Instagram sobre los beneficios de tus productos. El contenido educativo genera 3x más conversiones."
              priority="medium" />
          </div>
        </div>
      </div>
    </>
  )
}

// ── Componentes auxiliares ───────────────────────────────

function BigKpi({ label, value, icon: Icon, highlight }: {
  label: string; value: string | number; icon: typeof DollarSign; highlight?: boolean
}) {
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
