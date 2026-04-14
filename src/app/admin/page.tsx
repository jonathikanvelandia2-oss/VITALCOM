'use client'

import {
  TrendingUp, ShoppingBag, Package, Users,
  ArrowUpRight, ArrowDownRight, Loader2, MessageSquare,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminStats } from '@/hooks/useAdminStats'

// ── Dashboard CEO — datos reales de BD ──────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'Procesando',
  DISPATCHED: 'Despachado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', RETURNED: 'Devuelto',
}
const SOURCE_LABELS: Record<string, string> = {
  DIRECT: 'Directo', COMMUNITY: 'Comunidad', DROPSHIPPER: 'Dropshipper',
}

function formatCOP(v: number): string {
  return `$ ${Math.round(v).toLocaleString('es-CO')}`
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminStats(7)

  return (
    <>
      <AdminTopbar title="Dashboard" subtitle="Visión general · Colombia · Últimos 7 días" />
      <div className="flex-1 space-y-6 p-6">
        {isLoading || !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Kpi label="Ventas (7 días)" value={formatCOP(data.kpis.salesToday)}
                delta={data.kpis.salesDelta} up={data.kpis.salesUp}
                icon={<TrendingUp size={18} />} />
              <Kpi label="Pedidos pendientes" value={String(data.kpis.pendingOrders)}
                delta={`${data.kpis.pendingDelta >= 0 ? '+' : ''}${data.kpis.pendingDelta}`}
                up={data.kpis.pendingDelta <= 0}
                icon={<ShoppingBag size={18} />} />
              <Kpi label="Productos activos" value={String(data.kpis.activeProducts)}
                delta={`${data.kpis.totalProducts} total`} up
                icon={<Package size={18} />} />
              <Kpi label="Comunidad" value={data.kpis.communityUsers.toLocaleString('es-CO')}
                delta={`${data.kpis.totalPosts} posts esta semana`} up
                icon={<Users size={18} />} />
            </div>

            {/* Gráfico de ventas + alertas de stock */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="vc-card lg:col-span-2" style={{ minHeight: 320 }}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                      Ventas últimos 7 días
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>Colombia · COP</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.3)' }}>
                    {data.kpis.salesDelta} vs semana anterior
                  </span>
                </div>
                <div className="flex h-56 items-end gap-3">
                  {data.salesByDay.map((d: any, i: number) => {
                    const maxSale = Math.max(...data.salesByDay.map((x: any) => x.total), 1)
                    const h = Math.max(5, (d.total / maxSale) * 100)
                    const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'narrow' })
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-md transition-all hover:opacity-100"
                          style={{
                            height: `${h}%`,
                            background: 'linear-gradient(180deg, var(--vc-lime-main) 0%, var(--vc-lime-deep) 100%)',
                            boxShadow: '0 0 16px var(--vc-glow-lime)',
                            opacity: 0.85,
                          }}
                          title={`${formatCOP(d.total)} — ${d.count} pedidos`} />
                        <span className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                          {dayLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="vc-card">
                <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Alertas de stock
                </h2>
                {data.lowStock.length === 0 ? (
                  <p className="py-6 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                    Todo el stock OK
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.lowStock.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg p-3"
                        style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{s.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                            {s.sku} · {s.country}
                          </p>
                        </div>
                        <span className="rounded-full px-2 py-1 text-[10px] font-bold"
                          style={{
                            background: s.quantity <= 5 ? 'rgba(255,71,87,0.15)' : 'rgba(255,184,0,0.15)',
                            color: s.quantity <= 5 ? 'var(--vc-error)' : 'var(--vc-warning)',
                            border: `1px solid ${s.quantity <= 5 ? 'rgba(255,71,87,0.4)' : 'rgba(255,184,0,0.4)'}`,
                          }}>
                          {s.quantity} uds
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pedidos recientes */}
            <div className="vc-card">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Pedidos recientes
                </h2>
                <a href="/admin/pedidos" className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
                  Ver todos →
                </a>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="py-6 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>No hay pedidos</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                        <th className="py-2">Pedido</th>
                        <th className="py-2">Cliente</th>
                        <th className="py-2">Origen</th>
                        <th className="py-2">Estado</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((r: any) => (
                        <tr key={r.id} className="text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                          <td className="py-3 font-semibold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}>
                            {r.number}
                          </td>
                          <td className="py-3">{r.customer}</td>
                          <td className="py-3">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                              {SOURCE_LABELS[r.source] ?? r.source}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.3)' }}>
                              {STATUS_LABELS[r.status] ?? r.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold" style={{ color: 'var(--vc-white-soft)' }}>
                            {formatCOP(r.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function Kpi({ label, value, delta, up, icon }: {
  label: string; value: string; delta: string; up: boolean; icon: React.ReactNode
}) {
  return (
    <div className="vc-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.3)' }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold"
        style={{ color: up ? 'var(--vc-lime-main)' : 'var(--vc-error)', fontFamily: 'var(--font-heading)' }}>
        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {delta}
      </p>
    </div>
  )
}
