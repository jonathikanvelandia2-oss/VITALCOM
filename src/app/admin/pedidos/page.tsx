'use client'

import { useState } from 'react'
import { Plus, Search, Loader2, ChevronDown } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders'

const STATUS_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  PENDING:    { bg: 'rgba(255, 184, 0, 0.12)', fg: 'var(--vc-warning)', border: 'rgba(255, 184, 0, 0.4)' },
  CONFIRMED:  { bg: 'rgba(60, 198, 255, 0.12)', fg: 'var(--vc-info)', border: 'rgba(60, 198, 255, 0.4)' },
  PROCESSING: { bg: 'rgba(198, 255, 60, 0.12)', fg: 'var(--vc-lime-main)', border: 'rgba(198, 255, 60, 0.4)' },
  DISPATCHED: { bg: 'rgba(168, 255, 0, 0.12)', fg: 'var(--vc-lime-electric)', border: 'rgba(168, 255, 0, 0.4)' },
  DELIVERED:  { bg: 'rgba(127, 184, 0, 0.18)', fg: 'var(--vc-lime-deep)', border: 'rgba(127, 184, 0, 0.4)' },
  CANCELLED:  { bg: 'rgba(255, 71, 87, 0.12)', fg: 'var(--vc-error)', border: 'rgba(255, 71, 87, 0.4)' },
  RETURNED:   { bg: 'rgba(255, 71, 87, 0.08)', fg: 'var(--vc-error)', border: 'rgba(255, 71, 87, 0.3)' },
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'En proceso',
  DISPATCHED: 'Despachado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', RETURNED: 'Devuelto',
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['DISPATCHED', 'CANCELLED'], DISPATCHED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'], CANCELLED: [], RETURNED: [],
}

const TABS = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Confirmados', value: 'CONFIRMED' },
  { label: 'En proceso', value: 'PROCESSING' },
  { label: 'Despachados', value: 'DISPATCHED' },
  { label: 'Entregados', value: 'DELIVERED' },
]

export default function PedidosPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useOrders({
    status: statusFilter || undefined,
    search: search || undefined,
    limit: 50,
  } as any)

  const orders = data?.orders ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <>
      <AdminTopbar
        title="Pedidos"
        subtitle={isLoading ? 'Cargando...' : `${total} pedidos · Gestión B2B + B2C`}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button key={t.value} onClick={() => setStatusFilter(t.value)}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  background: statusFilter === t.value ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                  color: statusFilter === t.value ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: statusFilter === t.value ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido o cliente..."
                className="rounded-lg py-2 pl-9 pr-3 text-xs outline-none" style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)', width: 220 }} />
            </div>
          </div>
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
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  <th className="py-3">N° pedido</th>
                  <th className="py-3">Fecha</th>
                  <th className="py-3">Cliente</th>
                  <th className="py-3">Origen</th>
                  <th className="py-3 text-right">Items</th>
                  <th className="py-3 text-right">Total</th>
                  <th className="py-3">Estado</th>
                  <th className="py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const c = STATUS_COLORS[o.status] ?? STATUS_COLORS.PENDING
                  const itemCount = o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) ?? 0
                  return (
                    <tr key={o.id} className="text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                      <td className="py-3 font-mono font-bold" style={{ color: 'var(--vc-white-soft)' }}>{o.number}</td>
                      <td className="py-3 font-mono" style={{ color: 'var(--vc-gray-mid)' }}>
                        {new Date(o.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <div>
                          <p style={{ color: 'var(--vc-white-soft)' }}>{o.customerName}</p>
                          <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>{o.customerEmail}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                          {o.source}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono">{itemCount}</td>
                      <td className="py-3 text-right font-bold font-mono" style={{ color: 'var(--vc-white-soft)' }}>
                        $ {o.total?.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <StatusChanger orderId={o.id} currentStatus={o.status} />
                      </td>
                    </tr>
                  )
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                      No hay pedidos {statusFilter ? `con estado "${STATUS_LABELS[statusFilter]}"` : ''}
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

// ── Selector de cambio de estado ────────────────────────
function StatusChanger({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const updateStatus = useUpdateOrderStatus()
  const [open, setOpen] = useState(false)
  const nextStatuses = VALID_TRANSITIONS[currentStatus] ?? []

  if (nextStatuses.length === 0) return null

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors"
        style={{ background: 'rgba(198,255,60,0.08)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
        Cambiar <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-lg py-1 shadow-lg"
          style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
          {nextStatuses.map((s) => {
            const sc = STATUS_COLORS[s]
            return (
              <button key={s} onClick={() => {
                updateStatus.mutate({ id: orderId, data: { status: s as any } })
                setOpen(false)
              }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors hover:opacity-80"
                style={{ color: sc?.fg ?? 'var(--vc-white-dim)' }}>
                <span className="h-2 w-2 rounded-full" style={{ background: sc?.fg }} />
                {STATUS_LABELS[s] ?? s}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
