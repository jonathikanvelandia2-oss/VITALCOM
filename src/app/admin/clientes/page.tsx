'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminUsers } from '@/hooks/useAdminUsers'

const ROLE_COLORS: Record<string, string> = {
  COMMUNITY: 'var(--vc-lime-main)',
  DROPSHIPPER: 'var(--vc-info)',
}

const ROLE_LABELS: Record<string, string> = {
  COMMUNITY: 'Comunidad',
  DROPSHIPPER: 'Dropshipper',
}

const TABS = [
  { label: 'Todos', value: '' },
  { label: 'Comunidad', value: 'COMMUNITY' },
  { label: 'Dropshippers', value: 'DROPSHIPPER' },
]

// Segmentos inferidos en cliente a partir de campos ya devueltos por el API.
// Coincide con la lógica de /api/admin/users/[id] computeSegment().
function quickSegment(u: any): { code: string; label: string } {
  const totalSpent = u.totalSpent ?? 0
  const lastOrderAt = u.lastOrderAt ? new Date(u.lastOrderAt) : null
  const createdAt = u.createdAt ? new Date(u.createdAt) : new Date()
  const orderCount = u.orderCount ?? 0
  const now = Date.now()
  const daysSinceLast = lastOrderAt ? Math.floor((now - lastOrderAt.getTime()) / 86400000) : null
  const daysSinceSignup = Math.floor((now - createdAt.getTime()) / 86400000)

  if (totalSpent >= 2_000_000) return { code: 'VIP', label: 'VIP' }
  if (daysSinceLast !== null && daysSinceLast <= 60) return { code: 'ACTIVE', label: 'Activo' }
  if (orderCount > 0 && daysSinceLast !== null && daysSinceLast > 60) return { code: 'AT_RISK', label: 'En riesgo' }
  if (daysSinceSignup <= 30 && orderCount === 0) return { code: 'NEW', label: 'Nuevo' }
  return { code: 'INACTIVE', label: 'Inactivo' }
}

const SEG_COLORS: Record<string, { fg: string; bg: string; border: string }> = {
  VIP:      { fg: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.12)', border: 'rgba(198,255,60,0.4)' },
  ACTIVE:   { fg: 'var(--vc-info)',      bg: 'rgba(60,198,255,0.12)', border: 'rgba(60,198,255,0.4)' },
  NEW:      { fg: 'var(--vc-warning)',   bg: 'rgba(255,184,0,0.12)',  border: 'rgba(255,184,0,0.4)' },
  AT_RISK:  { fg: 'var(--vc-error)',     bg: 'rgba(255,71,87,0.12)',  border: 'rgba(255,71,87,0.4)' },
  INACTIVE: { fg: 'var(--vc-gray-mid)',  bg: 'var(--vc-black-soft)',  border: 'var(--vc-gray-dark)' },
}

const SEGMENT_TABS = [
  { label: 'Todos', code: '' },
  { label: 'VIP', code: 'VIP' },
  { label: 'Activos', code: 'ACTIVE' },
  { label: 'Nuevos', code: 'NEW' },
  { label: 'En riesgo', code: 'AT_RISK' },
]

export default function ClientesPage() {
  const router = useRouter()
  const [roleFilter, setRoleFilter] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useAdminUsers({
    role: roleFilter || undefined,
    search: search || undefined,
    limit: 50,
  })

  const allUsers = (data?.users ?? [])
    .filter((u: any) => ['COMMUNITY', 'DROPSHIPPER'].includes(u.role))
    .map((u: any) => ({ ...u, segment: quickSegment(u) }))

  const users = segmentFilter
    ? allUsers.filter((u: any) => u.segment.code === segmentFilter)
    : allUsers
  const total = data?.pagination?.total ?? 0

  return (
    <>
      <AdminTopbar
        title="Clientes"
        subtitle={isLoading ? 'Cargando...' : `CRM · ${total} contactos`}
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Filtros por rol */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button key={t.value} onClick={() => setRoleFilter(t.value)}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  background: roleFilter === t.value ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                  color: roleFilter === t.value ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: roleFilter === t.value ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', minWidth: 280 }}>
            <Search size={14} color="var(--vc-gray-mid)" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: 'var(--vc-white-soft)' }} />
          </div>
        </div>

        {/* Filtros por segmento CRM */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
            Segmento:
          </span>
          {SEGMENT_TABS.map((s) => {
            const active = segmentFilter === s.code
            const color = s.code ? SEG_COLORS[s.code] : null
            return (
              <button key={s.code || 'all'} onClick={() => setSegmentFilter(s.code)}
                className="rounded-full px-3 py-1 text-[10px] font-bold transition-all"
                style={{
                  background: active ? (color?.bg ?? 'var(--vc-lime-main)') : 'var(--vc-black-mid)',
                  color: active ? (color?.fg ?? 'var(--vc-black)') : 'var(--vc-white-dim)',
                  border: `1px solid ${active ? (color?.border ?? 'var(--vc-lime-main)') : 'var(--vc-gray-dark)'}`,
                  fontFamily: 'var(--font-heading)',
                }}>
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <div className="vc-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  <th className="py-3">Cliente</th>
                  <th className="py-3">Segmento</th>
                  <th className="py-3">País</th>
                  <th className="py-3">Tipo</th>
                  <th className="py-3 text-right">LTV</th>
                  <th className="py-3 text-right">Pedidos</th>
                  <th className="py-3 text-right">Puntos</th>
                  <th className="py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((c: any) => {
                  const color = ROLE_COLORS[c.role] ?? 'var(--vc-white-dim)'
                  const initials = (c.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                  const seg = c.segment
                  const segColor = SEG_COLORS[seg.code]
                  const ltv = c.totalSpent ?? 0
                  return (
                    <tr key={c.id} onClick={() => router.push(`/admin/clientes/${c.id}`)}
                      className="cursor-pointer text-xs transition-colors hover:bg-white/5"
                      style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'var(--vc-white-soft)' }}>
                              {c.name ?? 'Sin nombre'}
                            </p>
                            <p className="truncate text-[10px] font-mono" style={{ color: 'var(--vc-gray-mid)' }}>
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: segColor.bg, color: segColor.fg, border: `1px solid ${segColor.border}` }}>
                          {seg.label}
                        </span>
                      </td>
                      <td className="py-4">{c.country ?? '—'}</td>
                      <td className="py-4">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--vc-black-soft)', color, border: `1px solid ${color}` }}>
                          {ROLE_LABELS[c.role] ?? c.role}
                        </span>
                      </td>
                      <td className="py-4 text-right font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                        {ltv >= 1_000_000 ? `$ ${(ltv / 1_000_000).toFixed(1)}M` : ltv >= 1_000 ? `$ ${(ltv / 1_000).toFixed(0)}K` : `$ ${Math.round(ltv)}`}
                      </td>
                      <td className="py-4 text-right font-mono">{c.orderCount ?? 0}</td>
                      <td className="py-4 text-right font-mono font-bold" style={{ color: 'var(--vc-info)' }}>
                        {(c.points ?? 0).toLocaleString('es-CO')}
                      </td>
                      <td className="py-4 text-right">
                        <ArrowRight size={14} style={{ color: 'var(--vc-gray-mid)' }} />
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                      No hay clientes {segmentFilter ? `en segmento "${SEGMENT_TABS.find(t => t.code === segmentFilter)?.label}"` : roleFilter ? `de tipo "${ROLE_LABELS[roleFilter]}"` : ''}
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
