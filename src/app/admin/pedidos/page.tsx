import { Plus, Filter } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Gestión de pedidos B2B/B2C — Colombia
const ORDERS = [
  { n: 'VC-2026-00342', date: '08/04', cust: 'María Restrepo', city: 'Bogotá', src: 'COMUNIDAD', items: 2, total: '$ 185.000', status: 'PROCESSING' },
  { n: 'VC-2026-00341', date: '08/04', cust: 'Andrés Gómez', city: 'Medellín', src: 'DROPSHIPPER', items: 3, total: '$ 240.000', status: 'CONFIRMED' },
  { n: 'VC-2026-00340', date: '08/04', cust: 'Laura Bedoya', city: 'Cali', src: 'DIRECT', items: 1, total: '$ 95.000', status: 'DISPATCHED' },
  { n: 'VC-2026-00339', date: '07/04', cust: 'Tienda Bienestar SAS', city: 'Bogotá', src: 'ZENDU', items: 12, total: '$ 1.420.000', status: 'DELIVERED' },
  { n: 'VC-2026-00338', date: '07/04', cust: 'Juan Pablo Cruz', city: 'Barranquilla', src: 'COMUNIDAD', items: 2, total: '$ 168.000', status: 'PENDING' },
  { n: 'VC-2026-00337', date: '07/04', cust: 'Verónica Salas', city: 'Bucaramanga', src: 'DROPSHIPPER', items: 5, total: '$ 410.000', status: 'DELIVERED' },
]

const STATUS_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  PENDING:    { bg: 'rgba(255, 184, 0, 0.12)', fg: 'var(--vc-warning)', border: 'rgba(255, 184, 0, 0.4)' },
  CONFIRMED:  { bg: 'rgba(60, 198, 255, 0.12)', fg: 'var(--vc-info)', border: 'rgba(60, 198, 255, 0.4)' },
  PROCESSING: { bg: 'rgba(198, 255, 60, 0.12)', fg: 'var(--vc-lime-main)', border: 'rgba(198, 255, 60, 0.4)' },
  DISPATCHED: { bg: 'rgba(168, 255, 0, 0.12)', fg: 'var(--vc-lime-electric)', border: 'rgba(168, 255, 0, 0.4)' },
  DELIVERED:  { bg: 'rgba(127, 184, 0, 0.18)', fg: 'var(--vc-lime-deep)', border: 'rgba(127, 184, 0, 0.4)' },
  CANCELLED:  { bg: 'rgba(255, 71, 87, 0.12)', fg: 'var(--vc-error)', border: 'rgba(255, 71, 87, 0.4)' },
}

export default function PedidosPage() {
  return (
    <>
      <AdminTopbar
        title="Pedidos"
        subtitle="Gestión B2B + B2C · 🇨🇴 Colombia"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {['Todos', 'Pendientes', 'Confirmados', 'En proceso', 'Despachados', 'Entregados'].map(
              (t, i) => (
                <button
                  key={t}
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    background: i === 0 ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                    color: i === 0 ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                    border: i === 0 ? 'none' : '1px solid var(--vc-gray-dark)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-dim)',
              }}
            >
              <Filter size={14} /> Filtros
            </button>
            <button className="vc-btn-primary flex items-center gap-2">
              <Plus size={16} /> Nuevo pedido
            </button>
          </div>
        </div>

        <div className="vc-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-wider"
                style={{
                  color: 'var(--vc-gray-mid)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <th className="py-3">N° pedido</th>
                <th className="py-3">Fecha</th>
                <th className="py-3">Cliente</th>
                <th className="py-3">Ciudad</th>
                <th className="py-3">Origen</th>
                <th className="py-3 text-right">Items</th>
                <th className="py-3 text-right">Total</th>
                <th className="py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => {
                const c = STATUS_COLORS[o.status]
                return (
                  <tr
                    key={o.n}
                    className="text-xs"
                    style={{
                      borderTop: '1px solid var(--vc-gray-dark)',
                      color: 'var(--vc-white-dim)',
                    }}
                  >
                    <td
                      className="py-3 font-mono font-bold"
                      style={{ color: 'var(--vc-white-soft)' }}
                    >
                      {o.n}
                    </td>
                    <td
                      className="py-3 font-mono"
                      style={{ color: 'var(--vc-gray-mid)' }}
                    >
                      {o.date}
                    </td>
                    <td className="py-3" style={{ color: 'var(--vc-white-soft)' }}>
                      {o.cust}
                    </td>
                    <td className="py-3">{o.city}</td>
                    <td className="py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: 'var(--vc-black-soft)',
                          border: '1px solid var(--vc-gray-dark)',
                        }}
                      >
                        {o.src}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono">{o.items}</td>
                    <td
                      className="py-3 text-right font-bold font-mono"
                      style={{ color: 'var(--vc-white-soft)' }}
                    >
                      {o.total}
                    </td>
                    <td className="py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: c.bg,
                          color: c.fg,
                          border: `1px solid ${c.border}`,
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
