import { Truck, Package, CheckCircle, RotateCcw, Wifi } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Fulfillment y despachos via Dropi
const KPIS = [
  { label: 'Pendientes despacho', value: '12', icon: Package, color: 'var(--vc-warning)' },
  { label: 'En transito', value: '34', icon: Truck, color: 'var(--vc-info)' },
  { label: 'Entregados hoy', value: '8', icon: CheckCircle, color: 'var(--vc-lime-main)' },
  { label: 'Devoluciones', value: '3', icon: RotateCcw, color: 'var(--vc-error)' },
]

const QUEUE = [
  { id: 'VC-2026-00412', customer: 'Maria Restrepo', city: 'Bogota', carrier: 'Servientrega', status: 'Pendiente' },
  { id: 'VC-2026-00411', customer: 'Carlos Vega', city: 'Medellin', carrier: 'Coordinadora', status: 'En transito' },
  { id: 'VC-2026-00410', customer: 'Ana Duque', city: 'Cali', carrier: 'Interrapidisimo', status: 'Pendiente' },
  { id: 'VC-2026-00409', customer: 'Julian Arbelaez', city: 'Barranquilla', carrier: 'Servientrega', status: 'En transito' },
  { id: 'VC-2026-00408', customer: 'Luisa Fernanda', city: 'Bucaramanga', carrier: 'Coordinadora', status: 'Entregado' },
  { id: 'VC-2026-00407', customer: 'Pedro Salazar', city: 'Pereira', carrier: 'Servientrega', status: 'Pendiente' },
]

const STATUS_COLOR: Record<string, string> = {
  'Pendiente': 'var(--vc-warning)',
  'En transito': 'var(--vc-info)',
  'Entregado': 'var(--vc-lime-main)',
}

export default function DespachosPage() {
  return (
    <>
      <AdminTopbar title="Despachos" subtitle="Fulfillment Dropi \u00b7 Colombia" />
      <div className="flex-1 space-y-6 p-6">
        {/* Dropi status */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--vc-black-soft)', border: '1px solid rgba(198,255,60,0.2)', display: 'inline-flex' }}>
          <Wifi size={14} color="var(--vc-lime-main)" />
          <span className="text-[11px] font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>Dropi conectado</span>
        </div>

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

        {/* Cola de despachos */}
        <div className="vc-card overflow-x-auto p-5">
          <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Cola de despachos</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase tracking-wider">
                <th className="pb-3">Pedido</th><th className="pb-3">Cliente</th><th className="pb-3">Ciudad</th><th className="pb-3">Transportadora</th><th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {QUEUE.map((q) => (
                <tr key={q.id} style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                  <td className="py-3 font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{q.id}</td>
                  <td className="py-3">{q.customer}</td>
                  <td className="py-3">{q.city}</td>
                  <td className="py-3">{q.carrier}</td>
                  <td className="py-3">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--vc-black-soft)', color: STATUS_COLOR[q.status], border: `1px solid ${STATUS_COLOR[q.status]}` }}>{q.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
