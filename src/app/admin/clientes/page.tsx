'use client'

import { useState } from 'react'
import { Search, Loader2, ChevronDown } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminUsers, useUpdateUser } from '@/hooks/useAdminUsers'

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

export default function ClientesPage() {
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useAdminUsers({
    role: roleFilter || undefined,
    search: search || undefined,
    limit: 50,
  })

  const users = (data?.users ?? []).filter((u: any) =>
    ['COMMUNITY', 'DROPSHIPPER'].includes(u.role)
  )
  const total = data?.pagination?.total ?? 0

  return (
    <>
      <AdminTopbar
        title="Clientes"
        subtitle={isLoading ? 'Cargando...' : `CRM · ${total} contactos`}
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Filtros */}
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
                  <th className="py-3">Email</th>
                  <th className="py-3">País</th>
                  <th className="py-3">Tipo</th>
                  <th className="py-3">Nivel</th>
                  <th className="py-3 text-right">Pedidos</th>
                  <th className="py-3 text-right">Puntos</th>
                  <th className="py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((c: any) => {
                  const color = ROLE_COLORS[c.role] ?? 'var(--vc-white-dim)'
                  const initials = (c.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <tr key={c.id} className="text-xs"
                      style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
                            {initials}
                          </div>
                          <span className="font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                            {c.name ?? 'Sin nombre'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 font-mono">{c.email}</td>
                      <td className="py-4">{c.country ?? '—'}</td>
                      <td className="py-4">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--vc-black-soft)', color, border: `1px solid ${color}` }}>
                          {ROLE_LABELS[c.role] ?? c.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="font-mono text-[10px]" style={{ color: 'var(--vc-lime-main)' }}>
                          Nv.{c.level ?? 1}
                        </span>
                      </td>
                      <td className="py-4 text-right font-mono">{c.orderCount ?? 0}</td>
                      <td className="py-4 text-right font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                        {(c.points ?? 0).toLocaleString('es-CO')}
                      </td>
                      <td className="py-4 text-right">
                        <span className="h-2 w-2 inline-block rounded-full"
                          style={{ background: c.active ? 'var(--vc-lime-main)' : 'var(--vc-error)' }} />
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                      No hay clientes {roleFilter ? `de tipo "${ROLE_LABELS[roleFilter]}"` : ''}
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
