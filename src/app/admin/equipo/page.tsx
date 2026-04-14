'use client'

import { useState } from 'react'
import { Loader2, Plus, X, Save } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminUsers, useCreateUser, useUpdateUser, useDeactivateUser } from '@/hooks/useAdminUsers'

const AREA_COLORS: Record<string, string> = {
  DIRECCION: 'var(--vc-lime-main)',
  MARKETING: 'var(--vc-info)',
  COMERCIAL: 'var(--vc-warning)',
  ADMINISTRATIVA: '#c084fc',
  LOGISTICA: '#f97316',
  CONTABILIDAD: '#22d3ee',
}

const AREA_LABELS: Record<string, string> = {
  DIRECCION: 'Dirección',
  MARKETING: 'Marketing',
  COMERCIAL: 'Comercial',
  ADMINISTRATIVA: 'Administrativa',
  LOGISTICA: 'Logística',
  CONTABILIDAD: 'Contabilidad',
}

const STAFF_ROLES = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'] as const

export default function EquipoPage() {
  const [areaFilter, setAreaFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Solo staff (roles internos)
  const { data, isLoading } = useAdminUsers({
    role: areaFilter ? undefined : undefined,
    area: areaFilter || undefined,
    limit: 100,
  })

  // Filtrar solo staff de los resultados
  const allUsers = (data?.users ?? []).filter((u: any) => STAFF_ROLES.includes(u.role))
  const staffCount = allUsers.length
  const areas = Object.keys(AREA_COLORS)

  return (
    <>
      <AdminTopbar title="Equipo Vitalcom" subtitle={isLoading ? 'Cargando...' : `${areas.length} áreas · ${staffCount} colaboradores`} />
      <div className="flex-1 space-y-6 p-6">
        {/* Filtros de área + botón nuevo */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setAreaFilter('')}
              className="flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                background: !areaFilter ? 'var(--vc-lime-main)' : 'var(--vc-black-soft)',
                color: !areaFilter ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                border: !areaFilter ? 'none' : '1px solid var(--vc-gray-dark)',
                fontFamily: 'var(--font-mono)',
              }}>
              Todas
            </button>
            {areas.map((area) => {
              const color = AREA_COLORS[area]
              return (
                <button key={area} onClick={() => setAreaFilter(area === areaFilter ? '' : area)}
                  className="flex items-center gap-2 rounded-full px-3 py-1"
                  style={{ background: areaFilter === area ? color : 'var(--vc-black-soft)', border: `1px solid ${color}` }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: areaFilter === area ? 'var(--vc-black)' : color }} />
                  <span className="text-[11px] font-bold"
                    style={{ color: areaFilter === area ? 'var(--vc-black)' : color, fontFamily: 'var(--font-mono)' }}>
                    {AREA_LABELS[area] ?? area}
                  </span>
                </button>
              )
            })}
          </div>
          <button onClick={() => setShowForm(true)} className="vc-btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo miembro
          </button>
        </div>

        {/* Modal de crear miembro */}
        {showForm && <CreateMemberForm onClose={() => setShowForm(false)} />}

        {/* Grid de miembros */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allUsers.map((m: any) => (
              <MemberCard key={m.id} member={m} />
            ))}
            {allUsers.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
                  {areaFilter ? `No hay miembros en ${AREA_LABELS[areaFilter]}` : 'No hay miembros del equipo'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function MemberCard({ member }: { member: any }) {
  const updateUser = useUpdateUser()
  const deactivateUser = useDeactivateUser()
  const areaColor = AREA_COLORS[member.area] || 'var(--vc-lime-main)'
  const initials = (member.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="vc-card flex items-center gap-4 p-4" style={{ opacity: member.active ? 1 : 0.5 }}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ background: areaColor, color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{member.name ?? 'Sin nombre'}</p>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: member.active ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
        </div>
        <p className="text-[10px]" style={{ color: areaColor, fontFamily: 'var(--font-mono)' }}>
          {AREA_LABELS[member.area] ?? member.area ?? '—'}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>{member.role}</p>
      </div>
      {member.active && (
        <button onClick={() => { if (confirm(`¿Desactivar a ${member.name}?`)) deactivateUser.mutate(member.id) }}
          className="rounded px-2 py-1 text-[9px]"
          style={{ background: 'rgba(255,71,87,0.1)', color: 'var(--vc-error)', border: '1px solid rgba(255,71,87,0.3)' }}>
          {deactivateUser.isPending ? '...' : 'Desactivar'}
        </button>
      )}
    </div>
  )
}

function CreateMemberForm({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' as string, area: 'COMERCIAL' as string })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createUser.mutate(form as any, { onSuccess: () => onClose() })
  }

  const inputStyle = { background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }

  return (
    <div className="vc-card p-5" style={{ borderColor: 'rgba(198,255,60,0.3)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          Nuevo miembro del equipo
        </h3>
        <button onClick={onClose}><X size={16} color="var(--vc-gray-mid)" /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo"
          required className="rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email"
          required className="rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña" type="password"
          required minLength={6} className="rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle}>
          <option value="EMPLOYEE">Empleado</option>
          <option value="MANAGER_AREA">Líder de área</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
          className="rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle}>
          {Object.entries(AREA_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" disabled={createUser.isPending}
          className="vc-btn-primary flex items-center justify-center gap-2">
          {createUser.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Crear miembro
        </button>
      </form>
      {createUser.isError && (
        <p className="mt-2 text-xs" style={{ color: 'var(--vc-error)' }}>{(createUser.error as Error).message}</p>
      )}
    </div>
  )
}
