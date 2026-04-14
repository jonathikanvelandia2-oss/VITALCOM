'use client'

import { Users, Store, MessageCircle, Star, TrendingUp, Loader2, Search } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { usePosts } from '@/hooks/usePosts'
import { useState } from 'react'
import { formatLevel } from '@/lib/gamification/points'

export default function ComunidadPage() {
  const [search, setSearch] = useState('')

  // Miembros de comunidad + dropshippers
  const community = useAdminUsers({ role: 'COMMUNITY', limit: 100 })
  const dropshippers = useAdminUsers({ role: 'DROPSHIPPER', limit: 100 })
  const recentPosts = usePosts({ limit: 5 })

  const isLoading = community.isLoading || dropshippers.isLoading

  const totalMembers = (community.data?.pagination?.total ?? 0) + (dropshippers.data?.pagination?.total ?? 0)
  const allMembers = [
    ...(community.data?.users ?? []),
    ...(dropshippers.data?.users ?? []),
  ]

  // Top miembros por puntos
  const topMembers = [...allMembers]
    .sort((a: any, b: any) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 10)

  // Calcular nivel promedio
  const avgLevel = allMembers.length > 0
    ? (allMembers.reduce((sum: number, m: any) => sum + (m.level ?? 1), 0) / allMembers.length).toFixed(1)
    : '0'

  // Tiendas conectadas (dropshippers)
  const storeCount = dropshippers.data?.pagination?.total ?? 0

  // Posts recientes
  const posts = recentPosts.data?.posts ?? []
  const totalPosts = recentPosts.data?.pagination?.total ?? 0

  // Filtro de búsqueda
  const filtered = search
    ? allMembers.filter((m: any) =>
        (m.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.email ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : topMembers

  return (
    <>
      <AdminTopbar title="Comunidad VITALCOMMERS" subtitle={isLoading ? 'Cargando...' : `${totalMembers} miembros activos`} />
      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard icon={Users} label="Miembros" value={isLoading ? '—' : String(totalMembers)} color="var(--vc-lime-main)" />
          <KpiCard icon={Store} label="Dropshippers" value={isLoading ? '—' : String(storeCount)} color="var(--vc-info)" />
          <KpiCard icon={MessageCircle} label="Posts totales" value={isLoading ? '—' : String(totalPosts)} color="var(--vc-warning)" />
          <KpiCard icon={Star} label="Nivel promedio" value={isLoading ? '—' : avgLevel} color="var(--vc-lime-glow)" />
        </div>

        {/* Búsqueda */}
        <div className="relative" style={{ maxWidth: 300 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar miembro..."
            className="w-full rounded-lg py-2.5 pl-9 pr-3 text-xs outline-none"
            style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top miembros / búsqueda */}
            <div className="vc-card overflow-x-auto p-5">
              <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                {search ? `Resultados (${filtered.length})` : 'Top miembros'}
              </h2>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase tracking-wider">
                    <th className="pb-3">Miembro</th>
                    <th className="pb-3">Nivel</th>
                    <th className="pb-3">Rol</th>
                    <th className="pb-3 text-right">Pedidos</th>
                    <th className="pb-3 text-right">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m: any) => (
                    <tr key={m.id} style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                      <td className="py-3">
                        <p className="font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{m.name ?? 'Sin nombre'}</p>
                        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>{m.email}</p>
                      </td>
                      <td className="py-3">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-lime-main)', border: '1px solid var(--vc-lime-main)' }}>
                          {formatLevel(m.level ?? 1)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-[10px]" style={{ color: m.role === 'DROPSHIPPER' ? 'var(--vc-info)' : 'var(--vc-white-dim)' }}>
                          {m.role === 'DROPSHIPPER' ? 'Dropshipper' : 'Comunidad'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono">{m.orderCount ?? 0}</td>
                      <td className="py-3 text-right font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                        {(m.points ?? 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center" style={{ color: 'var(--vc-gray-mid)' }}>
                        {search ? 'No se encontraron miembros' : 'No hay miembros aún'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actividad reciente (posts) */}
            <div className="vc-card p-5">
              <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                Actividad reciente
              </h2>
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <p className="py-4 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin actividad reciente</p>
                ) : (
                  posts.map((p: any) => (
                    <div key={p.id} className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'var(--vc-black-soft)' }}>
                      <TrendingUp size={14} color="var(--vc-lime-main)" className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                          <span className="font-bold" style={{ color: 'var(--vc-white-soft)' }}>{p.author?.name ?? 'Usuario'}</span>
                          {' '}publicó: {p.body?.slice(0, 80)}{(p.body?.length ?? 0) > 80 ? '...' : ''}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                          {p.category ?? 'general'} · {p.likes} likes · {p.commentCount ?? 0} comentarios
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function KpiCard({ icon: Icon, label, value, color }: {
  icon: typeof Users; label: string; value: string; color: string
}) {
  return (
    <div className="vc-card flex items-center gap-3 p-4">
      <Icon size={20} color={color} />
      <div>
        <p className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>{value}</p>
        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
      </div>
    </div>
  )
}
