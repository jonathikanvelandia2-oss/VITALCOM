import { Package, ShoppingCart, Search, Star } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// Catálogo público navegable para los miembros / dropshippers
const PRODUCTS = [
  { sku: 'VC-COLAGENO-30', name: 'Colágeno hidrolizado 30g', cat: 'Suplementos', base: 45000, sug: 89000, rating: 4.9, sold: 1240, bestseller: true },
  { sku: 'VC-OMEGA-60', name: 'Omega 3 · 60 cápsulas', cat: 'Suplementos', base: 38000, sug: 75000, rating: 4.8, sold: 890, bestseller: false },
  { sku: 'VC-MACA-200', name: 'Maca andina 200g', cat: 'Superalimentos', base: 32000, sug: 68000, rating: 4.7, sold: 760, bestseller: true },
  { sku: 'VC-MORINGA-500', name: 'Moringa premium 500g', cat: 'Superalimentos', base: 28000, sug: 60000, rating: 4.6, sold: 540, bestseller: false },
  { sku: 'VC-ASHWA-90', name: 'Ashwagandha 90 cápsulas', cat: 'Adaptógenos', base: 52000, sug: 99000, rating: 4.9, sold: 1090, bestseller: true },
  { sku: 'VC-SPIRU-150', name: 'Espirulina 150g', cat: 'Superalimentos', base: 35000, sug: 70000, rating: 4.7, sold: 420, bestseller: false },
]

export default function CatalogoComunidadPage() {
  return (
    <>
      <CommunityTopbar
        title="Catálogo Vitalcom"
        subtitle="Productos disponibles para venta · 🇨🇴 Colombia"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px solid var(--vc-gray-dark)',
              minWidth: 280,
            }}
          >
            <Search size={14} color="var(--vc-gray-mid)" />
            <input
              placeholder="Buscar productos..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: 'var(--vc-white-soft)' }}
            />
          </div>
          {['Todos', 'Suplementos', 'Superalimentos', 'Adaptógenos', 'Bestsellers'].map((c, i) => (
            <button
              key={c}
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                background: i === 0 ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                color: i === 0 ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                border: i === 0 ? 'none' : '1px solid var(--vc-gray-dark)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {PRODUCTS.map((p) => (
            <article
              key={p.sku}
              className="vc-card group flex flex-col"
            >
              <div
                className="relative mb-4 flex h-36 items-center justify-center rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(198,255,60,0.1) 0%, rgba(168,255,0,0.18) 100%)',
                  border: '1px solid rgba(198, 255, 60, 0.2)',
                }}
              >
                <Package size={48} color="var(--vc-lime-main)" />
                {p.bestseller && (
                  <span
                    className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                    style={{
                      background: 'var(--vc-lime-main)',
                      color: 'var(--vc-black)',
                    }}
                  >
                    Bestseller
                  </span>
                )}
              </div>

              <p
                className="mb-1 text-[10px] uppercase tracking-wider"
                style={{
                  color: 'var(--vc-gray-mid)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {p.cat}
              </p>
              <h3
                className="mb-2 text-base font-bold leading-snug"
                style={{
                  color: 'var(--vc-white-soft)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {p.name}
              </h3>

              <div
                className="mb-3 flex items-center gap-3 text-[11px]"
                style={{ color: 'var(--vc-white-dim)' }}
              >
                <span className="flex items-center gap-1">
                  <Star size={11} fill="var(--vc-lime-main)" color="var(--vc-lime-main)" />
                  {p.rating}
                </span>
                <span>{p.sold} vendidos</span>
              </div>

              <div className="mt-auto space-y-2">
                <div className="flex items-end justify-between">
                  <div>
                    <p
                      className="text-[10px] uppercase"
                      style={{ color: 'var(--vc-gray-mid)' }}
                    >
                      Tu costo
                    </p>
                    <p
                      className="font-mono text-sm font-bold"
                      style={{ color: 'var(--vc-white-soft)' }}
                    >
                      $ {p.base.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-[10px] uppercase"
                      style={{ color: 'var(--vc-gray-mid)' }}
                    >
                      Sugerido
                    </p>
                    <p
                      className="font-mono text-base font-bold"
                      style={{ color: 'var(--vc-lime-main)' }}
                    >
                      $ {p.sug.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
                <button className="vc-btn-primary flex w-full items-center justify-center gap-2">
                  <ShoppingCart size={14} /> Agregar a mi tienda
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
