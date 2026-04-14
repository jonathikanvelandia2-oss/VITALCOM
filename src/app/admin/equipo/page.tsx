import { Users } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Equipo interno de Vitalcom
const TEAM = [
  { name: 'Jonathikan Velandia', area: 'Direccion', role: 'CEO', active: true },
  { name: 'Carolina Mendez', area: 'Marketing', role: 'Lider Marketing', active: true },
  { name: 'Felipe Rios', area: 'Marketing', role: 'Community Manager', active: true },
  { name: 'Daniela Ortiz', area: 'Marketing', role: 'Disenadora', active: true },
  { name: 'Andres Gomez', area: 'Comercial', role: 'Lider Comercial', active: true },
  { name: 'Valentina Salas', area: 'Comercial', role: 'Ejecutiva de ventas', active: true },
  { name: 'Sergio Pena', area: 'Comercial', role: 'Ejecutivo de ventas', active: false },
  { name: 'Laura Cifuentes', area: 'Administrativa', role: 'Asistente admin', active: true },
  { name: 'Monica Ruiz', area: 'Administrativa', role: 'Recursos Humanos', active: true },
  { name: 'Carlos Vega', area: 'Logistica', role: 'Lider Logistica', active: true },
  { name: 'Jorge Betancur', area: 'Logistica', role: 'Coordinador despachos', active: true },
  { name: 'Ana Duque', area: 'Logistica', role: 'Auxiliar bodega', active: true },
  { name: 'Patricia Lopez', area: 'Contabilidad', role: 'Contadora', active: true },
  { name: 'Raul Herrera', area: 'Contabilidad', role: 'Auxiliar contable', active: true },
]

const AREA_COLORS: Record<string, string> = {
  Direccion: 'var(--vc-lime-main)',
  Marketing: 'var(--vc-info)',
  Comercial: 'var(--vc-warning)',
  Administrativa: '#c084fc',
  Logistica: '#f97316',
  Contabilidad: '#22d3ee',
}

export default function EquipoPage() {
  return (
    <>
      <AdminTopbar title="Equipo Vitalcom" subtitle="5 areas \u00b7 14 colaboradores" />
      <div className="flex-1 space-y-6 p-6">
        {/* Resumen areas */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(AREA_COLORS).map(([area, color]) => (
            <div key={area} className="flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'var(--vc-black-soft)', border: `1px solid ${color}` }}>
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-[11px] font-bold" style={{ color, fontFamily: 'var(--font-mono)' }}>{area}</span>
            </div>
          ))}
        </div>

        {/* Grid de miembros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m) => (
            <div key={m.name} className="vc-card flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{
                background: AREA_COLORS[m.area] || 'var(--vc-lime-main)',
                color: 'var(--vc-black)',
                fontFamily: 'var(--font-heading)',
              }}>
                {m.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{m.name}</p>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: m.active ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
                </div>
                <p className="text-[10px]" style={{ color: AREA_COLORS[m.area], fontFamily: 'var(--font-mono)' }}>{m.area}</p>
                <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
