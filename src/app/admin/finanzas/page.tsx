import { DollarSign, TrendingUp, Wallet, Receipt } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Panel financiero — Colombia
// Liquidaciones, ingresos, egresos, comisiones de pasarela
const PAYMENTS = [
  { date: '08/04', concept: 'Wompi - Día completo', method: 'Wompi', in: '$ 2.480.000', out: '-', net: '$ 2.405.600' },
  { date: '08/04', concept: 'PSE - Bancolombia', method: 'PSE', in: '$ 1.150.000', out: '-', net: '$ 1.139.500' },
  { date: '08/04', concept: 'Nequi transferencias', method: 'Nequi', in: '$ 620.000', out: '-', net: '$ 614.000' },
  { date: '07/04', concept: 'Liquidación dropshippers', method: 'Bancolombia', in: '-', out: '$ 1.840.000', net: '-$ 1.840.000' },
  { date: '07/04', concept: 'Pago a proveedor Colágeno', method: 'Bancolombia', in: '-', out: '$ 4.200.000', net: '-$ 4.200.000' },
]

export default function FinanzasPage() {
  return (
    <>
      <AdminTopbar
        title="Finanzas"
        subtitle="Liquidaciones y movimientos · 🇨🇴 Colombia · Abril 2026"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <FinKpi label="Ingresos del mes" value="$ 38.4 M" delta="+22.1%" icon={<TrendingUp size={18} />} />
          <FinKpi label="Egresos del mes" value="$ 14.2 M" delta="+8.4%" icon={<Receipt size={18} />} />
          <FinKpi label="Utilidad neta" value="$ 24.2 M" delta="+31.5%" icon={<DollarSign size={18} />} />
          <FinKpi label="Por liquidar" value="$ 4.85 M" delta="47 dropshippers" icon={<Wallet size={18} />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div
            className="vc-card lg:col-span-2"
            style={{ minHeight: 280 }}
          >
            <h2
              className="mb-4 text-base font-bold"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Ingresos por método de pago (mes)
            </h2>
            <div className="space-y-4">
              {[
                { name: 'Wompi (tarjetas)', pct: 62, amount: '$ 23.8 M' },
                { name: 'PSE Bancolombia', pct: 22, amount: '$ 8.4 M' },
                { name: 'Nequi', pct: 11, amount: '$ 4.2 M' },
                { name: 'Daviplata', pct: 5, amount: '$ 2.0 M' },
              ].map((m) => (
                <div key={m.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--vc-white-soft)' }}>{m.name}</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: 'var(--vc-lime-main)' }}
                    >
                      {m.amount}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ background: 'var(--vc-black-soft)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${m.pct}%`,
                        background: 'var(--vc-gradient-primary)',
                        boxShadow: '0 0 12px var(--vc-glow-lime)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="vc-card">
            <h2
              className="mb-4 text-base font-bold"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Próxima liquidación
            </h2>
            <p
              className="mb-2 text-3xl font-black"
              style={{
                color: 'var(--vc-lime-main)',
                fontFamily: 'var(--font-display)',
              }}
            >
              $ 4.85 M
            </p>
            <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
              47 dropshippers · viernes 15 abril
            </p>
            <button className="vc-btn-primary mt-5 w-full">Procesar liquidación</button>
          </div>
        </div>

        <div className="vc-card overflow-x-auto">
          <h2
            className="mb-4 text-base font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Movimientos recientes
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-wider"
                style={{
                  color: 'var(--vc-gray-mid)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <th className="py-2">Fecha</th>
                <th className="py-2">Concepto</th>
                <th className="py-2">Método</th>
                <th className="py-2 text-right">Ingreso</th>
                <th className="py-2 text-right">Egreso</th>
                <th className="py-2 text-right">Neto</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p, i) => (
                <tr
                  key={i}
                  className="text-xs"
                  style={{
                    borderTop: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-dim)',
                  }}
                >
                  <td
                    className="py-3 font-mono"
                    style={{ color: 'var(--vc-gray-mid)' }}
                  >
                    {p.date}
                  </td>
                  <td className="py-3" style={{ color: 'var(--vc-white-soft)' }}>
                    {p.concept}
                  </td>
                  <td className="py-3">{p.method}</td>
                  <td
                    className="py-3 text-right font-mono"
                    style={{ color: 'var(--vc-lime-main)' }}
                  >
                    {p.in}
                  </td>
                  <td
                    className="py-3 text-right font-mono"
                    style={{ color: 'var(--vc-error)' }}
                  >
                    {p.out}
                  </td>
                  <td
                    className="py-3 text-right font-mono font-bold"
                    style={{ color: 'var(--vc-white-soft)' }}
                  >
                    {p.net}
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

function FinKpi({ label, value, delta, icon }: any) {
  return (
    <div className="vc-card">
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{
            color: 'var(--vc-gray-mid)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {label}
        </span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(198, 255, 60, 0.12)',
            color: 'var(--vc-lime-main)',
            border: '1px solid rgba(198, 255, 60, 0.3)',
          }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-2xl font-black"
        style={{
          color: 'var(--vc-white-soft)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-[11px] font-semibold"
        style={{ color: 'var(--vc-lime-main)' }}
      >
        {delta}
      </p>
    </div>
  )
}
