'use client'

import { useState, useMemo } from 'react'
import { Package, ShoppingCart, Search, Star, Filter, TrendingUp } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { CATALOG, CATEGORIES, getMargin, getCatalogStats } from '@/lib/catalog/products'
import type { ProductCategory } from '@/lib/catalog/products'

// ── Catálogo navegable para dropshippers ────────────────
// 30 productos en 7 categorías con búsqueda y filtros.
// Datos desde src/lib/catalog/products.ts (fuente única)

export default function CatalogoComunidadPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'Todos' | 'Bestsellers'>('Todos')
  const stats = getCatalogStats()

  const filtered = useMemo(() => {
    return CATALOG.filter(p => {
      if (!p.active) return false
      if (category === 'Bestsellers') return p.bestseller
      if (category !== 'Todos' && p.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)) || p.sku.toLowerCase().includes(q)
      }
      return true
    })
  }, [search, category])

  return (
    <>
      <CommunityTopbar
        title="Catálogo Vitalcom"
        subtitle={`${stats.totalProducts} productos · ${stats.categories} categorías · Colombia`}
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats rápidas */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Productos" value={stats.totalProducts} />
          <MiniStat label="Bestsellers" value={stats.totalBestsellers} />
          <MiniStat label="Rating promedio" value={stats.avgRating} />
          <MiniStat label="Bajo stock" value={stats.lowStock} warning />
        </div>

        {/* Búsqueda y filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, categoría o tag..."
              className="w-full rounded-lg py-2.5 pl-10 pr-3 text-xs outline-none"
              style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
          </div>
          {['Todos', 'Bestsellers', ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c as any)}
              className="rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all"
              style={{
                background: category === c ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                color: category === c ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                border: category === c ? 'none' : '1px solid var(--vc-gray-dark)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Resultado */}
        <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grid de productos */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const margin = getMargin(p)
            return (
              <article key={p.sku} className="vc-card group flex flex-col">
                {/* Imagen placeholder */}
                <div
                  className="relative mb-4 flex h-36 items-center justify-center rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(198,255,60,0.08) 0%, rgba(168,255,0,0.15) 100%)',
                    border: '1px solid rgba(198, 255, 60, 0.15)',
                  }}
                >
                  <Package size={40} color="var(--vc-lime-main)" />
                  {p.bestseller && (
                    <span className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}>
                      Bestseller
                    </span>
                  )}
                  <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                    {margin.percent}% margen
                  </span>
                </div>

                {/* Categoría */}
                <p className="mb-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  {p.category} · {p.sku}
                </p>

                {/* Nombre */}
                <h3 className="mb-1 text-sm font-bold leading-snug" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  {p.name}
                </h3>

                {/* Descripción */}
                <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                  {p.description}
                </p>

                {/* Rating y vendidos */}
                <div className="mb-3 flex items-center gap-3 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                  <span className="flex items-center gap-1">
                    <Star size={11} fill="var(--vc-lime-main)" color="var(--vc-lime-main)" /> {p.rating}
                  </span>
                  <span>{p.sold.toLocaleString('es-CO')} vendidos</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{
                      background: p.stockCO < 50 ? 'rgba(255,71,87,0.12)' : 'rgba(198,255,60,0.08)',
                      color: p.stockCO < 50 ? 'var(--vc-error)' : 'var(--vc-lime-main)',
                    }}
                  >
                    {p.stockCO} en stock
                  </span>
                </div>

                {/* Precios */}
                <div className="mt-auto space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase" style={{ color: 'var(--vc-gray-mid)' }}>Tu costo</p>
                      <p className="font-mono text-sm font-bold" style={{ color: 'var(--vc-white-soft)' }}>
                        $ {p.basePrice.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase" style={{ color: 'var(--vc-gray-mid)' }}>Ganancia</p>
                      <p className="font-mono text-sm font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                        $ {margin.value.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase" style={{ color: 'var(--vc-gray-mid)' }}>Sugerido</p>
                      <p className="font-mono text-base font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                        $ {p.suggestedPrice.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <button className="vc-btn-primary flex w-full items-center justify-center gap-2 text-xs">
                    <ShoppingCart size={14} /> Agregar a mi tienda
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </>
  )
}

function MiniStat({ label, value, warning }: { label: string; value: number; warning?: boolean }) {
  return (
    <div className="vc-card text-center" style={{ padding: '0.75rem' }}>
      <p className="text-xl font-black" style={{ color: warning ? 'var(--vc-warning)' : 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>{label}</p>
    </div>
  )
}
