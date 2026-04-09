import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Dashboard principal del panel administrativo Vitalcom (Colombia)
// Métricas de venta, top productos, pedidos recientes, alertas de stock
export default function AdminDashboardPage() {
  return (
    <>
      <AdminTopbar
        title="Dashboard"
        subtitle="Visión general · 🇨🇴 Colombia · Hoy"
      />

      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Ventas hoy"
            value="$ 4.250.000"
            delta="+18.4%"
            up
            icon={<TrendingUp size={18} />}
          />
          <Kpi
            label="Pedidos pendientes"
            value="37"
            delta="+5"
            up
            icon={<ShoppingBag size={18} />}
          />
          <Kpi
            label="Productos activos"
            value="142"
            delta="3 nuevos"
            up
            icon={<Package size={18} />}
          />
          <Kpi
            label="Comunidad"
            value="1.547"
            delta="+12 esta semana"
            up
            icon={<Users size={18} />}
          />
        </div>

        {/* Gráfico + alertas */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div
            className="vc-card lg:col-span-2"
            style={{ minHeight: 320 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  className="text-base font-bold"
                  style={{
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Ventas últimos 7 días
                </h2>
                <p
                  className="text-xs"
                  style={{ color: 'var(--vc-white-dim)' }}
                >
                  Colombia · COP
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(198, 255, 60, 0.12)',
                  color: 'var(--vc-lime-main)',
                  border: '1px solid rgba(198, 255, 60, 0.3)',
                }}
              >
                +24% vs semana anterior
              </span>
            </div>
            {/* Mock de gráfico — barras estilizadas */}
            <div className="flex h-56 items-end gap-3">
              {[40, 65, 50, 80, 55, 92, 100].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md transition-all hover:opacity-100"
                    style={{
                      height: `${h}%`,
                      background:
                        'linear-gradient(180deg, var(--vc-lime-main) 0%, var(--vc-lime-deep) 100%)',
                      boxShadow: '0 0 16px var(--vc-glow-lime)',
                      opacity: 0.85,
                    }}
                  />
                  <span
                    className="text-[10px]"
                    style={{
                      color: 'var(--vc-gray-mid)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="vc-card">
            <h2
              className="mb-4 text-base font-bold"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Alertas de stock
            </h2>
            <div className="space-y-3">
              {[
                { sku: 'VC-COLAGENO-30', name: 'Colágeno hidrolizado 30g', qty: 4 },
                { sku: 'VC-OMEGA-60', name: 'Omega 3 · 60 cápsulas', qty: 7 },
                { sku: 'VC-MACA-200', name: 'Maca andina 200g', qty: 11 },
              ].map((s) => (
                <div
                  key={s.sku}
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px solid var(--vc-gray-dark)',
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-xs font-semibold"
                      style={{ color: 'var(--vc-white-soft)' }}
                    >
                      {s.name}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{
                        color: 'var(--vc-gray-mid)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {s.sku}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-1 text-[10px] font-bold"
                    style={{
                      background: 'rgba(255, 71, 87, 0.15)',
                      color: 'var(--vc-error)',
                      border: '1px solid rgba(255, 71, 87, 0.4)',
                    }}
                  >
                    {s.qty} uds
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pedidos recientes */}
        <div className="vc-card">
          <div className="mb-5 flex items-center justify-between">
            <h2
              className="text-base font-bold"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Pedidos recientes
            </h2>
            <button
              className="text-xs font-semibold uppercase tracking-wider"
              style={{
                color: 'var(--vc-lime-main)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="text-[10px] uppercase tracking-wider"
                  style={{
                    color: 'var(--vc-gray-mid)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <th className="py-2">Pedido</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Origen</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    n: 'VC-2026-00342',
                    c: 'María Restrepo',
                    o: 'COMUNIDAD',
                    s: 'PROCESSING',
                    t: '$ 185.000',
                  },
                  {
                    n: 'VC-2026-00341',
                    c: 'Andrés Gómez',
                    o: 'DROPSHIPPER',
                    s: 'CONFIRMED',
                    t: '$ 240.000',
                  },
                  {
                    n: 'VC-2026-00340',
                    c: 'Laura Bedoya',
                    o: 'DIRECT',
                    s: 'DISPATCHED',
                    t: '$ 95.000',
                  },
                  {
                    n: 'VC-2026-00339',
                    c: 'Tienda Bienestar SAS',
                    o: 'ZENDU',
                    s: 'DELIVERED',
                    t: '$ 1.420.000',
                  },
                ].map((r) => (
                  <tr
                    key={r.n}
                    className="text-xs"
                    style={{
                      borderTop: '1px solid var(--vc-gray-dark)',
                      color: 'var(--vc-white-dim)',
                    }}
                  >
                    <td
                      className="py-3 font-semibold"
                      style={{
                        color: 'var(--vc-white-soft)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {r.n}
                    </td>
                    <td className="py-3">{r.c}</td>
                    <td className="py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: 'var(--vc-black-soft)',
                          border: '1px solid var(--vc-gray-dark)',
                        }}
                      >
                        {r.o}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: 'rgba(198, 255, 60, 0.12)',
                          color: 'var(--vc-lime-main)',
                          border: '1px solid rgba(198, 255, 60, 0.3)',
                        }}
                      >
                        {r.s}
                      </span>
                    </td>
                    <td
                      className="py-3 text-right font-bold"
                      style={{ color: 'var(--vc-white-soft)' }}
                    >
                      {r.t}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function Kpi({
  label,
  value,
  delta,
  up,
  icon,
}: {
  label: string
  value: string
  delta: string
  up: boolean
  icon: React.ReactNode
}) {
  return (
    <div className="vc-card">
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{
            color: 'var(--vc-gray-mid)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {label}
        </span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(198, 255, 60, 0.12)',
            color: 'var(--vc-lime-main)',
            border: '1px solid rgba(198, 255, 60, 0.3)',
          }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-2xl font-black"
        style={{
          color: 'var(--vc-white-soft)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </p>
      <p
        className="mt-1 flex items-center gap-1 text-[11px] font-semibold"
        style={{
          color: up ? 'var(--vc-lime-main)' : 'var(--vc-error)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {delta}
      </p>
    </div>
  )
}
