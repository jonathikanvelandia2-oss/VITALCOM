import { Inbox, Plus } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Inbox interno entre áreas Vitalcom
// Conversaciones por hilos clasificados por área y prioridad
const THREADS = [
  {
    id: '1',
    subject: 'Reposición urgente Colágeno hidrolizado',
    area: 'LOGISTICA',
    from: 'Diana M. · Ventas',
    last: 'Confirmado, llega mañana 8am al CD Bogotá',
    time: 'hace 5 min',
    priority: 'urgent',
    unread: 2,
  },
  {
    id: '2',
    subject: 'Campaña Día de la Madre — aprobaciones',
    area: 'MARKETING',
    from: 'Felipe R. · Marketing',
    last: 'Listos los 3 creativos, ¿revisamos hoy?',
    time: 'hace 18 min',
    priority: 'high',
    unread: 0,
  },
  {
    id: '3',
    subject: 'Liquidación dropshippers marzo',
    area: 'FINANZAS',
    from: 'Camila P. · Finanzas',
    last: 'Enviada planilla con 47 pagos pendientes',
    time: 'hace 1 h',
    priority: 'normal',
    unread: 1,
  },
  {
    id: '4',
    subject: 'Reclamo cliente VC-2026-00298',
    area: 'SOPORTE',
    from: 'Juan D. · Soporte',
    last: 'Cliente quiere devolución, autorización?',
    time: 'hace 2 h',
    priority: 'high',
    unread: 0,
  },
  {
    id: '5',
    subject: 'Nuevo proveedor Ashwagandha',
    area: 'PRODUCTO',
    from: 'Sara L. · Producto',
    last: 'Muestras llegaron, evaluamos calidad',
    time: 'ayer',
    priority: 'normal',
    unread: 0,
  },
]

const PRIO_COLORS: Record<string, { bg: string; fg: string }> = {
  urgent: { bg: 'rgba(255, 71, 87, 0.18)', fg: 'var(--vc-error)' },
  high:   { bg: 'rgba(255, 184, 0, 0.18)', fg: 'var(--vc-warning)' },
  normal: { bg: 'rgba(198, 255, 60, 0.12)', fg: 'var(--vc-lime-main)' },
}

export default function InboxPage() {
  return (
    <>
      <AdminTopbar
        title="Inbox interno"
        subtitle="Comunicación entre áreas · 8 hilos abiertos"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {['Todas', 'Dirección', 'Ventas', 'Logística', 'Marketing', 'Soporte', 'Finanzas', 'Producto'].map((a, i) => (
              <button
                key={a}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  background: i === 0 ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                  color: i === 0 ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: i === 0 ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <button className="vc-btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo hilo
          </button>
        </div>

        <div className="space-y-3">
          {THREADS.map((t) => {
            const c = PRIO_COLORS[t.priority]
            return (
              <button
                key={t.id}
                className="vc-card group flex w-full items-center gap-4 text-left"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: c.bg,
                    color: c.fg,
                    border: `1px solid ${c.fg}`,
                  }}
                >
                  <Inbox size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="truncate text-sm font-bold"
                      style={{
                        color: 'var(--vc-white-soft)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {t.subject}
                    </h3>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{
                        background: 'var(--vc-black-soft)',
                        color: 'var(--vc-lime-main)',
                        border: '1px solid var(--vc-gray-dark)',
                      }}
                    >
                      {t.area}
                    </span>
                    {t.unread > 0 && (
                      <span
                        className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                        style={{
                          background: 'var(--vc-lime-main)',
                          color: 'var(--vc-black)',
                        }}
                      >
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-1 truncate text-xs"
                    style={{ color: 'var(--vc-white-dim)' }}
                  >
                    <strong style={{ color: 'var(--vc-white-soft)' }}>
                      {t.from}:
                    </strong>{' '}
                    {t.last}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[10px]"
                  style={{
                    color: 'var(--vc-gray-mid)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {t.time}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
