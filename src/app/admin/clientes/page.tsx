import { Plus, Search } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// CRM ligero — clientes finales, dropshippers y B2B
const CLIENTS = [
  { name: 'María Restrepo', email: 'maria.r@gmail.com', city: 'Bogotá', type: 'COMUNIDAD', orders: 12, total: '$ 1.850.000' },
  { name: 'Andrés Gómez', email: 'agomez@hotmail.com', city: 'Medellín', type: 'DROPSHIPPER', orders: 47, total: '$ 12.420.000' },
  { name: 'Tienda Bienestar SAS', email: 'compras@tbsas.co', city: 'Bogotá', type: 'B2B', orders: 23, total: '$ 28.900.000' },
  { name: 'Laura Bedoya', email: 'lau.bedoya@outlook.com', city: 'Cali', type: 'COMUNIDAD', orders: 5, total: '$ 425.000' },
  { name: 'Verónica Salas', email: 'vsalas@yahoo.es', city: 'Bucaramanga', type: 'DROPSHIPPER', orders: 31, total: '$ 6.840.000' },
]

const TYPE_COLORS: Record<string, string> = {
  COMUNIDAD: 'var(--vc-lime-main)',
  DROPSHIPPER: 'var(--vc-info)',
  B2B: 'var(--vc-warning)',
}

export default function ClientesPage() {
  return (
    <>
      <AdminTopbar
        title="Clientes"
        subtitle="CRM · 1.547 contactos · 🇨🇴 Colombia"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px solid var(--vc-gray-dark)',
              minWidth: 320,
            }}
          >
            <Search size={14} color="var(--vc-gray-mid)" />
            <input
              placeholder="Buscar por nombre, email o ciudad..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: 'var(--vc-white-soft)' }}
            />
          </div>
          <button className="vc-btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo cliente
          </button>
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
                <th className="py-3">Cliente</th>
                <th className="py-3">Email</th>
                <th className="py-3">Ciudad</th>
                <th className="py-3">Tipo</th>
                <th className="py-3 text-right">Pedidos</th>
                <th className="py-3 text-right">Total comprado</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr
                  key={c.email}
                  className="text-xs"
                  style={{
                    borderTop: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-dim)',
                  }}
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{
                          background: 'var(--vc-lime-main)',
                          color: 'var(--vc-black)',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {c.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <span
                        className="font-semibold"
                        style={{ color: 'var(--vc-white-soft)' }}
                      >
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 font-mono">{c.email}</td>
                  <td className="py-4">{c.city}</td>
                  <td className="py-4">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: 'var(--vc-black-soft)',
                        color: TYPE_COLORS[c.type],
                        border: `1px solid ${TYPE_COLORS[c.type]}`,
                      }}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="py-4 text-right font-mono">{c.orders}</td>
                  <td
                    className="py-4 text-right font-mono font-bold"
                    style={{ color: 'var(--vc-lime-main)' }}
                  >
                    {c.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
