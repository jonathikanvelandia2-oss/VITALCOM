import { Users, Store, MessageCircle, Star, TrendingUp } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Gestion de la comunidad VITALCOMMERS
const KPIS = [
  { label: 'Miembros', value: '1.547', icon: Users, color: 'var(--vc-lime-main)' },
  { label: 'Tiendas conectadas', value: '347', icon: Store, color: 'var(--vc-info)' },
  { label: 'Posts hoy', value: '12', icon: MessageCircle, color: 'var(--vc-warning)' },
  { label: 'Nivel promedio', value: '3.2', icon: Star, color: 'var(--vc-lime-glow)' },
]

const TOP_MEMBERS = [
  { name: 'Camila Torres', level: 7, orders: 134, revenue: '$ 18.400.000' },
  { name: 'Andres Guzman', level: 6, orders: 98, revenue: '$ 12.100.000' },
  { name: 'Valentina Rios', level: 6, orders: 87, revenue: '$ 9.850.000' },
  { name: 'Santiago Mejia', level: 5, orders: 62, revenue: '$ 7.200.000' },
  { name: 'Laura Bedoya', level: 5, orders: 54, revenue: '$ 5.900.000' },
]

const ACTIVITY = [
  { text: 'Camila Torres publico "5 tips para vender en redes"', time: 'Hace 12 min' },
  { text: 'Santiago Mejia alcanzo el nivel Rama', time: 'Hace 34 min' },
  { text: 'Valentina Rios completo el curso Dropshipping 101', time: 'Hace 1h' },
  { text: 'Nuevo miembro: Julian Arbelaez', time: 'Hace 2h' },
  { text: 'Andres Guzman genero 3 pedidos desde su tienda', time: 'Hace 3h' },
]

export default function ComunidadPage() {
  return (
    <>
      <AdminTopbar title="Comunidad VITALCOMMERS" subtitle="1.547 miembros activos" />
      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="vc-card flex items-center gap-3 p-4">
              <k.icon size={20} color={k.color} />
              <div>
                <p className="text-xl font-bold" style={{ color: k.color, fontFamily: 'var(--font-heading)' }}>{k.value}</p>
                <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top miembros */}
          <div className="vc-card overflow-x-auto p-5">
            <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Top miembros</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Miembro</th><th className="pb-3">Nivel</th><th className="pb-3 text-right">Pedidos</th><th className="pb-3 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {TOP_MEMBERS.map((m) => (
                  <tr key={m.name} style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                    <td className="py-3 font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{m.name}</td>
                    <td className="py-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-lime-main)', border: '1px solid var(--vc-lime-main)' }}>{m.level}</span></td>
                    <td className="py-3 text-right font-mono">{m.orders}</td>
                    <td className="py-3 text-right font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{m.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actividad reciente */}
          <div className="vc-card p-5">
            <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Actividad reciente</h2>
            <div className="space-y-3">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'var(--vc-black-soft)' }}>
                  <TrendingUp size={14} color="var(--vc-lime-main)" className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>{a.text}</p>
                    <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
