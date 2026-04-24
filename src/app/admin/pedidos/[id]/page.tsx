'use client'

// V37 — Admin · Detalle de pedido con panel de fulfillment manual
// Funciona sin Dropi/Effi. Staff despacha con transportadora local,
// carga la guía, y el audit trail queda registrado para cada acción.

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Loader2, Truck, Package, MapPin, Phone, Mail, Calendar,
  CheckCircle2, Clock, X, ExternalLink, AlertCircle, User as UserIcon,
  Check, ShieldCheck, Ban,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders'
import {
  useCarriers, useManualFulfill, useOrderLogs,
  type ManualFulfillInput, type FulfillmentLogItem,
} from '@/hooks/useFulfillment'
import {
  buildTrackingUrl, findCarrier, nextStatusesFor, isTerminalStatus,
  estimateDeliveryWindow, type OrderStatusLite, type CountryLite,
} from '@/lib/fulfillment/helpers'

type Ctx = { params: Promise<{ id: string }> }

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'En proceso',
  DISPATCHED: 'Despachado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
}

const STATUS_COLOR: Record<string, { bg: string; fg: string; border: string }> = {
  PENDING: { bg: 'rgba(255,184,0,0.12)', fg: 'var(--vc-warning)', border: 'rgba(255,184,0,0.4)' },
  CONFIRMED: { bg: 'rgba(60,198,255,0.12)', fg: 'var(--vc-info)', border: 'rgba(60,198,255,0.4)' },
  PROCESSING: { bg: 'rgba(198,255,60,0.12)', fg: 'var(--vc-lime-main)', border: 'rgba(198,255,60,0.4)' },
  DISPATCHED: { bg: 'rgba(168,255,0,0.15)', fg: 'var(--vc-lime-electric)', border: 'rgba(168,255,0,0.5)' },
  DELIVERED: { bg: 'rgba(127,184,0,0.18)', fg: 'var(--vc-lime-deep)', border: 'rgba(127,184,0,0.4)' },
  CANCELLED: { bg: 'rgba(255,71,87,0.12)', fg: 'var(--vc-error)', border: 'rgba(255,71,87,0.4)' },
  RETURNED: { bg: 'rgba(255,71,87,0.08)', fg: 'var(--vc-error)', border: 'rgba(255,71,87,0.3)' },
}

const FLAG: Record<string, string> = { CO: '🇨🇴', EC: '🇪🇨', GT: '🇬🇹', CL: '🇨🇱' }

const ACTION_LABEL: Record<string, string> = {
  CREATED: 'Pedido creado',
  STATUS_CHANGED: 'Cambio de estado',
  TRACKING_ASSIGNED: 'Guía asignada',
  CARRIER_ASSIGNED: 'Transportadora asignada',
  NOTE_ADDED: 'Nota agregada',
  MANUAL_DISPATCHED: 'Despachado manualmente',
  DROPI_DISPATCHED: 'Despachado vía Dropi',
  DELIVERED_CONFIRMED: 'Entrega confirmada',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
  REOPENED: 'Reabierto',
}

export default function AdminOrderDetailPage({ params }: Ctx) {
  const { id } = use(params)
  const orderQ = useOrder(id)
  const logsQ = useOrderLogs(id)

  if (orderQ.isLoading) {
    return (
      <>
        <AdminTopbar title="Pedido" />
        <div className="flex flex-1 items-center justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
        </div>
      </>
    )
  }

  if (orderQ.error || !orderQ.data) {
    return (
      <>
        <AdminTopbar title="Pedido" />
        <div className="flex flex-1 items-center justify-center p-10">
          <div className="rounded-lg border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/5 p-4 text-xs text-[var(--vc-error)]">
            {(orderQ.error as Error)?.message ?? 'No se pudo cargar el pedido'}
          </div>
        </div>
      </>
    )
  }

  const order = orderQ.data as any
  const status = order.status as OrderStatusLite
  const country = order.country as CountryLite
  const trackingUrl = buildTrackingUrl(order.carrier, order.trackingCode)
  const carrierInfo = order.carrier ? findCarrier(order.carrier) : null
  const carrierLabel = carrierInfo?.label ?? order.carrier ?? null

  return (
    <>
      <AdminTopbar title={`Pedido ${order.number}`} subtitle={`${FLAG[country] ?? ''} ${country} · ${order.source}`} />
      <div className="flex-1 space-y-5 p-4 md:p-6">
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--vc-white-dim)] hover:text-[var(--vc-lime-main)]"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Volver a pedidos
        </Link>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          {/* ═══ Columna izquierda ═══ */}
          <div className="space-y-4">
            <OrderHeaderCard order={order} carrierLabel={carrierLabel} trackingUrl={trackingUrl} />
            <ItemsCard items={order.items ?? []} subtotal={order.subtotal} shipping={order.shipping} total={order.total} />
            <CustomerCard order={order} />
            {order.notes && <NotesCard notes={order.notes} />}
          </div>

          {/* ═══ Columna derecha ═══ */}
          <div className="space-y-4">
            <FulfillmentPanel orderId={id} order={order} />
            <AuditTimeline logs={logsQ.data?.items ?? []} loading={logsQ.isLoading} />
          </div>
        </div>
      </div>
    </>
  )
}

// ═════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═════════════════════════════════════════════════════

function OrderHeaderCard({
  order,
  carrierLabel,
  trackingUrl,
}: {
  order: any
  carrierLabel: string | null
  trackingUrl: string | null
}) {
  const status = order.status
  const color = STATUS_COLOR[status]
  const createdAt = new Date(order.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198,255,60,0.18)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--vc-gray-mid)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {order.number}
          </p>
          <h2
            className="mt-1 text-2xl font-black"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
          >
            ${order.total.toLocaleString('es-CO')}{' '}
            <span className="text-[11px] font-normal text-[var(--vc-white-dim)]">
              COP · {order.items?.length ?? 0} item{order.items?.length === 1 ? '' : 's'}
            </span>
          </h2>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--vc-white-dim)]">
            <Calendar className="h-3 w-3" /> Creado {createdAt}
          </p>
        </div>

        <div
          className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{
            background: color.bg,
            color: color.fg,
            border: `1px solid ${color.border}`,
          }}
        >
          {STATUS_LABEL[status]}
        </div>
      </div>

      {carrierLabel && (
        <div
          className="mt-4 flex items-center justify-between rounded-lg border border-[var(--vc-lime-main)]/20 bg-[var(--vc-black-soft)] p-3"
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--vc-gray-mid)]">Transportadora</p>
            <p className="text-sm font-bold text-[var(--vc-white-soft)]">{carrierLabel}</p>
            {order.trackingCode && (
              <p className="mt-1 font-mono text-xs text-[var(--vc-lime-main)]">{order.trackingCode}</p>
            )}
          </div>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-soft)] transition hover:border-[var(--vc-lime-main)]/40"
            >
              Rastrear <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function ItemsCard({
  items,
  subtotal,
  shipping,
  total,
}: {
  items: any[]
  subtotal: number
  shipping: number
  total: number
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid var(--vc-gray-dark)',
      }}
    >
      <h3
        className="mb-3 text-xs font-black uppercase tracking-wider text-[var(--vc-lime-main)]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Productos
      </h3>
      <div className="divide-y divide-[var(--vc-gray-dark)]">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--vc-white-soft)]">{item.product?.name ?? 'Producto'}</p>
              <p className="font-mono text-[10px] text-[var(--vc-white-dim)]">{item.product?.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--vc-white-dim)]">
                {item.quantity} × ${item.unitPrice.toLocaleString('es-CO')}
              </p>
              <p className="text-sm font-bold text-[var(--vc-white-soft)]">
                ${item.total.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1.5 border-t border-[var(--vc-gray-dark)] pt-3 text-xs">
        <Row label="Subtotal" value={`$${subtotal.toLocaleString('es-CO')}`} />
        <Row label="Envío" value={`$${shipping.toLocaleString('es-CO')}`} />
        <Row label="Total" value={`$${total.toLocaleString('es-CO')}`} highlight />
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--vc-white-dim)]">{label}</span>
      <span
        className="font-mono"
        style={{
          color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)',
          fontWeight: highlight ? 900 : 500,
          fontSize: highlight ? '0.95rem' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function CustomerCard({ order }: { order: any }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid var(--vc-gray-dark)',
      }}
    >
      <h3
        className="mb-3 text-xs font-black uppercase tracking-wider text-[var(--vc-lime-main)]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Cliente
      </h3>
      <div className="space-y-2 text-sm">
        <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} text={order.customerName} />
        {order.customerEmail && <InfoRow icon={<Mail className="h-3.5 w-3.5" />} text={order.customerEmail} />}
        {order.customerPhone && <InfoRow icon={<Phone className="h-3.5 w-3.5" />} text={order.customerPhone} />}
        {order.customerAddress && <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} text={order.customerAddress} />}
      </div>
    </div>
  )
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 text-[var(--vc-white-soft)]">
      <span className="mt-0.5 text-[var(--vc-lime-main)]">{icon}</span>
      <span className="break-words text-xs">{text}</span>
    </div>
  )
}

function NotesCard({ notes }: { notes: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,184,0,0.05)',
        border: '1px solid rgba(255,184,0,0.3)',
      }}
    >
      <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--vc-warning)]">Notas internas</h3>
      <pre className="whitespace-pre-wrap break-words font-sans text-xs text-[var(--vc-white-dim)]">{notes}</pre>
    </div>
  )
}

// ─── PANEL DE FULFILLMENT ──────────────────────────────
function FulfillmentPanel({ orderId, order }: { orderId: string; order: any }) {
  const status = order.status as OrderStatusLite
  const terminal = isTerminalStatus(status)
  const next = nextStatusesFor(status)
  const canDispatch = status === 'PROCESSING' // solo desde PROCESSING se despacha

  const [manualOpen, setManualOpen] = useState(false)
  const statusM = useUpdateOrderStatus()

  const handleQuickTransition = (to: OrderStatusLite) => {
    if (!confirm(`¿Confirmas cambiar a ${STATUS_LABEL[to]}?`)) return
    statusM.mutate({ id: orderId, data: { status: to } })
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--vc-black-mid)',
        border: canDispatch ? '1px solid rgba(198,255,60,0.5)' : '1px solid rgba(198,255,60,0.18)',
        boxShadow: canDispatch ? '0 0 24px rgba(198,255,60,0.15)' : undefined,
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(198,255,60,0.1)',
            color: 'var(--vc-lime-main)',
            border: '1px solid rgba(198,255,60,0.3)',
          }}
        >
          <Truck className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3
            className="text-sm font-black"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
          >
            Fulfillment
          </h3>
          <p className="text-[10px] text-[var(--vc-white-dim)]">
            Modo actual: {order.fulfillmentMode ?? 'MANUAL'}
            {order.fulfilledAt && ` · despachado ${new Date(order.fulfilledAt).toLocaleDateString('es-CO')}`}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {canDispatch && (
          <button
            onClick={() => setManualOpen(true)}
            className="w-full rounded-lg px-4 py-3 text-xs font-black uppercase tracking-wider transition"
            style={{
              background: 'var(--vc-lime-main)',
              color: 'var(--vc-black)',
              boxShadow: '0 0 20px var(--vc-glow-lime)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Package className="h-4 w-4" /> Despachar manualmente
            </span>
          </button>
        )}

        {next.length > 0 &&
          next.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={() => handleQuickTransition(nextStatus)}
              disabled={statusM.isPending}
              className="flex w-full items-center justify-between rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2.5 text-xs font-bold text-[var(--vc-white-soft)] transition hover:border-[var(--vc-lime-main)]/40 disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                {nextStatus === 'DELIVERED' && <CheckCircle2 className="h-3.5 w-3.5 text-[var(--vc-lime-deep)]" />}
                {nextStatus === 'CANCELLED' && <Ban className="h-3.5 w-3.5 text-[var(--vc-error)]" />}
                {nextStatus === 'RETURNED' && <AlertCircle className="h-3.5 w-3.5 text-[var(--vc-error)]" />}
                {nextStatus === 'CONFIRMED' && <Check className="h-3.5 w-3.5 text-[var(--vc-info)]" />}
                {nextStatus === 'PROCESSING' && <Clock className="h-3.5 w-3.5 text-[var(--vc-warning)]" />}
                {STATUS_LABEL[nextStatus]}
              </span>
              <span className="text-[9px] text-[var(--vc-gray-mid)]">→</span>
            </button>
          ))}

        {terminal && (
          <div className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-3 text-center text-[11px] text-[var(--vc-white-dim)]">
            Estado terminal · no hay transiciones disponibles
          </div>
        )}

        {statusM.error && (
          <p className="text-[11px] text-[var(--vc-error)]">{(statusM.error as Error).message}</p>
        )}
      </div>

      {manualOpen && (
        <ManualFulfillModal
          orderId={orderId}
          country={order.country as CountryLite}
          onClose={() => setManualOpen(false)}
        />
      )}
    </div>
  )
}

function ManualFulfillModal({
  orderId,
  country,
  onClose,
}: {
  orderId: string
  country: CountryLite
  onClose: () => void
}) {
  const carriersQ = useCarriers(country)
  const fulfillM = useManualFulfill(orderId)

  const [carrierKey, setCarrierKey] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [cost, setCost] = useState('')
  const [note, setNote] = useState('')

  const window = estimateDeliveryWindow(country)

  const handleSubmit = () => {
    const input: ManualFulfillInput = {
      carrierKey,
      trackingCode,
      ...(cost ? { manualCost: Number(cost) } : {}),
      ...(note ? { note } : {}),
    }
    fulfillM.mutate(input, {
      onSuccess: () => {
        setTimeout(onClose, 1500)
      },
    })
  }

  if (fulfillM.isSuccess) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl p-6 text-center"
          style={{
            background: 'var(--vc-black-mid)',
            border: '1px solid rgba(198,255,60,0.4)',
            boxShadow: '0 0 48px var(--vc-glow-lime)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'rgba(198,255,60,0.15)' }}
          >
            <CheckCircle2 className="h-7 w-7 text-[var(--vc-lime-main)]" />
          </div>
          <h3 className="mt-4 text-lg font-black" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Pedido despachado
          </h3>
          <p className="mt-1 text-xs text-[var(--vc-white-dim)]">Estado actualizado + log registrado</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-5 lg:p-6"
        style={{
          background: 'var(--vc-black-mid)',
          border: '1px solid rgba(198,255,60,0.25)',
          boxShadow: '0 0 48px rgba(198,255,60,0.1)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--vc-gray-dark)] pb-3">
          <div>
            <h3
              className="text-base font-black"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
            >
              Despacho manual {FLAG[country]} {country}
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--vc-white-dim)]">
              Entrega estimada: {window.min}-{window.max} días hábiles
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-1.5 text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/40"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">
              Transportadora
            </label>
            {carriersQ.isLoading ? (
              <div className="mt-1 flex items-center gap-2 text-xs text-[var(--vc-white-dim)]">
                <Loader2 className="h-3 w-3 animate-spin" /> Cargando…
              </div>
            ) : (
              <select
                value={carrierKey}
                onChange={(e) => setCarrierKey(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)] outline-none focus:border-[var(--vc-lime-main)]/40"
              >
                <option value="">Selecciona una transportadora</option>
                {(carriersQ.data?.items ?? []).map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">
              Número de guía
            </label>
            <input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Ej: 12345678 · ABC-123-X"
              className="mt-1 w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 font-mono text-xs text-[var(--vc-white-soft)] outline-none focus:border-[var(--vc-lime-main)]/40"
            />
            <p className="mt-1 text-[10px] text-[var(--vc-gray-mid)]">
              Se normaliza automáticamente a mayúsculas sin espacios
            </p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">
              Costo real del envío (opcional)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="12000"
              className="mt-1 w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 font-mono text-xs text-[var(--vc-white-soft)] outline-none focus:border-[var(--vc-lime-main)]/40"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">
              Nota interna (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ej: entrega prioritaria, empaque especial, etc."
              className="mt-1 w-full resize-none rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)] outline-none focus:border-[var(--vc-lime-main)]/40"
            />
          </div>

          {fulfillM.error && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/5 p-3 text-[11px] text-[var(--vc-error)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{(fulfillM.error as Error).message}</span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-[var(--vc-info)]/30 bg-[var(--vc-info)]/5 p-2.5 text-[11px] text-[var(--vc-info)]">
            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Cada acción queda registrada en el audit log con tu usuario y timestamp.</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!carrierKey || !trackingCode || fulfillM.isPending}
          className="mt-4 w-full rounded-lg px-4 py-3 text-xs font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            boxShadow: !carrierKey || !trackingCode || fulfillM.isPending ? undefined : '0 0 24px var(--vc-glow-lime)',
          }}
        >
          {fulfillM.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Despachando…
            </span>
          ) : (
            'Confirmar despacho'
          )}
        </button>
      </div>
    </div>
  )
}

// ─── TIMELINE DE AUDIT ─────────────────────────────────
function AuditTimeline({ logs, loading }: { logs: FulfillmentLogItem[]; loading: boolean }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid var(--vc-gray-dark)',
      }}
    >
      <h3
        className="mb-3 text-xs font-black uppercase tracking-wider text-[var(--vc-lime-main)]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Historial
      </h3>

      {loading && (
        <div className="flex items-center gap-2 py-2 text-xs text-[var(--vc-white-dim)]">
          <Loader2 className="h-3 w-3 animate-spin" /> Cargando…
        </div>
      )}

      {!loading && logs.length === 0 && (
        <p className="py-2 text-[11px] text-[var(--vc-white-dim)]">Sin eventos registrados aún</p>
      )}

      <div className="space-y-0">
        {logs.map((log, idx) => (
          <div key={log.id} className="relative flex gap-3 pb-4 last:pb-0">
            {idx < logs.length - 1 && (
              <div
                className="absolute left-[11px] top-6 h-full w-px"
                style={{ background: 'var(--vc-gray-dark)' }}
              />
            )}
            <div
              className="z-10 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-lime-main)',
              }}
            >
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--vc-lime-main)' }}
              />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-xs font-bold text-[var(--vc-white-soft)]">
                {ACTION_LABEL[log.action] ?? log.action}
                {log.fromStatus && log.toStatus && (
                  <span className="ml-2 font-normal text-[10px] text-[var(--vc-white-dim)]">
                    {STATUS_LABEL[log.fromStatus]} → {STATUS_LABEL[log.toStatus]}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--vc-white-dim)]">
                {log.actor.name ?? 'Equipo'}
                {log.actor.role && ` · ${log.actor.role}`}
                {' · '}
                {new Date(log.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
              {log.message && (
                <p className="mt-1 text-[11px] italic text-[var(--vc-white-dim)]">&ldquo;{log.message}&rdquo;</p>
              )}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(log.metadata).map(([k, v]) => v != null && (
                    <span
                      key={k}
                      className="rounded-full px-2 py-0.5 text-[9px] font-mono"
                      style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-dim)' }}
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
