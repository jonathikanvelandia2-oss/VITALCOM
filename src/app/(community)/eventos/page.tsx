import { Calendar, Clock, Video, Users } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

const EVENTS = [
  {
    date: '12',
    month: 'ABR',
    title: 'Live: Cómo armar tu primer pedido en Dropi',
    time: '7:00 PM (COL)',
    speaker: 'Felipe R. · Marketing Vitalcom',
    attendees: 184,
    type: 'live',
  },
  {
    date: '15',
    month: 'ABR',
    title: 'Workshop: Calculadora de precios paso a paso',
    time: '6:00 PM (COL)',
    speaker: 'Diana M. · Ventas',
    attendees: 92,
    type: 'workshop',
  },
  {
    date: '20',
    month: 'ABR',
    title: 'Q&A con el CEO de Vitalcom',
    time: '5:00 PM (COL)',
    speaker: 'Juan Carlos · CEO',
    attendees: 312,
    type: 'live',
  },
  {
    date: '25',
    month: 'ABR',
    title: 'Masterclass: WhatsApp Business para vender más',
    time: '7:00 PM (COL)',
    speaker: 'Verónica S. · Top Seller',
    attendees: 145,
    type: 'masterclass',
  },
]

export default function EventosPage() {
  return (
    <>
      <CommunityTopbar
        title="Eventos"
        subtitle="Lives, workshops y masterclasses · Abril 2026"
      />
      <div className="flex-1 space-y-4 p-6">
        {EVENTS.map((e) => (
          <article
            key={e.title}
            className="vc-card flex items-center gap-5"
          >
            {/* Fecha */}
            <div
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl"
              style={{
                background: 'rgba(198, 255, 60, 0.12)',
                border: '1px solid rgba(198, 255, 60, 0.35)',
                boxShadow: '0 0 20px var(--vc-glow-lime)',
              }}
            >
              <span
                className="text-2xl font-black"
                style={{
                  color: 'var(--vc-lime-main)',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                }}
              >
                {e.date}
              </span>
              <span
                className="mt-1 text-[10px] font-bold tracking-wider"
                style={{
                  color: 'var(--vc-white-dim)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {e.month}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                style={{
                  background: 'rgba(198, 255, 60, 0.12)',
                  color: 'var(--vc-lime-main)',
                  border: '1px solid rgba(198, 255, 60, 0.3)',
                }}
              >
                {e.type}
              </span>
              <h3
                className="mt-2 text-base font-bold"
                style={{
                  color: 'var(--vc-white-soft)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {e.title}
              </h3>
              <div
                className="mt-1 flex flex-wrap items-center gap-4 text-[11px]"
                style={{ color: 'var(--vc-white-dim)' }}
              >
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {e.time}
                </span>
                <span className="flex items-center gap-1">
                  <Video size={11} /> {e.speaker}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} /> {e.attendees} confirmados
                </span>
              </div>
            </div>

            <button
              className="vc-btn-primary shrink-0"
              style={{ padding: '0.6rem 1.25rem' }}
            >
              Reservar
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
