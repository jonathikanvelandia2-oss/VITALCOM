'use client'

import { Truck, Package, CheckCircle, RotateCcw, Wifi, Loader2, Search } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders'
import { useState } from 'react'

const STATUS_COLOR: Record<string, string> = {
  PROCESSING: 'var(--vc-warning)',
  DISPATCHED: 'var(--vc-info)',
  DELIVERED: 'var(--vc-lime-main)',
  RETURNED: 'var(--vc-error)',
}

const STATUS_LABEL: Record<string, string> = {
  PROCESSING: 'Pendiente despacho',
  DISPATCHED: 'En tránsito',
  DELIVERED: 'Entregado',
  RETURNED: 'Devuelto',
}

export default function DespachosPage() {
  const [search, setSearch] = useState('')

  // Pedidos relevantes para despacho (PROCESSING, DISPATCHED, DELIVERED recientes, RETURNED)
  const processing = useOrders({ status: 'PROCESSING', limit: 50 })
  const dispatched = useOrders({ status: 'DISPATCHED', limit: 50 })
  const delivered = useOrders({ status: 'DELIVERED', limit: 10 })
  const returned = useOrders({ status: 'RETURNED', limit: 10 })

  const isLoading = processing.isLoading || dispatched.isLoading

  const pendingCount = processing.data?.pagination?.total ?? 0
  const inTransitCount = dispatched.data?.pagination?.total ?? 0
  const deliveredCount = delivered.data?.pagination?.total ?? 0
  const returnedCount = returned.data?.pagination?.total ?? 0

  // Cola de despachos = PROCESSING + DISPATCHED
  const allOrders = [
    ...(processing.data?.orders ?? []).map((o: any) => ({ ...o, _dispatchStatus: 'PROCESSING' })),
    ...(dispatched.data?.orders ?? []).map((o: any) => ({ ...o, _dispatchStatus: 'DISPATCHED' })),
    ...(delivered.data?.orders ?? []).slice(0, 5).map((o: any) => ({ ...o, _dispatchStatus: 'DELIVERED' })),
  ]

  const filtered = search
    ? allOrders.filter((o: any) =>
        o.number.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase())
      )
    : allOrders

  return (
    <>
      <AdminTopbar title="Despachos" subtitle="Fulfillment Dropi · Colombia" />
      <div className="flex-1 space-y-6 p-6">
        {/* Dropi status */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--vc-black-soft)', border: '1px solid rgba(198,255,60,0.2)', display: 'inline-flex' }}>
          <Wifi size={14} color="var(--vc-lime-main)" />
          <span className="text-[11px] font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>Dropi conectado</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Pendientes despacho" value={pendingCount} icon={Package} color="var(--vc-warning)" loading={isLoading} />
          <KpiCard label="En tránsito" value={inTransitCount} icon={Truck} color="var(--vc-info)" loading={isLoading} />
          <KpiCard label="Entregados" value={deliveredCount} icon={CheckCircle} color="var(--vc-lime-main)" loading={isLoading} />
          <KpiCard label="Devoluciones" value={returnedCount} icon={RotateCcw} color="var(--vc-error)" loading={isLoading} />
        </div>

        {/* Búsqueda */}
        <div className="relative" style={{ maxWidth: 300 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido o cliente..."
            className="w-full rounded-lg py-2.5 pl-9 pr-3 text-xs outline-none"
            style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
        </div>

        {/* Cola de despachos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <div className="vc-card overflow-x-auto p-5">
            <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Cola de despachos ({filtered.length})
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Pedido</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">País</th>
                  <th className="pb-3">Tracking</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q: any) => (
                  <DispatchRow key={q.id} order={q} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center" style={{ color: 'var(--vc-gray-mid)' }}>
                      No hay pedidos en la cola de despacho
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

// ── Fila con acción de despacho ─────────────────────────
function DispatchRow({ order }: { order: any }) {
  const updateStatus = useUpdateOrderStatus()
  const [tracking, setTracking] = useState(order.trackingCode ?? '')
  const statusColor = STATUS_COLOR[order._dispatchStatus] ?? 'var(--vc-gray-mid)'

  function handleDispatch() {
    updateStatus.mutate({
      id: order.id,
      data: {
        status: 'DISPATCHED',
        trackingCode: tracking || undefined,
        carrier: 'Dropi',
      },
    })
  }

  function handleDeliver() {
    updateStatus.mutate({
      id: order.id,
      data: { status: 'DELIVERED' },
    })
  }

  const inputStyle = { background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }

  return (
    <tr style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
      <td className="py-3 font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{order.number}</td>
      <td className="py-3">
        <p style={{ color: 'var(--vc-white-soft)' }}>{order.customerName}</p>
        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>{order.customerAddress ?? '—'}</p>
      </td>
      <td className="py-3">{order.country}</td>
      <td className="py-3">
        {order._dispatchStatus === 'PROCESSING' ? (
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Código tracking..."
            className="rounded px-2 py-1 text-[10px] outline-none" style={{ ...inputStyle, width: 130 }} />
        ) : (
          <span className="font-mono text-[10px]" style={{ color: 'var(--vc-info)' }}>
            {order.trackingCode || '—'}
          </span>
        )}
      </td>
      <td className="py-3">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: 'var(--vc-black-soft)', color: statusColor, border: `1px solid ${statusColor}` }}>
          {STATUS_LABEL[order._dispatchStatus] ?? order.status}
        </span>
      </td>
      <td className="py-3 text-right">
        {order._dispatchStatus === 'PROCESSING' && (
          <button onClick={handleDispatch} disabled={updateStatus.isPending}
            className="rounded-lg px-3 py-1 text-[10px] font-bold transition-colors"
            style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
            {updateStatus.isPending ? 'Enviando...' : 'Despachar'}
          </button>
        )}
        {order._dispatchStatus === 'DISPATCHED' && (
          <button onClick={handleDeliver} disabled={updateStatus.isPending}
            className="rounded-lg px-3 py-1 text-[10px] font-bold transition-colors"
            style={{ background: 'rgba(60,198,255,0.12)', color: 'var(--vc-info)', fontFamily: 'var(--font-heading)' }}>
            {updateStatus.isPending ? 'Marcando...' : 'Marcar entregado'}
          </button>
        )}
      </td>
    </tr>
  )
}

// ── KPI Card ────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: number; icon: typeof Package; color: string; loading: boolean
}) {
  return (
    <div className="vc-card flex items-center gap-3 p-4">
      <Icon size={20} color={color} />
      <div>
        <p className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>
          {loading ? '—' : value}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
      </div>
    </div>
  )
}
