'use client'

import { useState } from 'react'
import {
  TrendingUp, DollarSign, Package, Users, ShoppingCart,
  BarChart3, ArrowUpRight, ArrowDownRight,
  Target, Zap, Loader2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useMyStores, useStoreMetrics } from '@/hooks/useShopify'

// ── Analítica para emprendedores — datos reales de BD ──

const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DELIVERED: { label: 'Entregados', color: 'var(--vc-lime-main)' },
  DISPATCHED: { label: 'En camino', color: 'var(--vc-info)' },
  PROCESSING: { label: 'Procesando', color: 'var(--vc-warning)' },
  CONFIRMED: { label: 'Confirmados', color: 'var(--vc-white-dim)' },
  PENDING: { label: 'Pendientes', color: 'var(--vc-white-dim)' },
  CANCELLED: { label: 'Cancelados', color: 'var(--vc-error)' },
  RETURNED: { label: 'Devueltos', color: 'var(--vc-error)' },
}

export default function AnaliticaPage() {
  const [period, setPeriod] = useState('30d')
  const days = PERIOD_DAYS[period]

  const { data: storesData, isLoading: storesLoading } = useMyStores()
  const storeId = storesData?.stores?.[0]?.id ?? null
  const { data: metrics, isLoading: metricsLoading } = useStoreMetrics(storeId, days)

  const isLoading = storesLoading || metricsLoading
  const summary = metrics?.summary
  const topProducts = metrics?.topProducts ?? []
  const ordersByStatus = metrics?.ordersByStatus ?? {}
  const revenueByDay = metrics?.revenueByDay ?? []

  // Calcular max para gráfico
  const maxChart = Math.max(...revenueByDay.map((d: any) => d.revenue), 1)

  // Status entries para barras
  const statusEntries = Object.entries(ordersByStatus).map(([status, count]) => ({
    status,
    count: count as number,
    ...(STATUS_LABELS[status] ?? { label: status, color: 'var(--vc-gray-mid)' }),
  }))
  const totalStatusCount = statusEntries.reduce((s, e) => s + e.count, 0)

  return (
    <>
      <CommunityTopbar title="Analítica" subtitle="Métricas de tu operación de dropshipping" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Selector de período */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--vc-black-mid)' }}>
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="rounded-md px-4 py-2 text-xs font-bold transition-all"
                style={{
                  background: period === p ? 'var(--vc-black-soft)' : 'transparent',
                  color: period === p ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                  border: period === p ? '1px solid rgba(198,255,60,0.3)' : '1px solid transparent',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : !storeId ? (
          <div className="vc-card py-16 text-center">
            <ShoppingCart size={40} className="mx-auto mb-4" style={{ color: 'var(--vc-gray-mid)' }} />
            <h3 className="heading-sm mb-2">Sin tienda conectada</h3>
            <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
              Conecta tu tienda Shopify en &quot;Mi Tienda&quot; para ver tus métricas.
            </p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <KpiCard icon={DollarSign} label="Ingresos" value={`$ ${(summary?.totalRevenue ?? 0).toLocaleString('es-CO')}`} />
              <KpiCard icon={ShoppingCart} label="Pedidos" value={String(summary?.totalOrders ?? 0)} />
              <KpiCard icon={Package} label="Ticket promedio" value={`$ ${(summary?.avgOrderValue ?? 0).toLocaleString('es-CO')}`} />
              <KpiCard icon={Users} label="Productos sync" value={String(summary?.syncedProducts ?? 0)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* Gráfico de ventas */}
              <div className="vc-card">
                <h3 className="heading-sm mb-4 flex items-center gap-2">
                  <BarChart3 size={16} color="var(--vc-lime-main)" /> Ventas por día
                </h3>
                {revenueByDay.length === 0 ? (
                  <p className="py-10 text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
                    Sin datos de ventas en este período
                  </p>
                ) : (
                  <div className="flex items-end gap-1" style={{ height: 200 }}>
                    {revenueByDay.map((bar: any, i: number) => (
                      <div key={i} className="group relative flex flex-1 flex-col items-center">
                        <div
                          className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-100"
                          style={{
                            height: `${(bar.revenue / maxChart) * 180}px`,
                            background: 'linear-gradient(180deg, var(--vc-lime-main) 0%, var(--vc-lime-deep) 100%)',
                            opacity: 0.7,
                            minHeight: 4,
                          }}
                        />
                        <div
                          className="pointer-events-none absolute -top-8 hidden rounded px-2 py-1 text-[9px] font-bold group-hover:block"
                          style={{ background: 'var(--vc-black)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}
                        >
                          $ {Math.round(bar.revenue).toLocaleString('es-CO')}
                        </div>
                        <span className="mt-1 text-[8px]" style={{ color: 'var(--vc-gray-mid)' }}>
                          {bar.date?.slice(5) ?? ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Estado de pedidos */}
              <div className="vc-card">
                <h3 className="heading-sm mb-4">Estado de pedidos</h3>
                {statusEntries.length === 0 ? (
                  <p className="py-10 text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>Sin pedidos</p>
                ) : (
                  <div className="space-y-4">
                    {statusEntries.map((s) => {
                      const pct = totalStatusCount > 0 ? Math.round((s.count / totalStatusCount) * 100) : 0
                      return (
                        <div key={s.status}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--vc-white-dim)' }}>{s.label}</span>
                            <span className="font-mono font-bold" style={{ color: s.color }}>{s.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)' }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top productos */}
              <div className="vc-card">
                <h3 className="heading-sm mb-4 flex items-center gap-2">
                  <TrendingUp size={16} color="var(--vc-lime-main)" /> Productos más vendidos
                </h3>
                {topProducts.length === 0 ? (
                  <p className="py-10 text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>Sin ventas aún</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((p: any, i: number) => (
                      <div key={p.name} className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'var(--vc-black-soft)' }}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black" style={{ background: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" style={{ color: 'var(--vc-white-soft)' }}>{p.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>{p.sold} vendidos</p>
                        </div>
                        <span className="font-mono text-sm font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                          $ {(p.revenue ?? 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumen de ganancias */}
              <div className="vc-card">
                <h3 className="heading-sm mb-4 flex items-center gap-2">
                  <Zap size={16} color="var(--vc-warning)" /> Resumen de ganancias
                </h3>
                <div className="space-y-3">
                  <div className="rounded-lg p-3" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                    <div className="mb-1 flex items-center gap-2">
                      <DollarSign size={14} style={{ color: 'var(--vc-lime-main)' }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>Ganancia total</span>
                    </div>
                    <p className="text-lg font-black" style={{ color: 'var(--vc-white)', fontFamily: 'var(--font-display)' }}>
                      $ {(summary?.totalProfit ?? 0).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                    <div className="mb-1 flex items-center gap-2">
                      <Target size={14} style={{ color: 'var(--vc-info)' }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--vc-info)', fontFamily: 'var(--font-heading)' }}>Tasa de conversión</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                      {summary?.conversionRate ?? 0}% de pedidos entregados
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                    <div className="mb-1 flex items-center gap-2">
                      <TrendingUp size={14} style={{ color: 'var(--vc-warning)' }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--vc-warning)', fontFamily: 'var(--font-heading)' }}>Tasa de devolución</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                      {summary?.returnRate ?? 0}% de pedidos devueltos/cancelados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function KpiCard({ icon: Icon, label, value, change }: {
  icon: any; label: string; value: string; change?: string
}) {
  const isPositive = change && parseFloat(change) >= 0
  return (
    <div className="vc-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(198,255,60,0.08)', border: '1px solid rgba(198,255,60,0.2)' }}>
          <Icon size={18} color="var(--vc-lime-main)" />
        </div>
        {change && (
          <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: isPositive ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black" style={{ color: 'var(--vc-white)', fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>{label}</p>
    </div>
  )
}
