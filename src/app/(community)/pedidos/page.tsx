'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, Search, Plus, Loader2, Package, TrendingUp, Clock,
  CheckCircle2, ArrowRight, PackageCheck, XCircle, RotateCcw, AlertTriangle,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useOrders, useOrdersStats } from '@/hooks/useOrders'
import type { OrderFilters } from '@/lib/api/schemas/order'
import { NewOrderModal } from '@/components/community/NewOrderModal'

// ── /pedidos — Listado de pedidos del dropshipper ───────
// Vista estilo Meta Business: KPIs + tabs por estado + tabla responsiva

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:    { label: 'Pendiente',   color: '#FFB800', icon: Clock },
  CONFIRMED:  { label: 'Confirmado',  color: '#3CC6FF', icon: CheckCircle2 },
  PROCESSING: { label: 'En proceso',  color: '#3CC6FF', icon: Package },
  DISPATCHED: { label: 'Despachado',  color: '#A8FF00', icon: ArrowRight },
  DELIVERED:  { label: 'Entregado',   color: '#C6FF3C', icon: PackageCheck },
  CANCELLED:  { label: 'Cancelado',   color: '#FF4757', icon: XCircle },
  RETURNED:   { label: 'Devuelto',    color: '#FF4757', icon: RotateCcw },
}

function formatCOP(value: number): string {
  return `$ ${Math.round(value).toLocaleString('es-CO')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function PedidosPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showNewOrder, setShowNewOrder] = useState(false)

  const filters: Partial<OrderFilters> = {
    page,
    limit: 20,
    ...(statusFilter !== 'ALL' && { status: statusFilter as any }),
    ...(search && { search }),
  }

  const { data, isLoading } = useOrders(filters)
  const { data: statsData } = useOrdersStats()

  const orders = data?.orders ?? []
  const pagination = data?.pagination
  const stats = statsData

  return (
    <>
      <CommunityTopbar
        title="Mis Pedidos"
        subtitle={stats ? `${stats.totalOrders} pedidos · ${formatCOP(stats.totalRevenue)} en ventas` : 'Gestiona tu operación'}
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Pedidos totales" value={stats?.totalOrders ?? 0} icon={ShoppingCart} />
          <KpiCard label="Revenue total" value={stats ? formatCOP(stats.totalRevenue) : '—'} icon={TrendingUp} highlight />
          <KpiCard label="Por procesar" value={stats?.pendingAction ?? 0} icon={Clock} warning={!!stats && stats.pendingAction > 0} />
          <KpiCard label="Entregados 30d" value={stats?.delivered30d ?? 0} icon={PackageCheck} />
        </div>

        {/* Tabs + búsqueda */}
        <div className="vc-card" style={{ padding: '1rem' }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
              <Search size={14} color="var(--vc-gray-mid)" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Buscar por número, cliente o email…"
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: 'var(--vc-white-soft)' }} />
            </div>
            <button onClick={() => setShowNewOrder(true)}
              className="vc-btn-primary flex items-center gap-2 text-xs">
              <Plus size={14} /> Nuevo pedido
            </button>
          </div>

          {/* Tabs de estado */}
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            <StatusTab active={statusFilter === 'ALL'} onClick={() => { setStatusFilter('ALL'); setPage(1) }}
              label="Todos" count={stats?.totalOrders} color="var(--vc-white-soft)" />
            {(['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] as const).map((st) => {
              const meta = STATUS_META[st]
              return (
                <StatusTab key={st}
                  active={statusFilter === st}
                  onClick={() => { setStatusFilter(st); setPage(1) }}
                  label={meta.label}
                  count={stats?.byStatus?.[st]}
                  color={meta.color} />
              )
            })}
          </div>
        </div>

        {/* Listado */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState onCreateClick={() => setShowNewOrder(true)} hasFilters={statusFilter !== 'ALL' || !!search} />
        ) : (
          <>
            {/* Mobile: cards. Desktop: tabla */}
            <div className="space-y-3 md:hidden">
              {orders.map((order: any) => <OrderCard key={order.id} order={order} />)}
            </div>

            <div className="vc-card hidden md:block" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--vc-gray-dark)' }}>
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">País</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => <OrderRow key={order.id} order={order} />)}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                  Página {pagination.page} de {pagination.pages} · {pagination.total} pedidos
                </p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                    className="rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
                    style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}>
                    Anterior
                  </button>
                  <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}
                    className="rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
                    style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}>
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} />}
    </>
  )
}

// ── Componentes ─────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, highlight, warning }: {
  label: string; value: string | number; icon: any; highlight?: boolean; warning?: boolean
}) {
  const color = warning ? 'var(--vc-warning)' : highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)'
  return (
    <div className="vc-card" style={{ padding: '1rem' }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-wider"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
        <Icon size={13} style={{ color }} />
      </div>
      <p className="text-lg font-black"
        style={{ color, fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
    </div>
  )
}

function StatusTab({ active, onClick, label, count, color }: {
  active: boolean; onClick: () => void; label: string; count?: number; color: string
}) {
  return (
    <button onClick={onClick}
      className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
      style={{
        background: active ? 'var(--vc-lime-main)' : 'var(--vc-black-soft)',
        color: active ? 'var(--vc-black)' : 'var(--vc-white-dim)',
        border: active ? 'none' : '1px solid var(--vc-gray-dark)',
        fontFamily: 'var(--font-heading)',
      }}>
      <span className="h-2 w-2 rounded-full" style={{ background: active ? 'var(--vc-black)' : color }} />
      {label}
      {typeof count === 'number' && count > 0 && (
        <span className="rounded-full px-1.5 text-[9px] font-bold"
          style={{
            background: active ? 'rgba(10,10,10,0.15)' : 'var(--vc-black-mid)',
            color: active ? 'var(--vc-black)' : 'var(--vc-white-dim)',
          }}>
          {count}
        </span>
      )}
    </button>
  )
}

function OrderRow({ order }: { order: any }) {
  const meta = STATUS_META[order.status]
  const itemsCount = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
  const Icon = meta.icon

  return (
    <tr className="text-xs transition-all hover:bg-[rgba(198,255,60,0.04)]"
      style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
      <td className="px-4 py-3">
        <p className="font-mono font-bold" style={{ color: 'var(--vc-white-soft)' }}>{order.number}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{order.customerName}</p>
        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>{order.customerEmail}</p>
      </td>
      <td className="px-4 py-3 font-mono">{order.country}</td>
      <td className="px-4 py-3 font-mono">{itemsCount}</td>
      <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>
        {formatCOP(order.total)}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
          style={{ background: `${meta.color}22`, color: meta.color }}>
          <Icon size={10} /> {meta.label}
        </span>
      </td>
      <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
        {formatDate(order.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={`/pedidos/${order.id}`}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold"
          style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-lime-main)' }}>
          Ver <ArrowRight size={10} />
        </Link>
      </td>
    </tr>
  )
}

function OrderCard({ order }: { order: any }) {
  const meta = STATUS_META[order.status]
  const itemsCount = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
  const Icon = meta.icon

  return (
    <Link href={`/pedidos/${order.id}`} className="vc-card block">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--vc-white-soft)' }}>{order.number}</span>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
              style={{ background: `${meta.color}22`, color: meta.color }}>
              <Icon size={9} /> {meta.label}
            </span>
          </div>
          <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{order.customerName}</p>
          <p className="truncate text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
            {itemsCount} items · {order.country} · {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>
            {formatCOP(order.total)}
          </p>
          <ArrowRight size={14} className="ml-auto mt-1 opacity-50" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ onCreateClick, hasFilters }: { onCreateClick: () => void; hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="vc-card py-12 text-center">
        <AlertTriangle size={28} className="mx-auto mb-3" color="var(--vc-gray-dark)" />
        <p className="text-sm" style={{ color: 'var(--vc-white-soft)' }}>No hay pedidos con estos filtros</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Prueba cambiar el estado o limpiar la búsqueda.</p>
      </div>
    )
  }
  return (
    <div className="vc-card py-16 text-center">
      <ShoppingCart size={36} className="mx-auto mb-3" color="var(--vc-gray-dark)" />
      <p className="text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
        Aún no tienes pedidos
      </p>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
        Crea tu primer pedido manual o conecta tu tienda Shopify — los pedidos se sincronizarán automáticamente.
      </p>
      <button onClick={onCreateClick}
        className="vc-btn-primary mx-auto mt-4 flex items-center gap-2 text-xs">
        <Plus size={14} /> Crear primer pedido
      </button>
    </div>
  )
}
