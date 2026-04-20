'use client'

import { useState, useMemo } from 'react'
import {
  Video, Plus, Search, Radio, Clock, ExternalLink, X, Monitor, Loader2, Trash2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useMeetings,
  useCreateMeeting,
  useDeleteMeeting,
} from '@/hooks/useMeetings'
import { useSession } from 'next-auth/react'

// ── Sala de Reuniones Vitalcom ──────────────────────────
// Conectada a /api/meetings — cada usuario gestiona sus propias
// reuniones (hasta que agreguemos RSVP grupales en V13).

type MeetingPlatform = 'meet' | 'zoom' | 'teams'
type Tab = 'todas' | 'proximas' | 'pasadas'

const PLATFORM_COLORS: Record<MeetingPlatform, string> = {
  meet: 'rgba(66, 133, 244, 0.15)',
  zoom: 'rgba(45, 140, 255, 0.15)',
  teams: 'rgba(98, 100, 167, 0.15)',
}

const PLATFORM_LABELS: Record<MeetingPlatform, string> = {
  meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
}

function detectPlatform(link: string | null | undefined): MeetingPlatform {
  if (!link) return 'meet'
  if (link.includes('zoom')) return 'zoom'
  if (link.includes('teams.microsoft') || link.includes('teams.live')) return 'teams'
  return 'meet'
}

function formatFecha(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  if (diff < 0 && diff > -3 * 60 * 60 * 1000) return `Hace ${Math.round(-diff / 60000)} min`
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dia = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDias = Math.round((dia.getTime() - hoy.getTime()) / 86400000)
  const hora = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  if (diffDias === 0) return `Hoy ${hora}`
  if (diffDias === 1) return `Mañana ${hora}`
  return (
    date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) + `, ${hora}`
  )
}

export default function ReunionesPage() {
  const { data: session } = useSession()
  const { data, isLoading } = useMeetings()
  const create = useCreateMeeting()
  const del = useDeleteMeeting()

  const [tab, setTab] = useState<Tab>('todas')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const all = useMemo(() => {
    const upcoming = (data?.upcoming ?? []) as any[]
    const past = (data?.past ?? []) as any[]
    return [...upcoming, ...past]
  }, [data])

  const filtered = useMemo(() => {
    const now = Date.now()
    return all
      .filter((m) => {
        if (tab === 'proximas') return new Date(m.date).getTime() >= now && m.status === 'scheduled'
        if (tab === 'pasadas') return new Date(m.date).getTime() < now || m.status !== 'scheduled'
        return true
      })
      .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [all, tab, search])

  const liveCount = all.filter((m) => {
    const d = new Date(m.date).getTime()
    return d <= Date.now() && d > Date.now() - 90 * 60 * 1000 && m.status === 'scheduled'
  }).length

  const proxCount = all.filter(
    (m) => new Date(m.date).getTime() > Date.now() && m.status === 'scheduled',
  ).length

  return (
    <>
      <CommunityTopbar title="Reuniones" subtitle="Sala de reuniones · Comunidad y grupos de trabajo" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Video} label="Total" value={all.length} />
          <StatCard icon={Radio} label="En vivo" value={liveCount} highlight />
          <StatCard icon={Clock} label="Próximas" value={proxCount} />
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--vc-gray-mid)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar reunión..."
              className="w-full rounded-lg py-3 pl-10 pr-4 text-sm outline-none"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-soft)',
              }}
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="vc-btn-primary flex items-center gap-2 px-5 text-xs"
          >
            <Plus size={14} /> Crear reunión
          </button>
        </div>

        <div className="flex gap-2">
          {(
            [
              { id: 'todas' as Tab, label: 'Todas' },
              { id: 'proximas' as Tab, label: 'Próximas' },
              { id: 'pasadas' as Tab, label: 'Pasadas' },
            ]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="rounded-lg px-4 py-2 text-xs font-bold transition-all"
              style={{
                background: tab === t.id ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                color: tab === t.id ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                border: tab === t.id ? '1px solid rgba(198,255,60,0.3)' : '1px solid var(--vc-gray-dark)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: 'var(--vc-gray-mid)' }}>
              <Video size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay reuniones</p>
              <p className="mt-1 text-xs">Crea una nueva para empezar</p>
            </div>
          ) : (
            filtered.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                canDelete={(session?.user as any)?.id === m.userId}
                onDelete={() => {
                  if (confirm('¿Eliminar esta reunión?')) del.mutate(m.id)
                }}
              />
            ))
          )}
        </div>
      </div>

      {showForm && (
        <CreateMeetingModal
          onClose={() => setShowForm(false)}
          onSubmit={(data) => create.mutate(data, { onSuccess: () => setShowForm(false) })}
          isPending={create.isPending}
          error={create.error as Error | null}
        />
      )}
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: any
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="vc-card text-center">
      <Icon
        size={20}
        className="mx-auto mb-2"
        style={{ color: highlight ? 'var(--vc-error)' : 'var(--vc-lime-main)' }}
      />
      <p
        className="text-2xl font-black"
        style={{
          color: highlight ? 'var(--vc-error)' : 'var(--vc-white)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}
      >
        {label}
      </p>
    </div>
  )
}

function MeetingCard({
  meeting,
  canDelete,
  onDelete,
}: {
  meeting: any
  canDelete: boolean
  onDelete: () => void
}) {
  const date = new Date(meeting.date)
  const now = Date.now()
  const isLive = date.getTime() <= now && date.getTime() > now - 90 * 60 * 1000 && meeting.status === 'scheduled'
  const isUpcoming = date.getTime() > now && meeting.status === 'scheduled'
  const platform = detectPlatform(meeting.link)

  return (
    <div
      className="vc-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ padding: '1.25rem' }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ background: PLATFORM_COLORS[platform] }}
        >
          <Monitor size={20} style={{ color: 'var(--vc-white-soft)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {isLive && (
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--vc-error)' }}
              >
                <span
                  className="vc-pulse h-2 w-2 rounded-full"
                  style={{ background: 'var(--vc-error)', boxShadow: '0 0 8px var(--vc-error)' }}
                />
                EN VIVO
              </span>
            )}
            {isUpcoming && (
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ background: 'rgba(255,184,0,0.1)', color: 'var(--vc-warning)' }}
              >
                PRÓXIMA
              </span>
            )}
            {!isLive && !isUpcoming && (
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-gray-mid)' }}
              >
                FINALIZADA
              </span>
            )}
          </div>
          <p
            className="truncate text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            {meeting.title}
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
            {formatFecha(meeting.date)} · {PLATFORM_LABELS[platform]}
            {meeting.duration ? ` · ${meeting.duration}min` : ''}
          </p>
          {meeting.description && (
            <p className="mt-1 line-clamp-1 text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
              {meeting.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {meeting.link && (isLive || isUpcoming) ? (
          <a
            href={meeting.link}
            target="_blank"
            rel="noopener noreferrer"
            className="vc-btn-primary flex items-center gap-2 px-4 py-2 text-xs"
          >
            <ExternalLink size={14} /> {isLive ? 'Unirse' : 'Ver enlace'}
          </a>
        ) : (
          <span
            className="rounded-lg px-4 py-2 text-xs font-medium"
            style={{
              background: 'var(--vc-black-soft)',
              color: 'var(--vc-gray-mid)',
              border: '1px solid var(--vc-gray-dark)',
            }}
          >
            {isUpcoming ? 'Pronto' : 'Cerrada'}
          </span>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            aria-label="Eliminar"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:brightness-125"
            style={{ border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-gray-mid)' }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

function CreateMeetingModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  onClose: () => void
  onSubmit: (data: { title: string; date: string; duration?: number; link?: string; description?: string }) => void
  isPending: boolean
  error: Error | null
}) {
  const [form, setForm] = useState({
    title: '',
    date: '',
    duration: 60,
    link: '',
    description: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      title: form.title,
      date: new Date(form.date).toISOString(),
      duration: form.duration,
      link: form.link || undefined,
      description: form.description || undefined,
    })
  }

  const inputStyle = {
    background: 'var(--vc-black-soft)',
    border: '1px solid var(--vc-gray-dark)',
    color: 'var(--vc-white-soft)',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="vc-card w-full max-w-lg"
        style={{ padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="heading-sm">Nueva reunión</h3>
          <button onClick={onClose} style={{ color: 'var(--vc-gray-mid)' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-sm mb-2 block">Título</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Reunión semanal equipo ventas"
              className="w-full rounded-lg px-3 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="label-sm mb-2 block">Fecha y hora</label>
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg px-3 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm mb-2 block">Duración (min)</label>
              <input
                type="number"
                min={15}
                max={480}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                className="w-full rounded-lg px-3 py-3 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="label-sm mb-2 block">Enlace (opcional)</label>
              <input
                type="url"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="w-full rounded-lg px-3 py-3 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="label-sm mb-2 block">Descripción (opcional)</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full resize-none rounded-lg px-3 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--vc-error)' }}>
              {error.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="vc-btn-primary flex flex-1 items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Crear reunión
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
