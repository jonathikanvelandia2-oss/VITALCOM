'use client'

import { useState } from 'react'
import { Warehouse, AlertTriangle, TrendingDown, Search, Loader2, Save } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useStock, useUpdateStock } from '@/hooks/useStock'

const COUNTRIES = [
  { code: 'CO', label: 'Colombia', flag: '🇨🇴' },
  { code: 'EC', label: 'Ecuador', flag: '🇪🇨' },
  { code: 'GT', label: 'Guatemala', flag: '🇬🇹' },
  { code: 'CL', label: 'Chile', flag: '🇨🇱' },
] as const

export default function StockPage() {
  const [country, setCountry] = useState<string>('CO')
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useStock({
    country: country as any,
    search: search || undefined,
    limit: 100,
  })

  const items = data?.stock ?? []
  const total = data?.pagination?.total ?? 0

  // Stats calculadas desde datos reales
  const lowStock = items.filter((s: any) => s.quantity > 0 && s.quantity < 10).length
  const outOfStock = items.filter((s: any) => s.quantity === 0).length
  const inStock = items.filter((s: any) => s.quantity > 0).length

  const selectedCountry = COUNTRIES.find(c => c.code === country)

  return (
    <>
      <AdminTopbar
        title="Stock"
        subtitle={isLoading ? 'Cargando...' : `Inventario por bodega · ${selectedCountry?.flag} ${selectedCountry?.label}`}
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Selector de país */}
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => setCountry(c.code)}
              className="rounded-full px-4 py-2 text-xs font-semibold transition-all"
              style={{
                background: country === c.code ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                color: country === c.code ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                border: country === c.code ? 'none' : '1px solid var(--vc-gray-dark)',
                fontFamily: 'var(--font-heading)',
              }}>
              {c.flag} {c.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="SKUs en stock" value={String(inStock)} icon={<Warehouse size={18} />} color="lime" />
          <StatCard label="Bajo mínimo (<10)" value={String(lowStock)} icon={<AlertTriangle size={18} />} color="warn" />
          <StatCard label="Agotados" value={String(outOfStock)} icon={<TrendingDown size={18} />} color="error" />
        </div>

        {/* Búsqueda */}
        <div className="relative" style={{ maxWidth: 300 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto o SKU..."
            className="w-full rounded-lg py-2.5 pl-9 pr-3 text-xs outline-none"
            style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
        </div>

        {error && (
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
            <p className="text-xs" style={{ color: 'var(--vc-error)' }}>Error: {(error as Error).message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <div className="vc-card overflow-x-auto">
            <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Inventario {selectedCountry?.label} ({total} productos)
            </h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Producto</th>
                  <th className="py-2">Bodega</th>
                  <th className="py-2 text-right">Disponible</th>
                  <th className="py-2 text-right">Editar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s: any) => (
                  <StockRow key={s.id} item={s} country={country} />
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                      No hay registros de stock para {selectedCountry?.label}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ── Fila de stock con edición inline ────────────────────
function StockRow({ item, country }: { item: any; country: string }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(item.quantity)
  const [warehouse, setWarehouse] = useState(item.warehouse ?? '')
  const update = useUpdateStock()

  const low = item.quantity < 10 && item.quantity > 0

  async function handleSave() {
    await update.mutateAsync({
      productId: item.product.id,
      country: country as any,
      quantity: qty,
      warehouse: warehouse || undefined,
    })
    setEditing(false)
  }

  const inputStyle = { background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }

  return (
    <tr className="text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
      <td className="py-3 font-mono" style={{ color: 'var(--vc-gray-mid)' }}>{item.product.sku}</td>
      <td className="py-3 font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{item.product.name}</td>
      <td className="py-3">
        {editing ? (
          <input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} placeholder="Bodega..."
            className="rounded px-2 py-1 text-xs outline-none" style={{ ...inputStyle, width: 140 }} />
        ) : (
          item.warehouse || '—'
        )}
      </td>
      <td className="py-3 text-right">
        {editing ? (
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={0}
            className="w-20 rounded px-2 py-1 text-right text-xs outline-none" style={inputStyle} />
        ) : (
          <span className="font-mono font-bold" style={{ color: item.quantity === 0 ? 'var(--vc-error)' : low ? 'var(--vc-warning)' : 'var(--vc-lime-main)' }}>
            {item.quantity}
          </span>
        )}
      </td>
      <td className="py-3 text-right">
        {editing ? (
          <button onClick={handleSave} disabled={update.isPending}
            className="rounded-lg p-1.5" style={{ background: 'rgba(198,255,60,0.1)' }}>
            {update.isPending ? <Loader2 size={13} className="animate-spin" color="var(--vc-lime-main)" /> : <Save size={13} color="var(--vc-lime-main)" />}
          </button>
        ) : (
          <button onClick={() => setEditing(true)}
            className="rounded-lg px-3 py-1 text-[10px] font-semibold transition-colors"
            style={{ background: 'rgba(198,255,60,0.08)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
            Editar
          </button>
        )}
      </td>
    </tr>
  )
}

// ── StatCard ────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'lime' | 'warn' | 'error' }) {
  const colors = {
    lime: { bg: 'rgba(198, 255, 60, 0.12)', fg: 'var(--vc-lime-main)', border: 'rgba(198, 255, 60, 0.3)' },
    warn: { bg: 'rgba(255, 184, 0, 0.12)', fg: 'var(--vc-warning)', border: 'rgba(255, 184, 0, 0.3)' },
    error: { bg: 'rgba(255, 71, 87, 0.12)', fg: 'var(--vc-error)', border: 'rgba(255, 71, 87, 0.3)' },
  }[color]
  return (
    <div className="vc-card flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: colors.bg, color: colors.fg, border: `1px solid ${colors.border}` }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
        <p className="text-2xl font-black" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>{value}</p>
      </div>
    </div>
  )
}
