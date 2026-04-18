'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Loader2, Package, Truck, MapPin, User, Phone, Mail,
  Copy, Check, CheckCircle2, Clock, PackageCheck, ArrowRight,
  XCircle, RotateCcw, AlertTriangle, ExternalLink,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useOrder, useCancelOrder } from '@/hooks/useOrders'

// ── /pedidos/[id] — Detalle de pedido ──────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: any; description: string }> = {
  PENDING:    { label: 'Pendiente',   color: '#FFB800', icon: Clock,         description: 'Esperando confirmación' },
  CONFIRMED:  { label: 'Confirmado',  color: '#3CC6FF', icon: CheckCircle2,  description: 'Pedido validado por Vitalcom' },
  PROCESSING: { label: 'En proceso',  color: '#3CC6FF', icon: Package,       description: 'Preparando envío en bodega' },
  DISPATCHED: { label: 'Despachado',  color: '#A8FF00', icon: Truck,         description: 'En camino al cliente' },
  DELIVERED:  { label: 'Entregado',   color: '#C6FF3C', icon: PackageCheck,  description: '¡Ganancia registrada en tu P&G!' },
  CANCELLED:  { label: 'Cancelado',   color: '#FF4757', icon: XCircle,       description: 'El pedido fue cancelado' },
  RETURNED:   { label: 'Devuelto',    color: '#FF4757', icon: RotateCcw,     description: 'El cliente devolvió el producto' },
}

const TIMELINE_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] as const

function formatCOP(value: number): string {
  return `$ ${Math.round(value).toLocaleString('es-CO')}`
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: order, isLoading, isError } = useOrder(id)
  const cancelOrder = useCancelOrder()
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return (
      <>
        <CommunityTopbar title="Pedido" subtitle="Cargando..." />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </>
    )
  }

  if (isError || !order) {
    return (
      <>
        <CommunityTopbar title="Pedido" subtitle="No disponible" />
        <div className="flex flex-1 items-center justify-center py-20 text-center">
          <div>
            <AlertTriangle size={32} className="mx-auto mb-3" color="var(--vc-error)" />
            <p className="text-sm" style={{ color: 'var(--vc-white-soft)' }}>No pudimos cargar este pedido.</p>
            <Link href="/pedidos" className="mt-3 inline-flex items-center gap-1 text-xs"
              style={{ color: 'var(--vc-lime-main)' }}>
              <ArrowLeft size={12} /> Volver a pedidos
            </Link>
          </div>
        </div>
      </>
    )
  }

  const meta = STATUS_META[order.status]
  const Icon = meta.icon
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status)
  const isFinal = ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)

  function copyNumber() {
    navigator.clipboard.writeText(order.number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCancel() {
    if (!confirm(`¿Cancelar el pedido ${order.number}?\n\nEsta acción no se puede revertir.`)) return
    cancelOrder.mutate(id, {
      onError: (err: any) => alert(err.message || 'No se pudo cancelar'),
    })
  }

  return (
    <>
      <CommunityTopbar title={order.number} subtitle={meta.description} />
      <div className="flex-1 space-y-6 p-4 md:p-6">

        {/* Back link */}
        <Link href="/pedidos" className="inline-flex items-center gap-2 text-xs"
          style={{ color: 'var(--vc-white-dim)' }}>
          <ArrowLeft size={12} /> Todos los pedidos
        </Link>

        {/* Hero: número + estado */}
        <div className="vc-card relative overflow-hidden" style={{ padding: '1.5rem' }}>
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${meta.color} 0%, transparent 70%)` }} />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  Pedido
                </p>
                <button onClick={copyNumber} className="flex items-center gap-1 text-[10px]"
                  style={{ color: 'var(--vc-white-dim)' }}>
                  {copied ? <><Check size={10} color="var(--vc-lime-main)" /> Copiado</> : <><Copy size={10} /> Copiar</>}
                </button>
              </div>
              <h2 className="text-2xl font-black"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
                {order.number}
              </h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                Creado el {formatFullDate(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase"
                style={{ background: `${meta.color}22`, color: meta.color }}>
                <Icon size={12} /> {meta.label}
              </span>
              <p className="text-2xl font-black"
                style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                {formatCOP(order.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {!isFinal && <OrderTimeline currentStatus={order.status} />}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Col izq: cliente + tracking */}
          <div className="space-y-4">
            <CustomerCard order={order} />
            {(order.trackingCode || order.status === 'DISPATCHED') && <TrackingCard order={order} />}
          </div>

          {/* Col der: items + totales */}
          <div className="space-y-4 lg:col-span-2">
            <ItemsCard items={order.items} />
            <TotalsCard order={order} />
          </div>
        </div>

        {/* Acciones */}
        <div className="vc-card">
          <h3 className="mb-3 text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Acciones
          </h3>
          <div className="flex flex-wrap gap-3">
            {canCancel && (
              <button onClick={handleCancel} disabled={cancelOrder.isPending}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold"
                style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: 'var(--vc-error)' }}>
                {cancelOrder.isPending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                Cancelar pedido
              </button>
            )}
            {order.status === 'DELIVERED' && (
              <Link href="/mi-pyg"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold"
                style={{ background: 'rgba(198,255,60,0.1)', border: '1px solid rgba(198,255,60,0.3)', color: 'var(--vc-lime-main)' }}>
                <PackageCheck size={13} /> Ver en Mi P&G
              </Link>
            )}
            {!canCancel && !['DELIVERED'].includes(order.status) && (
              <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                Este pedido ya no se puede cancelar desde aquí. Contacta al equipo de logística para cualquier cambio.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Timeline ─────────────────────────────────────────────
function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = TIMELINE_STEPS.indexOf(currentStatus as any)

  return (
    <div className="vc-card">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        Seguimiento
      </h3>
      <div className="flex items-center">
        {TIMELINE_STEPS.map((st, i) => {
          const meta = STATUS_META[st]
          const Icon = meta.icon
          const isDone = i <= currentIdx
          const isCurrent = i === currentIdx
          const isLast = i === TIMELINE_STEPS.length - 1

          return (
            <div key={st} className={isLast ? '' : 'flex-1'}>
              <div className="flex items-center">
                <div className="relative flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
                    style={{
                      background: isDone ? meta.color : 'var(--vc-black-mid)',
                      border: `2px solid ${isDone ? meta.color : 'var(--vc-gray-dark)'}`,
                      boxShadow: isCurrent ? `0 0 16px ${meta.color}66` : 'none',
                    }}>
                    <Icon size={14} color={isDone ? 'var(--vc-black)' : 'var(--vc-gray-mid)'} />
                  </div>
                  <p className="absolute top-11 whitespace-nowrap text-[9px] font-bold"
                    style={{ color: isDone ? 'var(--vc-white-soft)' : 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                    {meta.label}
                  </p>
                </div>
                {!isLast && (
                  <div className="mx-1 h-0.5 flex-1"
                    style={{ background: i < currentIdx ? meta.color : 'var(--vc-gray-dark)' }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ height: '18px' }} />
    </div>
  )
}

// ── Cards ────────────────────────────────────────────────
function CustomerCard({ order }: { order: any }) {
  return (
    <div className="vc-card">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        <User size={12} /> Cliente
      </h3>
      <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)' }}>{order.customerName}</p>
      <div className="mt-3 space-y-2">
        <InfoLine icon={<Mail size={11} />} value={order.customerEmail} />
        {order.customerPhone && <InfoLine icon={<Phone size={11} />} value={order.customerPhone} />}
        {order.customerAddress && <InfoLine icon={<MapPin size={11} />} value={`${order.customerAddress} · ${order.country}`} />}
      </div>
    </div>
  )
}

function TrackingCard({ order }: { order: any }) {
  return (
    <div className="vc-card">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        <Truck size={12} /> Envío
      </h3>
      {order.carrier && (
        <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>Transportadora: <span style={{ color: 'var(--vc-white-soft)' }}>{order.carrier}</span></p>
      )}
      {order.trackingCode ? (
        <div className="mt-2 rounded-lg px-3 py-2"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
          <p className="text-[10px] uppercase" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>Código</p>
          <p className="font-mono text-sm font-bold" style={{ color: 'var(--vc-lime-main)' }}>{order.trackingCode}</p>
        </div>
      ) : (
        <p className="mt-2 text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin código de tracking todavía.</p>
      )}
    </div>
  )
}

function ItemsCard({ items }: { items: any[] }) {
  return (
    <div className="vc-card">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        <Package size={12} /> Productos ({items.length})
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg p-2.5"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md"
              style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
              {item.product?.images?.[0] ? (
                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="44px" />
              ) : (
                <Package size={14} color="var(--vc-gray-mid)" className="absolute inset-0 m-auto" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                {item.product?.name ?? 'Producto'}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                {item.product?.sku} · {item.quantity} × {formatCOP(item.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 font-mono text-xs font-bold" style={{ color: 'var(--vc-lime-main)' }}>
              {formatCOP(item.total)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TotalsCard({ order }: { order: any }) {
  return (
    <div className="vc-card">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        Totales
      </h3>
      <div className="space-y-2">
        <TotalLine label="Subtotal" value={formatCOP(order.subtotal)} />
        <TotalLine label="Envío" value={formatCOP(order.shipping)} />
        <div className="my-2 h-px" style={{ background: 'var(--vc-gray-dark)' }} />
        <TotalLine label="Total" value={formatCOP(order.total)} highlight />
      </div>
      {order.notes && (
        <div className="mt-4 rounded-lg p-3"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
          <p className="text-[10px] uppercase" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>Notas</p>
          <p className="mt-1 whitespace-pre-wrap text-xs" style={{ color: 'var(--vc-white-dim)' }}>{order.notes}</p>
        </div>
      )}
    </div>
  )
}

function InfoLine({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <p className="flex items-center gap-2 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
      <span style={{ color: 'var(--vc-gray-mid)' }}>{icon}</span>
      {value}
    </p>
  )
}

function TotalLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: highlight ? 'var(--vc-white-soft)' : 'var(--vc-white-dim)' }}>{label}</span>
      <span className="font-mono font-bold"
        style={{ color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)', fontSize: highlight ? '15px' : '13px' }}>
        {value}
      </span>
    </div>
  )
}
