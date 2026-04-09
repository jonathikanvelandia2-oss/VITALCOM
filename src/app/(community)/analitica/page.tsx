'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp, DollarSign, Package, Users, ShoppingCart,
  BarChart3, ArrowUpRight, ArrowDownRight, Calendar,
  Target, Zap, RefreshCw,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// ── Analítica para emprendedores Vitalcom ───────────────
// Métricas de su operación de dropshipping: ventas, pedidos,
// productos top, ganancias y predicciones.

type Period = '7d' | '30d' | '90d'

// Datos demo — se reemplazan con datos reales de la API
const MOCK_DATA = {
  '7d': {
    revenue: 2_450_000,
    orders: 18,
    avgOrder: 136_111,
    customers: 15,
    revenuePrev: 1_980_000,
    ordersPrev: 14,
    chart: [
      { date: 'Lun', value: 280000 },
      { date: 'Mar', value: 450000 },
      { date: 'Mié', value: 320000 },
      { date: 'Jue', value: 510000 },
      { date: 'Vie', value: 390000 },
      { date: 'Sáb', value: 280000 },
      { date: 'Dom', value: 220000 },
    ],
  },
  '30d': {
    revenue: 8_750_000,
    orders: 64,
    avgOrder: 136_718,
    customers: 48,
    revenuePrev: 7_200_000,
    ordersPrev: 52,
    chart: Array.from({ length: 30 }, (_, i) => ({
      date: `${i + 1}`,
      value: 150000 + Math.random() * 500000,
    })),
  },
  '90d': {
    revenue: 24_300_000,
    orders: 178,
    avgOrder: 136_516,
    customers: 132,
    revenuePrev: 19_500_000,
    ordersPrev: 145,
    chart: Array.from({ length: 12 }, (_, i) => ({
      date: `Sem ${i + 1}`,
      value: 1200000 + Math.random() * 2000000,
    })),
  },
}

const TOP_PRODUCTS = [
  { name: 'Colágeno Hidrolizado Premium', orders: 28, revenue: 3_920_000 },
  { name: 'Kit Detox 30 Días', orders: 22, revenue: 2_860_000 },
  { name: 'Proteína Vegana Chocolate', orders: 18, revenue: 2_340_000 },
  { name: 'Omega 3 + Vitamina D', orders: 15, revenue: 1_350_000 },
  { name: 'Pack Skincare Natural', orders: 12, revenue: 1_680_000 },
]

const ORDER_STATUS = [
  { status: 'Entregados', count: 42, color: 'var(--vc-lime-main)' },
  { status: 'En camino', count: 12, color: 'var(--vc-info)' },
  { status: 'Procesando', count: 6, color: 'var(--vc-warning)' },
  { status: 'Devueltos', count: 4, color: 'var(--vc-error)' },
]

const INSIGHTS = [
  { icon: Target, title: 'Mejor producto para promover', text: 'Colágeno Hidrolizado Premium — 43% de tus ventas', color: 'var(--vc-lime-main)' },
  { icon: Calendar, title: 'Mejor día para vender', text: 'Jueves y viernes concentran el 45% de pedidos', color: 'var(--vc-info)' },
  { icon: Zap, title: 'Acción recomendada', text: 'Recupera 8 carritos abandonados esta semana → potencial $1.2M COP', color: 'var(--vc-warning)' },
  { icon: TrendingUp, title: 'Predicción próxima semana', text: 'Estimamos $2.8M en ventas basados en tu tendencia', color: 'var(--vc-lime-main)' },
]

export default function AnaliticaPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const data = MOCK_DATA[period]

  const revenueChange = ((data.revenue - data.revenuePrev) / data.revenuePrev * 100).toFixed(1)
  const ordersChange = ((data.orders - data.ordersPrev) / data.ordersPrev * 100).toFixed(1)
  const maxChart = Math.max(...data.chart.map(c => c.value))

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
          <button className="btn-secondary flex items-center gap-2 text-xs">
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard icon={DollarSign} label="Ingresos" value={`$ ${data.revenue.toLocaleString('es-CO')}`} change={revenueChange} />
          <KpiCard icon={ShoppingCart} label="Pedidos" value={String(data.orders)} change={ordersChange} />
          <KpiCard icon={Package} label="Ticket promedio" value={`$ ${data.avgOrder.toLocaleString('es-CO')}`} />
          <KpiCard icon={Users} label="Clientes únicos" value={String(data.customers)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Gráfico de ventas */}
          <div className="vc-card">
            <h3 className="heading-sm mb-4 flex items-center gap-2">
              <BarChart3 size={16} color="var(--vc-lime-main)" /> Ventas por período
            </h3>
            <div className="flex items-end gap-1" style={{ height: 200 }}>
              {data.chart.map((bar, i) => (
                <div key={i} className="group relative flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-100"
                    style={{
                      height: `${(bar.value / maxChart) * 180}px`,
                      background: 'linear-gradient(180deg, var(--vc-lime-main) 0%, var(--vc-lime-deep) 100%)',
                      opacity: 0.7,
                      minHeight: 4,
                    }}
                  />
                  {/* Tooltip on hover */}
                  <div
                    className="pointer-events-none absolute -top-8 hidden rounded px-2 py-1 text-[9px] font-bold group-hover:block"
                    style={{ background: 'var(--vc-black)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}
                  >
                    $ {Math.round(bar.value).toLocaleString('es-CO')}
                  </div>
                  <span className="mt-1 text-[8px]" style={{ color: 'var(--vc-gray-mid)' }}>{bar.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estado de pedidos */}
          <div className="vc-card">
            <h3 className="heading-sm mb-4">Estado de pedidos</h3>
            <div className="space-y-4">
              {ORDER_STATUS.map((s) => {
                const total = ORDER_STATUS.reduce((a, b) => a + b.count, 0)
                const pct = Math.round((s.count / total) * 100)
                return (
                  <div key={s.status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--vc-white-dim)' }}>{s.status}</span>
                      <span className="font-mono font-bold" style={{ color: s.color }}>{s.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top productos */}
          <div className="vc-card">
            <h3 className="heading-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} color="var(--vc-lime-main)" /> Productos más vendidos
            </h3>
            <div className="space-y-3">
              {TOP_PRODUCTS.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'var(--vc-black-soft)' }}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black" style={{ background: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--vc-white-soft)' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>{p.orders} pedidos</p>
                  </div>
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                    $ {p.revenue.toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights IA */}
          <div className="vc-card">
            <h3 className="heading-sm mb-4 flex items-center gap-2">
              <Zap size={16} color="var(--vc-warning)" /> Insights inteligentes
            </h3>
            <div className="space-y-3">
              {INSIGHTS.map((ins) => (
                <div key={ins.title} className="rounded-lg p-3" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                  <div className="mb-1 flex items-center gap-2">
                    <ins.icon size={14} style={{ color: ins.color }} />
                    <span className="text-xs font-bold" style={{ color: ins.color, fontFamily: 'var(--font-heading)' }}>{ins.title}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>{ins.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
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
