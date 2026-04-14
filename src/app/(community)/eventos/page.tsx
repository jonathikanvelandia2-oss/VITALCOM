'use client'

import { Calendar, Clock, Video, Users, Loader2 } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useEvents } from '@/hooks/useCourses'

// ── Eventos — datos reales de BD ────────────────────────

const TYPE_LABELS: Record<string, string> = {
  webinar: 'Webinar', live: 'Live', meetup: 'Meetup',
  workshop: 'Workshop', masterclass: 'Masterclass',
}

export default function EventosPage() {
  const { data, isLoading } = useEvents()
  const upcoming = data?.upcoming ?? []
  const past = data?.past ?? []

  return (
    <>
      <CommunityTopbar
        title="Eventos"
        subtitle={isLoading ? 'Cargando...' : `Lives, workshops y masterclasses · ${upcoming.length} próximos`}
      />
      <div className="flex-1 space-y-6 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Calendar size={48} color="var(--vc-gray-dark)" className="mx-auto mb-4" />
              <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>No hay eventos programados</p>
            </div>
          </div>
        ) : (
          <>
            {/* Próximos eventos */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
                  Próximos eventos
                </h2>
                <div className="space-y-4">
                  {upcoming.map((e: any) => <EventCard key={e.id} event={e} />)}
                </div>
              </div>
            )}

            {/* Eventos pasados */}
            {past.length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-heading)' }}>
                  Eventos anteriores
                </h2>
                <div className="space-y-4">
                  {past.map((e: any) => <EventCard key={e.id} event={e} isPast />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function EventCard({ event, isPast }: { event: any; isPast?: boolean }) {
  const d = new Date(event.date)
  const day = d.getDate()
  const month = d.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase()
  const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return (
    <article className="vc-card flex items-center gap-5" style={{ opacity: isPast ? 0.6 : 1 }}>
      {/* Fecha */}
      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl"
        style={{
          background: isPast ? 'var(--vc-black-soft)' : 'rgba(198,255,60,0.12)',
          border: isPast ? '1px solid var(--vc-gray-dark)' : '1px solid rgba(198,255,60,0.35)',
          boxShadow: isPast ? 'none' : '0 0 20px var(--vc-glow-lime)',
        }}>
        <span className="text-2xl font-black"
          style={{ color: isPast ? 'var(--vc-gray-mid)' : 'var(--vc-lime-main)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
          {day}
        </span>
        <span className="mt-1 text-[10px] font-bold tracking-wider"
          style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
          {month}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
          style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.3)' }}>
          {TYPE_LABELS[event.type] || event.type}
        </span>
        <h3 className="mt-2 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-1 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>{event.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-4 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
          <span className="flex items-center gap-1"><Clock size={11} /> {time} (COL)</span>
          {event.speaker && <span className="flex items-center gap-1"><Video size={11} /> {event.speaker}</span>}
        </div>
      </div>

      {!isPast && event.link && (
        <a href={event.link} target="_blank" rel="noopener noreferrer"
          className="vc-btn-primary shrink-0" style={{ padding: '0.6rem 1.25rem' }}>
          Unirse
        </a>
      )}
      {!isPast && !event.link && (
        <span className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold"
          style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-gray-mid)', border: '1px solid var(--vc-gray-dark)' }}>
          Próximamente
        </span>
      )}
    </article>
  )
}
