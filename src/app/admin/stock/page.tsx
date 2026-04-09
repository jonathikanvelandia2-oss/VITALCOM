import { Warehouse, AlertTriangle, TrendingDown } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Vista de stock — Colombia (sede principal)
// Cuando se activen EC/GT/CL pasará a ser una matriz multi-país
const STOCK = [
  { sku: 'VC-COLAGENO-30', name: 'Colágeno hidrolizado 30g', warehouse: 'Bogotá Central', qty: 4, min: 20, in: 50, out: 46 },
  { sku: 'VC-OMEGA-60', name: 'Omega 3 · 60 cápsulas', warehouse: 'Bogotá Central', qty: 7, min: 25, in: 80, out: 73 },
  { sku: 'VC-MACA-200', name: 'Maca andina 200g', warehouse: 'Medellín Norte', qty: 11, min: 15, in: 40, out: 29 },
  { sku: 'VC-MORINGA-500', name: 'Moringa premium 500g', warehouse: 'Bogotá Central', qty: 24, min: 15, in: 60, out: 36 },
  { sku: 'VC-ASHWA-90', name: 'Ashwagandha 90 cápsulas', warehouse: 'Cali Sur', qty: 18, min: 10, in: 30, out: 12 },
  { sku: 'VC-SPIRU-150', name: 'Espirulina 150g', warehouse: 'Bogotá Central', qty: 32, min: 20, in: 50, out: 18 },
]

export default function StockPage() {
  return (
    <>
      <AdminTopbar
        title="Stock"
        subtitle="Inventario por bodega · 🇨🇴 Colombia"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="SKUs en stock"
            value="142"
            icon={<Warehouse size={18} />}
            color="lime"
          />
          <StatCard
            label="Bajo mínimo"
            value="9"
            icon={<AlertTriangle size={18} />}
            color="warn"
          />
          <StatCard
            label="Agotados"
            value="2"
            icon={<TrendingDown size={18} />}
            color="error"
          />
        </div>

        <div className="vc-card overflow-x-auto">
          <h2
            className="mb-4 text-base font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Inventario Colombia
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-wider"
                style={{
                  color: 'var(--vc-gray-mid)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <th className="py-2">SKU</th>
                <th className="py-2">Producto</th>
                <th className="py-2">Bodega</th>
                <th className="py-2 text-right">Mínimo</th>
                <th className="py-2 text-right">Disponible</th>
                <th className="py-2 text-right">Entradas</th>
                <th className="py-2 text-right">Salidas</th>
              </tr>
            </thead>
            <tbody>
              {STOCK.map((s) => {
                const low = s.qty < s.min
                return (
                  <tr
                    key={s.sku}
                    className="text-xs"
                    style={{
                      borderTop: '1px solid var(--vc-gray-dark)',
                      color: 'var(--vc-white-dim)',
                    }}
                  >
                    <td
                      className="py-3 font-mono"
                      style={{ color: 'var(--vc-gray-mid)' }}
                    >
                      {s.sku}
                    </td>
                    <td
                      className="py-3 font-semibold"
                      style={{ color: 'var(--vc-white-soft)' }}
                    >
                      {s.name}
                    </td>
                    <td className="py-3">{s.warehouse}</td>
                    <td className="py-3 text-right font-mono">{s.min}</td>
                    <td
                      className="py-3 text-right font-mono font-bold"
                      style={{
                        color: low ? 'var(--vc-error)' : 'var(--vc-lime-main)',
                      }}
                    >
                      {s.qty}
                    </td>
                    <td
                      className="py-3 text-right font-mono"
                      style={{ color: 'var(--vc-lime-main)' }}
                    >
                      +{s.in}
                    </td>
                    <td
                      className="py-3 text-right font-mono"
                      style={{ color: 'var(--vc-error)' }}
                    >
                      -{s.out}
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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: 'lime' | 'warn' | 'error'
}) {
  const colors = {
    lime: { bg: 'rgba(198, 255, 60, 0.12)', fg: 'var(--vc-lime-main)', border: 'rgba(198, 255, 60, 0.3)' },
    warn: { bg: 'rgba(255, 184, 0, 0.12)', fg: 'var(--vc-warning)', border: 'rgba(255, 184, 0, 0.3)' },
    error: { bg: 'rgba(255, 71, 87, 0.12)', fg: 'var(--vc-error)', border: 'rgba(255, 71, 87, 0.3)' },
  }[color]
  return (
    <div className="vc-card flex items-center gap-4">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          background: colors.bg,
          color: colors.fg,
          border: `1px solid ${colors.border}`,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-[10px] uppercase tracking-wider"
          style={{
            color: 'var(--vc-gray-mid)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {label}
        </p>
        <p
          className="text-2xl font-black"
          style={{
            color: 'var(--vc-white-soft)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
