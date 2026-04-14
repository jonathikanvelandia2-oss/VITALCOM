import { Receipt, DollarSign, Clock, Plus } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Facturacion y liquidaciones de dropshippers
const KPIS = [
  { label: 'Facturas mes', value: '89', icon: Receipt, color: 'var(--vc-lime-main)' },
  { label: 'Por cobrar', value: '$ 4.2M', icon: DollarSign, color: 'var(--vc-warning)' },
  { label: 'Liquidaciones pendientes', value: '12', icon: Clock, color: 'var(--vc-info)' },
]

const INVOICES = [
  { number: 'FV-2026-0089', client: 'Camila Torres', amount: '$ 1.240.000', status: 'pagada', date: '12 Abr' },
  { number: 'FV-2026-0088', client: 'Tienda Bienestar SAS', amount: '$ 3.800.000', status: 'pendiente', date: '11 Abr' },
  { number: 'FV-2026-0087', client: 'Andres Guzman', amount: '$ 890.000', status: 'pagada', date: '10 Abr' },
  { number: 'FV-2026-0086', client: 'Valentina Rios', amount: '$ 1.560.000', status: 'pendiente', date: '09 Abr' },
  { number: 'FV-2026-0085', client: 'Santiago Mejia', amount: '$ 720.000', status: 'pagada', date: '08 Abr' },
  { number: 'FV-2026-0084', client: 'Laura Bedoya', amount: '$ 445.000', status: 'pendiente', date: '07 Abr' },
]

export default function FacturacionPage() {
  return (
    <>
      <AdminTopbar title="Facturacion" subtitle="Facturas y liquidaciones dropshippers" />
      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {KPIS.map((k) => (
            <div key={k.label} className="vc-card flex items-center gap-4 p-5">
              <k.icon size={20} color={k.color} />
              <div>
                <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: 'var(--font-heading)' }}>{k.value}</p>
                <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button className="vc-btn-primary flex items-center gap-2"><Plus size={16} /> Nueva factura</button>
        </div>

        {/* Tabla de facturas */}
        <div className="vc-card overflow-x-auto p-5">
          <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Facturas recientes</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase tracking-wider">
                <th className="pb-3">Numero</th><th className="pb-3">Cliente</th><th className="pb-3">Fecha</th><th className="pb-3 text-right">Monto</th><th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.number} style={{ borderTop: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)' }}>
                  <td className="py-3 font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{inv.number}</td>
                  <td className="py-3">{inv.client}</td>
                  <td className="py-3" style={{ fontFamily: 'var(--font-mono)' }}>{inv.date}</td>
                  <td className="py-3 text-right font-mono font-bold" style={{ color: 'var(--vc-white-soft)' }}>{inv.amount}</td>
                  <td className="py-3">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{
                      background: 'var(--vc-black-soft)',
                      color: inv.status === 'pagada' ? 'var(--vc-lime-main)' : 'var(--vc-warning)',
                      border: `1px solid ${inv.status === 'pagada' ? 'var(--vc-lime-main)' : 'var(--vc-warning)'}`,
                    }}>{inv.status}</span>
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
