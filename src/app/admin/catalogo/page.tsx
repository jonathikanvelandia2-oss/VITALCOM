import { Plus, Filter, Package } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Catálogo maestro Vitalcom — gestión de productos
// Por ahora solo Colombia. En fase 2 se replica multi-país.
const PRODUCTS = [
  {
    sku: 'VC-COLAGENO-30',
    name: 'Colágeno hidrolizado 30g',
    cat: 'Suplementos',
    base: '$ 45.000',
    sug: '$ 89.000',
    stock: 4,
    status: 'Activo',
    bestseller: true,
  },
  {
    sku: 'VC-OMEGA-60',
    name: 'Omega 3 · 60 cápsulas',
    cat: 'Suplementos',
    base: '$ 38.000',
    sug: '$ 75.000',
    stock: 7,
    status: 'Activo',
    bestseller: false,
  },
  {
    sku: 'VC-MACA-200',
    name: 'Maca andina 200g',
    cat: 'Superalimentos',
    base: '$ 32.000',
    sug: '$ 68.000',
    stock: 11,
    status: 'Activo',
    bestseller: true,
  },
  {
    sku: 'VC-MORINGA-500',
    name: 'Moringa premium 500g',
    cat: 'Superalimentos',
    base: '$ 28.000',
    sug: '$ 60.000',
    stock: 24,
    status: 'Activo',
    bestseller: false,
  },
  {
    sku: 'VC-ASHWA-90',
    name: 'Ashwagandha 90 cápsulas',
    cat: 'Adaptógenos',
    base: '$ 52.000',
    sug: '$ 99.000',
    stock: 18,
    status: 'Activo',
    bestseller: true,
  },
]

export default function CatalogoPage() {
  return (
    <>
      <AdminTopbar
        title="Catálogo maestro"
        subtitle="Gestión de productos · 142 activos · 🇨🇴"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-dim)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <Filter size={14} /> Filtrar
            </button>
            <select
              className="rounded-lg px-3 py-2 text-xs"
              style={{
                background: 'var(--vc-black-mid)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-dim)',
              }}
            >
              <option>Todas las categorías</option>
              <option>Suplementos</option>
              <option>Superalimentos</option>
              <option>Adaptógenos</option>
            </select>
          </div>
          <button className="vc-btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo producto
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
                <th className="py-3">Producto</th>
                <th className="py-3">Categoría</th>
                <th className="py-3">Precio base</th>
                <th className="py-3">Precio sugerido</th>
                <th className="py-3">Stock CO</th>
                <th className="py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p) => (
                <tr
                  key={p.sku}
                  className="text-xs"
                  style={{
                    borderTop: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-dim)',
                  }}
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          background: 'rgba(198, 255, 60, 0.1)',
                          border: '1px solid rgba(198, 255, 60, 0.25)',
                        }}
                      >
                        <Package size={16} color="var(--vc-lime-main)" />
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: 'var(--vc-white-soft)' }}
                        >
                          {p.name}
                          {p.bestseller && (
                            <span
                              className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold"
                              style={{
                                background: 'var(--vc-lime-main)',
                                color: 'var(--vc-black)',
                              }}
                            >
                              BESTSELLER
                            </span>
                          )}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{
                            color: 'var(--vc-gray-mid)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {p.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">{p.cat}</td>
                  <td
                    className="py-4 font-mono"
                    style={{ color: 'var(--vc-white-soft)' }}
                  >
                    {p.base}
                  </td>
                  <td
                    className="py-4 font-mono"
                    style={{ color: 'var(--vc-lime-main)' }}
                  >
                    {p.sug}
                  </td>
                  <td className="py-4">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background:
                          p.stock < 10
                            ? 'rgba(255, 71, 87, 0.15)'
                            : 'rgba(198, 255, 60, 0.12)',
                        color:
                          p.stock < 10
                            ? 'var(--vc-error)'
                            : 'var(--vc-lime-main)',
                        border:
                          p.stock < 10
                            ? '1px solid rgba(255, 71, 87, 0.4)'
                            : '1px solid rgba(198, 255, 60, 0.3)',
                      }}
                    >
                      {p.stock} uds
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      style={{
                        color: 'var(--vc-lime-main)',
                        fontWeight: 600,
                      }}
                    >
                      ● {p.status}
                    </span>
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
