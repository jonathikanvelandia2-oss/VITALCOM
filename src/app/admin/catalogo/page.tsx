'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { Plus, Search, Package, Pencil, Trash2, X, Loader2, Camera, ImageOff, UploadCloud } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts'
import type { CreateProductInput } from '@/lib/api/schemas/product'

const CATEGORIES = ['Polvos', 'Líquidos', 'Gummis', 'Cápsulas', 'Cremas', 'Línea Mascotas'] as const

export default function CatalogoPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [imageUploadId, setImageUploadId] = useState<string | null>(null)

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
                    <>
                    <tr key={p.id} className="text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {/* Miniatura de imagen del producto — muestra la primera imagen o icono Package */}
                          {p.images?.[0] ? (
                            <button
                              onClick={() => setImageUploadId(imageUploadId === p.id ? null : p.id)}
                              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden transition-opacity hover:opacity-80"
                              style={{ border: '1px solid rgba(198,255,60,0.25)' }}
                              title="Gestionar imágenes"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                              <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                style={{ background: 'rgba(0,0,0,0.6)' }}>
                                <Camera size={12} color="var(--vc-lime-main)" />
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setImageUploadId(imageUploadId === p.id ? null : p.id)}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                              style={{ background: 'rgba(198,255,60,0.1)', border: '1px solid rgba(198,255,60,0.25)' }}
                              title="Subir imagen"
                            >
                              <Package size={16} color="var(--vc-lime-main)" />
                            </button>
                          )}
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
                          {/* Botón de imágenes */}
                          <button
                            onClick={() => setImageUploadId(imageUploadId === p.id ? null : p.id)}
                            className="rounded-lg p-1.5 transition-colors hover:opacity-80"
                            style={{ background: imageUploadId === p.id ? 'rgba(198,255,60,0.25)' : 'rgba(198,255,60,0.1)' }}
                            title="Gestionar imágenes"
                          >
                            <Camera size={13} color="var(--vc-lime-main)" />
                          </button>
                          <button onClick={() => { setEditId(p.id); setShowForm(true) }}
                            className="rounded-lg p-1.5 transition-colors hover:opacity-80"
                            style={{ background: 'rgba(198,255,60,0.1)' }}>
                            <Pencil size={13} color="var(--vc-lime-main)" />
                          </button>
                          <DeleteButton id={p.id} name={p.name} />
                        </div>
                      </td>
                    </tr>
                    {/* Panel de imágenes inline — se muestra debajo de la fila activa */}
                    {imageUploadId === p.id && (
                      <tr key={`${p.id}-images`}>
                        <td colSpan={8} style={{ background: 'var(--vc-black-soft)', borderTop: 'none', padding: 0 }}>
                          <ImageUploadPanel
                            product={p}
                            onClose={() => setImageUploadId(null)}
                          />
                        </td>
                      </tr>
                    )}
                    </>
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

// ── Panel inline de gestión de imágenes ────────────────
function ImageUploadPanel({ product, onClose }: { product: any; onClose: () => void }) {
  const update = useUpdateProduct()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Imágenes actuales del producto
  const images = useMemo<string[]>(() => product.images ?? [], [product.images])

  // Subir archivo al endpoint /api/upload y luego actualizar imágenes del producto
  const uploadFile = useCallback(async (file: File) => {
    setUploadError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'products')
      fd.append('folder', product.sku || product.id)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()

      if (!json.ok) throw new Error(json.error || 'Error al subir imagen')

      // Agregar la nueva URL al array images del producto
      const newImages = [...images, json.data.url]
      await update.mutateAsync({ id: product.id, data: { images: newImages } as any })
    } catch (err: any) {
      setUploadError(err.message || 'Error desconocido')
    } finally {
      setUploading(false)
    }
  }, [images, product.id, product.sku, update])

  // Eliminar imagen del array
  async function removeImage(url: string) {
    const newImages = images.filter((img) => img !== url)
    await update.mutateAsync({ id: product.id, data: { images: newImages } as any })
  }

  // Manejo de drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // Resetear input para permitir re-subir el mismo archivo
    e.target.value = ''
  }

  return (
    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--vc-gray-dark)' }}>
      {/* Cabecera del panel */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
          Imágenes · {product.name}
        </span>
        <button onClick={onClose} className="rounded p-0.5 hover:opacity-70">
          <X size={13} style={{ color: 'var(--vc-gray-mid)' }} />
        </button>
      </div>

      {/* Error de upload */}
      {uploadError && (
        <div className="mb-2 rounded-lg p-2" style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
          <p className="text-[10px]" style={{ color: 'var(--vc-error)' }}>{uploadError}</p>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-3">
        {/* Miniaturas existentes */}
        {images.map((url, idx) => (
          <div key={url} className="group relative flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Imagen ${idx + 1}`}
              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(198,255,60,0.25)', display: 'block' }}
            />
            {/* Botón eliminar — aparece al hover */}
            <button
              onClick={() => removeImage(url)}
              disabled={update.isPending}
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'var(--vc-error)' }}
              title="Eliminar imagen"
            >
              <X size={9} color="white" />
            </button>
          </div>
        ))}

        {/* Sin imágenes — mensaje vacío */}
        {images.length === 0 && !uploading && (
          <div className="flex items-center gap-1.5">
            <ImageOff size={13} style={{ color: 'var(--vc-gray-mid)' }} />
            <span className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>Sin imágenes</span>
          </div>
        )}

        {/* Spinner mientras sube */}
        {uploading && (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ border: '1px dashed rgba(198,255,60,0.4)', background: 'rgba(198,255,60,0.05)' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        )}

        {/* Zona de drag-and-drop / botón subir */}
        {!uploading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg transition-colors"
            style={{
              border: dragOver ? '1px dashed var(--vc-lime-main)' : '1px dashed rgba(198,255,60,0.35)',
              background: dragOver ? 'rgba(198,255,60,0.12)' : 'rgba(198,255,60,0.04)',
              cursor: 'pointer',
            }}
            title="Subir imagen (JPG, PNG, WEBP · máx 5MB)"
          >
            <UploadCloud size={16} style={{ color: dragOver ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
            <span className="text-[9px] leading-none" style={{ color: dragOver ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }}>
              Subir
            </span>
          </button>
        )}
      </div>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Ayuda */}
      <p className="mt-2 text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>
        JPG · PNG · WEBP · máx 5MB · arrastra o haz clic en el cuadro
      </p>
    </div>
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
