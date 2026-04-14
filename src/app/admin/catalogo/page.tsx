'use client'

import { useState } from 'react'
import { Plus, Search, Package, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts'
import type { CreateProductInput } from '@/lib/api/schemas/product'

const CATEGORIES = ['Polvos', 'Líquidos', 'Gummis', 'Cápsulas', 'Cremas', 'Línea Mascotas'] as const

export default function CatalogoPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const { data, isLoading, error } = useProducts({
    search: search || undefined,
    category: (category || undefined) as any,
    limit: 100,
  })

  const products = data?.products ?? []
  const total = data?.pagination?.total ?? 0

  // Stats calculadas desde datos reales
  const totalBestsellers = products.filter((p: any) => p.bestseller).length
  const categoriesSet = new Set(products.map((p: any) => p.category).filter(Boolean))

  return (
    <>
      <AdminTopbar
        title="Catálogo maestro"
        subtitle={isLoading ? 'Cargando...' : `${total} productos · ${totalBestsellers} bestsellers · ${categoriesSet.size} categorías`}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar SKU, nombre o tag..."
                className="rounded-lg py-2 pl-9 pr-3 text-xs outline-none" style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)', width: 250 }} />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg px-3 py-2 text-xs outline-none" style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
              <option value="">Todas las categorías</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={() => { setEditId(null); setShowForm(true) }} className="vc-btn-primary flex items-center gap-2 text-xs">
            <Plus size={16} /> Nuevo producto
          </button>
        </div>

        {error && (
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
            <p className="text-xs" style={{ color: 'var(--vc-error)' }}>Error: {(error as Error).message}</p>
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>{products.length} productos</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
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
                  <th className="py-3">Stock CO</th>
                  <th className="py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => {
                  const margin = p.precioPublico > 0
                    ? Math.round(((p.precioPublico - p.precioComunidad) / p.precioPublico) * 100)
                    : 0
                  const stockCO = p.stock?.find((s: any) => s.country === 'CO')?.quantity ?? 0
                  return (
                    <tr key={p.id} className="text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(198,255,60,0.1)', border: '1px solid rgba(198,255,60,0.25)' }}>
                            <Package size={16} color="var(--vc-lime-main)" />
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: p.active ? 'var(--vc-white-soft)' : 'var(--vc-gray-mid)' }}>
                              {p.name}
                              {p.bestseller && <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}>BEST</span>}
                              {!p.active && <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: 'var(--vc-error)', color: 'white' }}>INACTIVO</span>}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">{p.category}</td>
                      <td className="py-4 font-mono" style={{ color: 'var(--vc-white-soft)' }}>$ {p.precioPublico.toLocaleString('es-CO')}</td>
                      <td className="py-4 font-mono" style={{ color: 'var(--vc-lime-main)' }}>$ {p.precioComunidad.toLocaleString('es-CO')}</td>
                      <td className="py-4 font-mono" style={{ color: 'var(--vc-white-dim)' }}>$ {p.precioPrivado.toLocaleString('es-CO')}</td>
                      <td className="py-4"><span className="font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{margin}%</span></td>
                      <td className="py-4 font-mono" style={{ color: stockCO > 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}>{stockCO}</td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditId(p.id); setShowForm(true) }}
                            className="rounded-lg p-1.5 transition-colors hover:opacity-80"
                            style={{ background: 'rgba(198,255,60,0.1)' }}>
                            <Pencil size={13} color="var(--vc-lime-main)" />
                          </button>
                          <DeleteButton id={p.id} name={p.name} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ProductFormModal
          editId={editId}
          products={products}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}

// ── Botón de eliminar con confirmación ──────────────────
function DeleteButton({ id, name }: { id: string; name: string }) {
  const del = useDeleteProduct()
  return (
    <button
      onClick={() => {
        if (confirm(`¿Desactivar "${name}"?`)) del.mutate(id)
      }}
      disabled={del.isPending}
      className="rounded-lg p-1.5 transition-colors hover:opacity-80"
      style={{ background: 'rgba(255,71,87,0.1)' }}
    >
      <Trash2 size={13} color="var(--vc-error)" />
    </button>
  )
}

// ── Modal de crear/editar producto ──────────────────────
function ProductFormModal({
  editId,
  products,
  onClose,
}: {
  editId: string | null
  products: any[]
  onClose: () => void
}) {
  const existing = editId ? products.find((p: any) => p.id === editId) : null
  const create = useCreateProduct()
  const update = useUpdateProduct()

  const [form, setForm] = useState<Partial<CreateProductInput>>({
    sku: existing?.sku ?? '',
    name: existing?.name ?? '',
    category: existing?.category ?? undefined,
    precioPublico: existing?.precioPublico ?? 0,
    precioComunidad: existing?.precioComunidad ?? 0,
    precioPrivado: existing?.precioPrivado ?? 0,
    active: existing?.active ?? true,
    bestseller: existing?.bestseller ?? false,
    tags: existing?.tags ?? [],
  })
  const [tagsInput, setTagsInput] = useState((existing?.tags ?? []).join(', '))
  const [error, setError] = useState('')

  const isPending = create.isPending || update.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const tags = tagsInput.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
    const data = { ...form, tags } as CreateProductInput

    try {
      if (editId) {
        await update.mutateAsync({ id: editId, data })
      } else {
        await create.mutateAsync(data)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    }
  }

  const inputStyle = { background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }
  const labelStyle = { color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="vc-card w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            {editId ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--vc-gray-mid)' }} /></button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg p-3" style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
            <p className="text-xs" style={{ color: 'var(--vc-error)' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={labelStyle}>SKU</label>
              <input value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))}
                required className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={labelStyle}>Categoría</label>
              <select value={form.category ?? ''} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as any }))}
                className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle}>
                <option value="">Sin categoría</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={labelStyle}>Nombre</label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              required className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={labelStyle}>P. Público</label>
              <input type="number" value={form.precioPublico || ''} onChange={(e) => setForm(f => ({ ...f, precioPublico: Number(e.target.value) }))}
                required className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={labelStyle}>P. Comunidad</label>
              <input type="number" value={form.precioComunidad || ''} onChange={(e) => setForm(f => ({ ...f, precioComunidad: Number(e.target.value) }))}
                required className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={labelStyle}>P. Privado</label>
              <input type="number" value={form.precioPrivado || ''} onChange={(e) => setForm(f => ({ ...f, precioPrivado: Number(e.target.value) }))}
                required className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider" style={labelStyle}>Tags (separados por coma)</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
              placeholder="colágeno, salud, bienestar" className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} className="accent-[--vc-lime-main]" />
              Activo
            </label>
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
              <input type="checkbox" checked={form.bestseller} onChange={(e) => setForm(f => ({ ...f, bestseller: e.target.checked }))} className="accent-[--vc-lime-main]" />
              Bestseller
            </label>
          </div>

          <button type="submit" disabled={isPending} className="vc-btn-primary w-full">
            {isPending ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </form>
      </div>
    </div>
  )
}
