'use client'

import { DollarSign, TrendingUp, Wallet, Receipt, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminFinance } from '@/hooks/useAdminStats'
import { useState } from 'react'

// Panel financiero consolidado — toda Vitalcom (4 países)
// Fuente: Order + OrderItem + Product.precioCosto (CALCULO: revenue - COGS - shipping)
// Para "liquidaciones a dropshippers" (M2+) usaremos FinanceEntry con category=LIQUIDACION.

const COUNTRY_LABELS: Record<string, string> = { CO: '🇨🇴 Colombia', EC: '🇪🇨 Ecuador', GT: '🇬🇹 Guatemala', CL: '🇨🇱 Chile' }
const SOURCE_LABELS: Record<string, string> = {
  DIRECT: 'Venta directa',
  COMMUNITY: 'Comunidad',
  DROPSHIPPER: 'Dropshipper',
  ZENDU: 'Zendu',
}

function formatCOP(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$ ${(v / 1_000_000).toFixed(1)} M`
  if (Math.abs(v) >= 1_000) return `$ ${(v / 1_000).toFixed(0)} K`
  return `$ ${Math.round(v).toLocaleString('es-CO')}`
}

export default function FinanzasPage() {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useAdminFinance(days)

  const periodLabel = days === 7 ? 'Últimos 7 días' : days === 30 ? 'Últimos 30 días' : 'Últimos 90 días'

  return (
    <>
      <AdminTopbar title="Finanzas" subtitle={`P&L consolidado · 4 países · ${periodLabel}`} />
      <div className="flex-1 space-y-6 p-6">
        {/* Selector periodo */}
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
              style={{
                background: days === d ? 'rgba(198,255,60,0.15)' : 'var(--vc-black-mid)',
                color: days === d ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                border: `1px solid ${days === d ? 'rgba(198,255,60,0.4)' : 'var(--vc-gray-dark)'}`,
                fontFamily: 'var(--font-heading)',
              }}>
              {d}d
            </button>
          ))}
        </div>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
              <FinKpi label="Ingresos" value={formatCOP(data.kpis.revenue)}
                delta={`${data.kpis.revenueUp ? '+' : ''}${data.kpis.revenueDelta}% vs. anterior`}
                up={data.kpis.revenueUp} icon={<TrendingUp size={18} />} />
              <FinKpi label="COGS" value={formatCOP(data.kpis.cogs)}
                delta={`${data.kpis.orders} pedidos`} up={false} neutral icon={<Receipt size={18} />} />
              <FinKpi label="Utilidad bruta" value={formatCOP(data.kpis.grossProfit)}
                delta={`Margen ${data.kpis.margin}%`}
                up={data.kpis.grossProfit > 0} icon={<DollarSign size={18} />} />
              <FinKpi label="Ticket promedio" value={formatCOP(data.kpis.avgTicket)}
                delta={`${data.kpis.ordersDelta >= 0 ? '+' : ''}${data.kpis.ordersDelta} pedidos`}
                up={data.kpis.ordersDelta >= 0} icon={<Wallet size={18} />} />
            </div>

            {/* Revenue por país + por source */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="vc-card">
                <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Ingresos por país
                </h2>
                <div className="space-y-3">
                  {data.revenueByCountry.length === 0 ? (
                    <p className="py-6 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin ventas en el periodo</p>
                  ) : data.revenueByCountry.map((c: any) => (
                    <div key={c.country}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--vc-white-soft)' }}>{COUNTRY_LABELS[c.country] ?? c.country}</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                          {formatCOP(c.revenue)} · {c.orders} pedidos
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)' }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${c.share}%`,
                            background: 'var(--vc-gradient-primary)',
                            boxShadow: '0 0 12px var(--vc-glow-lime)',
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="vc-card">
                <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Ingresos por canal
                </h2>
                <div className="space-y-3">
                  {data.revenueBySource.length === 0 ? (
                    <p className="py-6 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin datos</p>
                  ) : data.revenueBySource.map((s: any) => (
                    <div key={s.source}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--vc-white-soft)' }}>{SOURCE_LABELS[s.source] ?? s.source}</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--vc-info)' }}>
                          {formatCOP(s.revenue)} · {s.orders}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)' }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${s.share}%`,
                            background: 'linear-gradient(90deg, var(--vc-info) 0%, var(--vc-lime-main) 100%)',
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfico de ingresos por día */}
            <div className="vc-card" style={{ minHeight: 260 }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Ingresos vs. utilidad ({periodLabel})
                </h2>
                <div className="flex gap-3 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--vc-lime-main)' }}>● Ingresos</span>
                  <span style={{ color: 'var(--vc-info)' }}>● Utilidad</span>
                </div>
              </div>
              <div className="flex h-48 items-end gap-1">
                {data.revenueByDay.map((d: any, i: number) => {
                  const max = Math.max(...data.revenueByDay.map((x: any) => x.revenue), 1)
                  const hRev = Math.max(2, (d.revenue / max) * 100)
                  const hProfit = Math.max(1, (Math.max(d.profit, 0) / max) * 100)
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1 group">
                      <div className="relative w-full flex items-end justify-center gap-0.5 h-full">
                        <div className="w-1/2 rounded-t-sm transition-opacity hover:opacity-100"
                          style={{
                            height: `${hRev}%`,
                            background: 'var(--vc-lime-main)',
                            opacity: 0.85,
                          }}
                          title={`${d.date}: ${formatCOP(d.revenue)}`} />
                        <div className="w-1/2 rounded-t-sm transition-opacity hover:opacity-100"
                          style={{
                            height: `${hProfit}%`,
                            background: 'var(--vc-info)',
                            opacity: 0.85,
                          }}
                          title={`${d.date}: Utilidad ${formatCOP(d.profit)}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top productos */}
            <div className="vc-card overflow-x-auto">
              <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                Top productos por revenue
              </h2>
              {data.topProducts.length === 0 ? (
                <p className="py-6 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin ventas en el periodo</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                      <th className="py-2">Producto</th>
                      <th className="py-2">SKU</th>
                      <th className="py-2 text-right">Uds</th>
                      <th className="py-2 text-right">Ingresos</th>
                      <th className="py-2 text-right">Utilidad</th>
                      <th className="py-2 text-right">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p: any) => (
                      <tr key={p.sku} className="text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                        <td className="py-3" style={{ color: 'var(--vc-white-soft)' }}>{p.name}</td>
                        <td className="py-3 font-mono" style={{ color: 'var(--vc-gray-mid)' }}>{p.sku}</td>
                        <td className="py-3 text-right font-mono">{p.units}</td>
                        <td className="py-3 text-right font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{formatCOP(p.revenue)}</td>
                        <td className="py-3 text-right font-mono" style={{ color: p.profit > 0 ? 'var(--vc-info)' : 'var(--vc-error)' }}>{formatCOP(p.profit)}</td>
                        <td className="py-3 text-right font-mono font-bold"
                          style={{ color: p.margin > 30 ? 'var(--vc-lime-main)' : p.margin > 10 ? 'var(--vc-warning)' : 'var(--vc-error)' }}>
                          {p.margin.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function FinKpi({ label, value, delta, up, neutral, icon }: {
  label: string; value: string; delta: string; up?: boolean; neutral?: boolean; icon: React.ReactNode
}) {
  const color = neutral ? 'var(--vc-white-dim)' : up ? 'var(--vc-lime-main)' : 'var(--vc-error)'
  return (
    <div className="vc-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: 'rgba(198, 255, 60, 0.12)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198, 255, 60, 0.3)' }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold" style={{ color, fontFamily: 'var(--font-heading)' }}>
        {!neutral && (up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
        {delta}
      </p>
    </div>
  )
}
