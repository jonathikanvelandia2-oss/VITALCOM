'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Mail, Phone, MessageCircle, Calendar,
  ShoppingBag, DollarSign, TrendingUp, Award, Loader2,
  AlertTriangle, CheckCircle2, Package,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminUser, useDeactivateUser } from '@/hooks/useAdminUsers'
import { formatLevel } from '@/lib/gamification/points'

// ── Perfil 360° del cliente ────────────────────────────
// Vista consolidada: KPIs de valor, historial, productos favoritos,
// segmentación y acciones rápidas (WhatsApp, email, desactivar).

const SEGMENT_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  VIP:      { bg: 'rgba(198,255,60,0.15)', fg: 'var(--vc-lime-main)', border: 'rgba(198,255,60,0.5)' },
  ACTIVE:   { bg: 'rgba(60,198,255,0.15)', fg: 'var(--vc-info)',      border: 'rgba(60,198,255,0.4)' },
  NEW:      { bg: 'rgba(255,184,0,0.15)',  fg: 'var(--vc-warning)',   border: 'rgba(255,184,0,0.4)' },
  AT_RISK:  { bg: 'rgba(255,71,87,0.12)',  fg: 'var(--vc-error)',     border: 'rgba(255,71,87,0.4)' },
  INACTIVE: { bg: 'var(--vc-black-soft)',  fg: 'var(--vc-gray-mid)',  border: 'var(--vc-gray-dark)' },
}

const ROLE_LABELS: Record<string, string> = {
  COMMUNITY: 'Comunidad',
  DROPSHIPPER: 'Dropshipper',
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  MANAGER_AREA: 'Manager',
  EMPLOYEE: 'Empleado',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--vc-gray-mid)',
  CONFIRMED: 'var(--vc-info)',
  PROCESSING: 'var(--vc-warning)',
  DISPATCHED: 'var(--vc-info)',
  DELIVERED: 'var(--vc-lime-main)',
  CANCELLED: 'var(--vc-error)',
  RETURNED: 'var(--vc-error)',
}

function formatCOP(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$ ${(v / 1_000_000).toFixed(1)} M`
  if (Math.abs(v) >= 1_000) return `$ ${(v / 1_000).toFixed(0)} K`
  return `$ ${Math.round(v).toLocaleString('es-CO')}`
}

function formatDate(d: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysAgo(d: string | Date | null): string {
  if (!d) return '—'
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'hace 1 día'
  if (diff < 30) return `hace ${diff} días`
  if (diff < 365) return `hace ${Math.floor(diff / 30)} meses`
  return `hace ${Math.floor(diff / 365)} años`
}

export default function ClienteDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: user, isLoading } = useAdminUser(params?.id ?? null)
  const deactivate = useDeactivateUser()

  if (isLoading || !user) {
    return (
      <>
        <AdminTopbar title="Cliente" subtitle="Cargando perfil..." />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </>
    )
  }

  const segment = user.segment ?? { code: 'INACTIVE', label: 'Inactivo' }
  const segColor = SEGMENT_COLORS[segment.code] ?? SEGMENT_COLORS.INACTIVE
  const initials = (user.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const levelLabel = formatLevel(user.level ?? 1)

  function handleDeactivate() {
    if (!user.id) return
    if (!confirm(`¿Desactivar a ${user.name ?? user.email}? Podrás reactivarlo después.`)) return
    deactivate.mutate(user.id, { onSuccess: () => router.push('/admin/clientes') })
  }

  const whatsappLink = user.whatsapp
    ? `https://wa.me/${user.whatsapp.replace(/\D/g, '')}`
    : user.phone
      ? `https://wa.me/${user.phone.replace(/\D/g, '')}`
      : null

  return (
    <>
      <AdminTopbar title={user.name ?? user.email} subtitle={`CRM · ${ROLE_LABELS[user.role] ?? user.role} · ${user.country ?? 'Sin país'}`} />
      <div className="flex-1 space-y-6 p-6">
        {/* Back */}
        <Link href="/admin/clientes" className="inline-flex items-center gap-2 text-xs"
          style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
          <ArrowLeft size={14} /> Volver a clientes
        </Link>

        {/* Header */}
        <div className="vc-card flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name ?? ''} width={72} height={72}
                className="rounded-full object-cover" />
            ) : (
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-xl font-black"
                style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-display)' }}>
                {initials}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  {user.name ?? 'Sin nombre'}
                </h1>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: segColor.bg, color: segColor.fg, border: `1px solid ${segColor.border}` }}>
                  {segment.label}
                </span>
                <span className="h-2 w-2 rounded-full"
                  style={{ background: user.active ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}
                  title={user.active ? 'Activo' : 'Desactivado'} />
              </div>
              <p className="mt-1 text-sm" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
                {user.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]"
                style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                <span className="flex items-center gap-1"><Calendar size={11} /> Registrado {formatDate(user.createdAt)}</span>
                {user.country && <span>· {user.country}</span>}
                <span>· Nivel {user.level ?? 1} {levelLabel}</span>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex flex-wrap items-center gap-2">
            <a href={`mailto:${user.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors"
              style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-soft)', border: '1px solid var(--vc-gray-dark)', fontFamily: 'var(--font-heading)' }}>
              <Mail size={12} /> Email
            </a>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors"
                style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.4)', fontFamily: 'var(--font-heading)' }}>
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
            {user.phone && (
              <a href={`tel:${user.phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors"
                style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-soft)', border: '1px solid var(--vc-gray-dark)', fontFamily: 'var(--font-heading)' }}>
                <Phone size={12} /> Llamar
              </a>
            )}
            {user.active && (
              <button onClick={handleDeactivate} disabled={deactivate.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors"
                style={{ background: 'rgba(255,71,87,0.12)', color: 'var(--vc-error)', border: '1px solid rgba(255,71,87,0.4)', fontFamily: 'var(--font-heading)' }}>
                {deactivate.isPending ? 'Procesando...' : 'Desactivar'}
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CrmKpi label="Lifetime Value" value={formatCOP(user.lifetimeValue)}
            subtitle={`${user.completedOrders} pedidos válidos`} icon={<DollarSign size={18} />} />
          <CrmKpi label="Ticket promedio" value={formatCOP(user.avgTicket)}
            subtitle={`${user.orderCount} pedidos totales`} icon={<TrendingUp size={18} />} />
          <CrmKpi label="Primer pedido" value={user.firstOrderAt ? daysAgo(user.firstOrderAt) : 'Nunca'}
            subtitle={formatDate(user.firstOrderAt)} icon={<Calendar size={18} />} />
          <CrmKpi label="Último pedido" value={user.lastOrderAt ? daysAgo(user.lastOrderAt) : 'Nunca'}
            subtitle={formatDate(user.lastOrderAt)} icon={<ShoppingBag size={18} />} />
        </div>

        {/* Alertas inteligentes */}
        {segment.code === 'AT_RISK' && (
          <div className="flex items-start gap-3 rounded-lg p-4"
            style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--vc-error)' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--vc-error)', fontFamily: 'var(--font-heading)' }}>
                Cliente en riesgo
              </p>
              <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                Sin pedidos desde hace más de 60 días. Considera enviar un recordatorio o cupón para recuperarlo.
              </p>
            </div>
          </div>
        )}
        {segment.code === 'VIP' && (
          <div className="flex items-start gap-3 rounded-lg p-4"
            style={{ background: 'rgba(198,255,60,0.08)', border: '1px solid rgba(198,255,60,0.3)' }}>
            <Award size={18} style={{ color: 'var(--vc-lime-main)' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
                Cliente VIP
              </p>
              <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                Supera los $ 2M en compras acumuladas. Prioriza atención personal y ofertas exclusivas.
              </p>
            </div>
          </div>
        )}

        {/* Historial + productos favoritos */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="vc-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                Historial de pedidos
              </h2>
              <Link href={`/admin/pedidos?userId=${user.id}`}
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
                Ver todos →
              </Link>
            </div>
            {(user.recentOrders ?? []).length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingBag size={28} className="mx-auto mb-2" style={{ color: 'var(--vc-gray-dark)' }} />
                <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>No ha comprado todavía</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                    <th className="pb-2">Pedido</th>
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2">País</th>
                    <th className="pb-2">Estado</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {user.recentOrders.map((o: any) => (
                    <tr key={o.id} className="text-xs transition-colors hover:bg-white/5"
                      style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                      <td className="py-3">
                        <Link href={`/admin/pedidos?search=${o.number}`}
                          className="font-mono font-bold"
                          style={{ color: 'var(--vc-lime-main)' }}>
                          {o.number}
                        </Link>
                      </td>
                      <td className="py-3" style={{ color: 'var(--vc-gray-mid)' }}>{formatDate(o.createdAt)}</td>
                      <td className="py-3">{o.country}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--vc-black-soft)', color: STATUS_COLORS[o.status] ?? 'var(--vc-gray-mid)', border: `1px solid ${STATUS_COLORS[o.status] ?? 'var(--vc-gray-dark)'}` }}>
                          {o.status === 'DELIVERED' && <CheckCircle2 size={9} />}
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold" style={{ color: 'var(--vc-white-soft)' }}>
                        {formatCOP(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="vc-card">
            <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Productos favoritos
            </h2>
            {(user.topProducts ?? []).length === 0 ? (
              <div className="py-10 text-center">
                <Package size={28} className="mx-auto mb-2" style={{ color: 'var(--vc-gray-dark)' }} />
                <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin compras aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user.topProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg p-3"
                    style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                    {p.image ? (
                      <Image src={p.image} alt={p.name} width={36} height={36}
                        className="shrink-0 rounded object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded"
                        style={{ background: 'var(--vc-black-mid)' }}>
                        <Package size={14} style={{ color: 'var(--vc-gray-mid)' }} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                        {p.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                        {p.sku} · {p.units} uds
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] font-bold"
                      style={{ color: 'var(--vc-lime-main)' }}>
                      {formatCOP(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actividad comunidad */}
        <div className="vc-card p-5">
          <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Actividad en la comunidad
          </h2>
          <div className="flex flex-wrap gap-6">
            <Stat value={user.points ?? 0} label="Puntos" color="var(--vc-lime-main)" />
            <Stat value={user.postCount ?? 0} label="Posts" color="var(--vc-info)" />
            <Stat value={user.commentCount ?? 0} label="Comentarios" color="var(--vc-warning)" />
            <Stat value={levelLabel} label={`Nivel ${user.level ?? 1}`} color="#c084fc" />
          </div>
        </div>
      </div>
    </>
  )
}

function CrmKpi({ label, value, subtitle, icon }: {
  label: string; value: string; subtitle: string; icon: React.ReactNode
}) {
  return (
    <div className="vc-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.3)' }}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-black" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>{subtitle}</p>
    </div>
  )
}

function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div>
      <p className="text-lg font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>{value}</p>
      <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
    </div>
  )
}
