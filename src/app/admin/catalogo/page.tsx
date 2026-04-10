'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Package } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { CATALOG, CATEGORIES, getCatalogStats, getMargin } from '@/lib/catalog/products'
import type { ProductCategory } from '@/lib/catalog/products'

export default function CatalogoPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'Todas'>('Todas')
  const stats = getCatalogStats()

  const filtered = useMemo(() => {
    return CATALOG.filter(p => {
      if (category !== 'Todas' && p.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.tags.some(t => t.includes(q))
      }
      return true
    })
  }, [search, category])

  return (
    <>
      <AdminTopbar
        title="Catálogo maestro"
        subtitle={`${stats.totalProducts} activos · ${stats.totalBestsellers} bestsellers · ${stats.categories} categorías`}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar SKU, nombre o tag..."
                className="rounded-lg py-2 pl-9 pr-3 text-xs outline-none" style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)', width: 250 }} />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)}
              className="rounded-lg px-3 py-2 text-xs outline-none" style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
              <option value="Todas">Todas las categorías</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="vc-btn-primary flex items-center gap-2 text-xs"><Plus size={16} /> Nuevo producto</button>
        </div>

        <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>{filtered.length} productos</p>

        <div className="vc-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                <th className="py-3">Producto</th>
                <th className="py-3">Categoría</th>
                <th className="py-3">P. Público</th>
                <th className="py-3">P. Comunidad</th>
                <th className="py-3">P. Privado</th>
                <th className="py-3">Margen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const margin = getMargin(p)
                return (
                  <tr key={p.sku} className="text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(198,255,60,0.1)', border: '1px solid rgba(198,255,60,0.25)' }}>
                          <Package size={16} color="var(--vc-lime-main)" />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                            {p.name}
                            {p.bestseller && <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}>BEST</span>}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{p.category}</td>
                    <td className="py-4 font-mono" style={{ color: 'var(--vc-white-soft)' }}>$ {p.precioPublico.toLocaleString('es-CO')}</td>
                    <td className="py-4 font-mono" style={{ color: 'var(--vc-lime-main)' }}>$ {p.precioComunidad.toLocaleString('es-CO')}</td>
                    <td className="py-4 font-mono" style={{ color: 'var(--vc-white-dim)' }}>$ {p.precioPrivado.toLocaleString('es-CO')}</td>
                    <td className="py-4"><span className="font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{margin.percent}%</span></td>
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
