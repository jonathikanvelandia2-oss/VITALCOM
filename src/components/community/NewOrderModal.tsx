'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  X, Plus, Minus, Search, Loader2, User, Mail, Phone, MapPin,
  Package, Trash2, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCreateOrder } from '@/hooks/useOrders'

// ── Modal Nuevo Pedido ──────────────────────────────────
// Flujo en 2 pasos: (1) productos + envío, (2) datos del cliente.
// Al confirmar hace POST /api/orders y refresca listado + P&G.

const COUNTRIES = [
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', defaultShipping: 12000 },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', defaultShipping: 15000 },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', defaultShipping: 18000 },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', defaultShipping: 22000 },
] as const

type LineItem = {
  productId: string
  sku: string
  name: string
  image: string | null
  unitPrice: number
  quantity: number
  precioComunidad: number
}

type CountryCode = (typeof COUNTRIES)[number]['code']

function formatCOP(n: number): string {
  return `$ ${Math.round(n).toLocaleString('es-CO')}`
}

export function NewOrderModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [country, setCountry] = useState<CountryCode>('CO')
  const [items, setItems] = useState<LineItem[]>([])
  const [shipping, setShipping] = useState(12000)
  const [customer, setCustomer] = useState({
    name: '', email: '', phone: '', address: '',
  })
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createOrder = useCreateOrder()

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  )
  const total = subtotal + shipping

  function addProduct(p: any) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [
        ...prev,
        {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          image: p.images?.[0] ?? null,
          unitPrice: p.precioComunidad,
          precioComunidad: p.precioComunidad,
          quantity: 1,
        },
      ]
    })
  }

  function updateQuantity(productId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0),
    )
  }

  function updatePrice(productId: string, price: number) {
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, unitPrice: price } : i))
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function handleCountryChange(code: CountryCode) {
    setCountry(code)
    const config = COUNTRIES.find((c) => c.code === code)
    if (config) setShipping(config.defaultShipping)
  }

  async function handleSubmit() {
    setError(null)
    if (items.length === 0) return setError('Agrega al menos un producto')
    if (!customer.name || !customer.email) return setError('Nombre y email son requeridos')

    createOrder.mutate(
      {
        source: 'DROPSHIPPER',
        country,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || undefined,
        customerAddress: customer.address || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shipping,
        notes: notes || undefined,
      },
      {
        onSuccess: () => onClose(),
        onError: (err: any) => setError(err.message || 'Error al crear pedido'),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
        style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.2)' }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--vc-gray-dark)' }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
              Paso {step} de 2
            </p>
            <h2 className="text-lg font-black"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              {step === 1 ? 'Productos + envío' : 'Datos del cliente'}
            </h2>
          </div>
          <button onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-dim)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 ? (
            <Step1 country={country} onCountryChange={handleCountryChange}
              items={items} onAdd={addProduct} onUpdateQty={updateQuantity}
              onUpdatePrice={updatePrice} onRemove={removeItem}
              shipping={shipping} onShippingChange={setShipping} />
          ) : (
            <Step2 customer={customer} onCustomerChange={setCustomer}
              notes={notes} onNotesChange={setNotes}
              items={items} shipping={shipping} subtotal={subtotal} total={total} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4" style={{ borderColor: 'var(--vc-gray-dark)' }}>
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
              <AlertCircle size={13} color="var(--vc-error)" />
              <p className="text-xs" style={{ color: 'var(--vc-error)' }}>{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                Total {items.length > 0 ? `(${items.length} productos)` : ''}
              </p>
              <p className="text-lg font-black font-mono" style={{ color: 'var(--vc-lime-main)' }}>
                {formatCOP(total)}
              </p>
            </div>
            <div className="flex gap-2">
              {step === 2 && (
                <button onClick={() => setStep(1)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold"
                  style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                  Atrás
                </button>
              )}
              {step === 1 ? (
                <button onClick={() => setStep(2)} disabled={items.length === 0}
                  className="vc-btn-primary flex items-center gap-2 text-xs disabled:opacity-40">
                  Continuar
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={createOrder.isPending}
                  className="vc-btn-primary flex items-center gap-2 text-xs disabled:opacity-40">
                  {createOrder.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Crear pedido
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Paso 1: productos + envío ───────────────────────────
function Step1({ country, onCountryChange, items, onAdd, onUpdateQty, onUpdatePrice, onRemove, shipping, onShippingChange }: {
  country: CountryCode
  onCountryChange: (c: CountryCode) => void
  items: LineItem[]
  onAdd: (p: any) => void
  onUpdateQty: (id: string, d: number) => void
  onUpdatePrice: (id: string, p: number) => void
  onRemove: (id: string) => void
  shipping: number
  onShippingChange: (n: number) => void
}) {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useProducts({ search, limit: 10, active: 'true' })
  const products = data?.products ?? []

  return (
    <div className="space-y-4">
      {/* País */}
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>País del cliente</label>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => (
            <button key={c.code} onClick={() => onCountryChange(c.code)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: country === c.code ? 'var(--vc-lime-main)' : 'var(--vc-black-soft)',
                color: country === c.code ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                border: country === c.code ? 'none' : '1px solid var(--vc-gray-dark)',
              }}>
              <span>{c.flag}</span> {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador productos */}
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>Agregar productos del catálogo Vitalcom</label>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
          <Search size={14} color="var(--vc-gray-mid)" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--vc-white-soft)' }} />
        </div>

        {search && (
          <div className="mt-2 max-h-60 overflow-y-auto rounded-lg"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={14} className="animate-spin" color="var(--vc-lime-main)" />
              </div>
            ) : products.length === 0 ? (
              <p className="py-4 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin resultados</p>
            ) : (
              products.map((p: any) => (
                <button key={p.id} onClick={() => onAdd(p)}
                  className="flex w-full items-center gap-3 border-b px-3 py-2 text-left transition-all hover:bg-[rgba(198,255,60,0.05)]"
                  style={{ borderColor: 'var(--vc-gray-dark)' }}>
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded"
                    style={{ background: 'var(--vc-black-mid)' }}>
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="36px" />
                    ) : (
                      <Package size={12} color="var(--vc-gray-mid)" className="absolute inset-0 m-auto" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{p.name}</p>
                    <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                      {p.sku} · {formatCOP(p.precioComunidad)}
                    </p>
                  </div>
                  <Plus size={14} color="var(--vc-lime-main)" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Items agregados */}
      {items.length > 0 && (
        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>Pedido ({items.length})</label>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="rounded-lg p-3"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                <div className="flex items-start gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded"
                    style={{ background: 'var(--vc-black-mid)' }}>
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <Package size={12} color="var(--vc-gray-mid)" className="absolute inset-0 m-auto" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{item.name}</p>
                    <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{item.sku}</p>
                  </div>
                  <button onClick={() => onRemove(item.productId)}
                    className="shrink-0 rounded p-1" style={{ color: 'var(--vc-error)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-[9px] uppercase" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>Cantidad</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onUpdateQty(item.productId, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded"
                        style={{ background: 'var(--vc-black-mid)', color: 'var(--vc-white-dim)' }}>
                        <Minus size={11} />
                      </button>
                      <span className="w-8 text-center font-mono text-sm font-bold" style={{ color: 'var(--vc-white-soft)' }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => onUpdateQty(item.productId, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded"
                        style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}>
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] uppercase" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>Precio de venta</p>
                    <input type="number" value={item.unitPrice}
                      onChange={(e) => onUpdatePrice(item.productId, Number(e.target.value))}
                      className="w-full rounded px-2 py-1 text-xs font-mono outline-none"
                      style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-lime-main)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Envío */}
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>Costo de envío (COP)</label>
        <input type="number" value={shipping} onChange={(e) => onShippingChange(Number(e.target.value))}
          className="w-full rounded-lg px-3 py-2 text-xs font-mono outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
      </div>
    </div>
  )
}

// ── Paso 2: cliente + resumen ───────────────────────────
function Step2({ customer, onCustomerChange, notes, onNotesChange, items, shipping, subtotal, total }: {
  customer: { name: string; email: string; phone: string; address: string }
  onCustomerChange: (c: typeof customer) => void
  notes: string
  onNotesChange: (n: string) => void
  items: LineItem[]
  shipping: number
  subtotal: number
  total: number
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3">
        <FormField icon={<User size={13} />} label="Nombre del cliente *"
          value={customer.name} onChange={(v) => onCustomerChange({ ...customer, name: v })} />
        <FormField icon={<Mail size={13} />} label="Email *"
          value={customer.email} onChange={(v) => onCustomerChange({ ...customer, email: v })} />
        <FormField icon={<Phone size={13} />} label="Teléfono"
          value={customer.phone} onChange={(v) => onCustomerChange({ ...customer, phone: v })} />
        <FormField icon={<MapPin size={13} />} label="Dirección" textarea
          value={customer.address} onChange={(v) => onCustomerChange({ ...customer, address: v })} />
        <FormField icon={null} label="Notas internas (opcional)" textarea
          value={notes} onChange={onNotesChange} />
      </div>

      <div>
        <p className="mb-2 text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>Resumen</p>
        <div className="rounded-lg p-4"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
          <div className="mb-3 space-y-1.5">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate" style={{ color: 'var(--vc-white-dim)' }}>
                  {i.name} <span style={{ color: 'var(--vc-gray-mid)' }}>×{i.quantity}</span>
                </span>
                <span className="font-mono font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                  {formatCOP(i.unitPrice * i.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t pt-3" style={{ borderColor: 'var(--vc-gray-dark)' }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--vc-white-dim)' }}>Subtotal</span>
              <span className="font-mono font-bold" style={{ color: 'var(--vc-white-soft)' }}>{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--vc-white-dim)' }}>Envío</span>
              <span className="font-mono font-bold" style={{ color: 'var(--vc-white-soft)' }}>{formatCOP(shipping)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 text-sm" style={{ borderColor: 'var(--vc-gray-dark)' }}>
              <span className="font-bold" style={{ color: 'var(--vc-white-soft)' }}>TOTAL</span>
              <span className="font-mono font-black" style={{ color: 'var(--vc-lime-main)' }}>{formatCOP(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ icon, label, value, onChange, textarea }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; textarea?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        {icon} {label}
      </label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
      )}
    </div>
  )
}
