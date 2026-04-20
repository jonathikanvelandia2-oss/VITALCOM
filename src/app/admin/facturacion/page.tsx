'use client'

import { Receipt, DollarSign, Clock, TrendingUp, Loader2, Globe } from 'lucide-react'
import Link from 'next/link'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminBilling } from '@/hooks/useAdminBilling'

// ── Facturación Vitalcom ────────────────────────────────
// "Factura" = Order visible al admin. No hay modelo Invoice aparte.
// KPIs y listado se derivan de Order agregado.

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: 'rgba(255,184,0,0.1)',  color: 'var(--vc-warning)',  label: 'Pendiente' },
  CONFIRMED:  { bg: 'rgba(60,198,255,0.1)', color: 'var(--vc-info)',     label: 'Confirmada' },
  PROCESSING: { bg: 'rgba(60,198,255,0.1)', color: 'var(--vc-info)',     label: 'En proceso' },
  DISPATCHED: { bg: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)',label: 'Despachada' },
  DELIVERED:  { bg: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)',label: 'Entregada' },
  CANCELLED:  { bg: 'rgba(255,71,87,0.1)',  color: 'var(--vc-error)',    label: 'Cancelada' },
  RETURNED:   { bg: 'rgba(255,71,87,0.1)',  color: 'var(--vc-error)',    label: 'Devuelta' },
}

const COUNTRY_LABELS: Record<string, string> = { CO: 'Colombia', EC: 'Ecuador', GT: 'Guatemala', CL: 'Chile' }

function formatMoney(n: number): string {
  return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function FacturacionPage() {
  const { data, isLoading } = useAdminBilling()

  if (isLoading) {
    return (
      <>
        <AdminTopbar title="Facturación" subtitle="Facturas y liquidaciones" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </>
    )
  }

  const kpis = data?.kpis
  const byCountry = data?.byCountry ?? []
  const recent = data?.recent ?? []

  return (
    <>
      <AdminTopbar title="Facturación" subtitle="Agregado derivado de Orders" />
      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Receipt}
            value={String(kpis?.monthCount ?? 0)}
            label="Facturas este mes"
            color="var(--vc-lime-main)"
          />
          <KpiCard
            icon={TrendingUp}
            value={formatMoney(kpis?.monthRevenue ?? 0)}
            label="Ingresos del mes"
            color="var(--vc-lime-main)"
          />
          <KpiCard
            icon={Clock}
            value={String(kpis?.pendingCount ?? 0)}
            label="Pendientes de cobro"
            color="var(--vc-warning)"
          />
          <KpiCard
            icon={DollarSign}
            value={formatMoney(kpis?.pendingValue ?? 0)}
            label="Valor por cobrar"
            color="var(--vc-warning)"
          />
        </div>

        {/* Breakdown por país */}
        {byCountry.length > 0 && (
          <div className="vc-card p-5">
            <h2
              className="mb-4 flex items-center gap-2 text-sm font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              <Globe size={14} color="var(--vc-lime-main)" /> Desglose del mes por país
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {byCountry.map((c) => (
                <div
                  key={c.country}
                  className="rounded-lg p-3"
                  style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
                >
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)' }}>
                    {COUNTRY_LABELS[c.country] ?? c.country}
                  </p>
                  <p
                    className="mt-1 text-lg font-bold"
                    style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                  >
                    {formatMoney(c.revenue)}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                    {c.count} orden{c.count !== 1 ? 'es' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla últimas órdenes */}
        <div className="vc-card overflow-x-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-sm font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              Últimas facturas (20)
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-[11px] font-semibold hover:underline"
              style={{ color: 'var(--vc-lime-main)' }}
            >
              Ver todos los pedidos →
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
              Aún no hay órdenes registradas
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                >
                  <th className="pb-3">Número</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">País</th>
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3 text-right">Monto</th>
                  <th className="pb-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => {
                  const st = STATUS_COLORS[o.status] ?? { bg: 'transparent', color: 'var(--vc-white-dim)', label: o.status }
                  return (
                    <tr
                      key={o.id}
                      style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}
                    >
                      <td className="py-3 font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                        <Link href={`/admin/pedidos/${o.id}`} className="hover:underline">
                          {o.number}
                        </Link>
                      </td>
                      <td className="py-3">
                        <p style={{ color: 'var(--vc-white-soft)' }}>{o.customerName}</p>
                        {o.userName && (
                          <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>
                            por {o.userName}
                          </p>
                        )}
                      </td>
                      <td className="py-3" style={{ fontFamily: 'var(--font-mono)' }}>
                        {o.country}
                      </td>
                      <td className="py-3" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatDate(o.createdAt)}
                      </td>
                      <td
                        className="py-3 text-right font-mono font-bold"
                        style={{ color: 'var(--vc-white-soft)' }}
                      >
                        {formatMoney(o.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}
                        >
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

function KpiCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: any
  value: string
  label: string
  color: string
}) {
  return (
    <div className="vc-card flex items-center gap-4 p-5">
      <Icon size={22} style={{ color }} />
      <div>
        <p className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>
          {value}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
