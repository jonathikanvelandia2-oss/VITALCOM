'use client'

import { useState, useMemo } from 'react'
import {
  Video, Plus, Search, Users, Radio, Clock, Calendar,
  ExternalLink, X, ChevronDown, Monitor, Loader2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useMeetings, useCreateMeeting } from '@/hooks/useMeetings'

// ── Sala de Reuniones Vitalcom ──────────────────────────
// Reuniones de comunidad y grupos de trabajo.
// Soporte: Google Meet, Zoom, Teams.

type MeetingType = 'comunidad' | 'grupo'
type MeetingStatus = 'live' | 'proxima' | 'finalizada'
type MeetingPlatform = 'meet' | 'zoom' | 'teams'
type Tab = 'todas' | 'comunidad' | 'grupos'

interface Participant {
  id: string
  initials: string
  color: string
}

interface Meeting {
  id: string
  titulo: string
  tipo: MeetingType
  plataforma: MeetingPlatform
  enlace: string
  fecha: string
  anfitrion: string
  descripcion?: string
  estado: MeetingStatus
  participantes: Participant[]
  totalParticipantes: number
}

const PLATFORM_LABELS: Record<MeetingPlatform, string> = {
  meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
}

const PLATFORM_COLORS: Record<MeetingPlatform, string> = {
  meet: 'rgba(66, 133, 244, 0.15)',
  zoom: 'rgba(45, 140, 255, 0.15)',
  teams: 'rgba(98, 100, 167, 0.15)',
}

// Datos demo — se conectará a API real
const INITIAL_MEETINGS: Meeting[] = [
  {
    id: '1',
    titulo: 'Reunión general VITALCOM COL',
    tipo: 'comunidad',
    plataforma: 'meet',
    enlace: 'https://meet.google.com/gdy-ygdt-ssm',
    fecha: new Date().toISOString(),
    anfitrion: 'VITALCOM COL',
    estado: 'live',
    participantes: [
      { id: '1', initials: 'JL', color: 'var(--vc-lime-main)' },
      { id: '2', initials: 'AG', color: 'var(--vc-info)' },
      { id: '3', initials: 'BA', color: 'var(--vc-warning)' },
    ],
    totalParticipantes: 100,
  },
  {
    id: '2',
    titulo: 'Grupo Alfa — Estrategia Q2',
    tipo: 'grupo',
    plataforma: 'meet',
    enlace: 'https://meet.google.com/abc-defg-hij',
    fecha: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    anfitrion: 'Gustavo Calderón',
    estado: 'proxima',
    participantes: [],
    totalParticipantes: 8,
  },
  {
    id: '3',
    titulo: 'Onboarding nuevos miembros',
    tipo: 'comunidad',
    plataforma: 'meet',
    enlace: 'https://meet.google.com/xyz-uvwx-yzk',
    fecha: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    anfitrion: 'Jonathan Velandia',
    estado: 'proxima',
    participantes: [],
    totalParticipantes: 25,
  },
  {
    id: '4',
    titulo: 'Equipo técnico — Revisión producto',
    tipo: 'grupo',
    plataforma: 'zoom',
    enlace: 'https://zoom.us/j/123456789',
    fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    anfitrion: 'Keitel Zakir',
    estado: 'proxima',
    participantes: [],
    totalParticipantes: 12,
  },
  {
    id: '5',
    titulo: 'Capacitación dropshipping avanzado',
    tipo: 'comunidad',
    plataforma: 'meet',
    enlace: 'https://meet.google.com/cap-drop-adv',
    fecha: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    anfitrion: 'Bryan Avendaño',
    estado: 'proxima',
    participantes: [],
    totalParticipantes: 45,
  },
]

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
  return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) + `, ${hora}`
}

export default function ReunionesPage() {
  const { data: apiData } = useMeetings()
  const createMeeting = useCreateMeeting()

  // Combinar datos de API con fallback estático
  const apiMeetings: Meeting[] = [...(apiData?.upcoming ?? []), ...(apiData?.past ?? [])].map((m: any) => ({
    id: m.id,
    titulo: m.title,
    tipo: 'comunidad' as MeetingType,
    plataforma: 'meet' as MeetingPlatform,
    enlace: m.link || '',
    fecha: m.date,
    anfitrion: '',
    descripcion: m.description,
    estado: m.status === 'completed' ? 'finalizada' as MeetingStatus : new Date(m.date) <= new Date() ? 'live' as MeetingStatus : 'proxima' as MeetingStatus,
    participantes: [],
    totalParticipantes: 0,
  }))
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS)
  const allMeetings = apiMeetings.length > 0 ? apiMeetings : meetings
  const [tab, setTab] = useState<Tab>('todas')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = useMemo(() => {
    return allMeetings
      .filter(m => {
        if (tab === 'comunidad') return m.tipo === 'comunidad'
        if (tab === 'grupos') return m.tipo === 'grupo'
        return true
      })
      .filter(m =>
        m.titulo.toLowerCase().includes(search.toLowerCase()) ||
        m.anfitrion.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (a.estado === 'live' && b.estado !== 'live') return -1
        if (b.estado === 'live' && a.estado !== 'live') return 1
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      })
  }, [meetings, tab, search])

  const liveCount = meetings.filter(m => m.estado === 'live').length
  const proxCount = meetings.filter(m => m.estado === 'proxima').length

  function handleCreate(m: Meeting) {
    setMeetings(prev => [...prev, m])
    setShowForm(false)
  }

  return (
    <>
      <CommunityTopbar title="Reuniones" subtitle="Sala de reuniones · Comunidad y grupos de trabajo" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Video} label="Total reuniones" value={meetings.length} />
          <StatCard icon={Radio} label="En vivo ahora" value={liveCount} highlight />
          <StatCard icon={Clock} label="Próximas" value={proxCount} />
        </div>

        {/* Barra de búsqueda + crear */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar reuniones o anfitrión..."
              className="w-full rounded-lg py-3 pl-10 pr-4 text-sm outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
          </div>
          <button onClick={() => setShowForm(true)} className="vc-btn-primary flex items-center gap-2 px-5 text-xs">
            <Plus size={14} /> Crear reunión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { id: 'todas' as Tab, label: 'Todas' },
            { id: 'comunidad' as Tab, label: 'Comunidad' },
            { id: 'grupos' as Tab, label: 'Grupos de trabajo' },
          ]).map((t) => (
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

        {/* Lista de reuniones */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: 'var(--vc-gray-mid)' }}>
              <Video size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay reuniones</p>
              <p className="text-xs mt-1">Crea una nueva o cambia el filtro</p>
            </div>
          ) : (
            filtered.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))
          )}
        </div>
      </div>

      {/* Modal crear reunión */}
      {showForm && <CreateMeetingModal onClose={() => setShowForm(false)} onCreate={handleCreate} />}
    </>
  )
}

// ── Stat Card ───────────────────────────────────────────

function StatCard({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: number; highlight?: boolean }) {
  return (
    <div className="vc-card text-center">
      <Icon size={20} className="mx-auto mb-2" style={{ color: highlight ? 'var(--vc-error)' : 'var(--vc-lime-main)' }} />
      <p className="text-2xl font-black" style={{ color: highlight ? 'var(--vc-error)' : 'var(--vc-white)', fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>{label}</p>
    </div>
  )
}

// ── Meeting Card ────────────────────────────────────────

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const isLive = meeting.estado === 'live'

  return (
    <div className="vc-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ padding: '1.25rem' }}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Ícono plataforma */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: PLATFORM_COLORS[meeting.plataforma] }}>
          <Monitor size={20} style={{ color: 'var(--vc-white-soft)' }} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--vc-error)' }}>
                <span className="h-2 w-2 rounded-full vc-pulse" style={{ background: 'var(--vc-error)', boxShadow: '0 0 8px var(--vc-error)' }} />
                EN VIVO
              </span>
            )}
            {meeting.estado === 'proxima' && (
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: 'rgba(255,184,0,0.1)', color: 'var(--vc-warning)' }}>
                PRÓXIMA
              </span>
            )}
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{
              background: meeting.tipo === 'comunidad' ? 'rgba(198,255,60,0.08)' : 'rgba(60,198,255,0.08)',
              color: meeting.tipo === 'comunidad' ? 'var(--vc-lime-main)' : 'var(--vc-info)',
            }}>
              {meeting.tipo === 'comunidad' ? 'Comunidad' : 'Grupo'}
            </span>
          </div>

          {/* Título y detalles */}
          <p className="truncate text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>{meeting.titulo}</p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
            {formatFecha(meeting.fecha)} · {meeting.anfitrion} · {PLATFORM_LABELS[meeting.plataforma]}
          </p>
        </div>
      </div>

      {/* Participantes + botón */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Avatares mini */}
        <div className="flex items-center">
          {meeting.participantes.slice(0, 3).map((p, i) => (
            <div
              key={p.id}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold"
              style={{
                background: p.color,
                color: 'var(--vc-black)',
                border: '2px solid var(--vc-black-mid)',
                marginLeft: i > 0 ? -6 : 0,
              }}
            >
              {p.initials}
            </div>
          ))}
          {meeting.totalParticipantes > 0 && (
            <span className="ml-2 text-[10px]" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
              {meeting.totalParticipantes}
            </span>
          )}
        </div>

        {isLive ? (
          <a
            href={meeting.enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="vc-btn-primary flex items-center gap-2 px-4 py-2 text-xs"
          >
            <ExternalLink size={14} /> Unirse
          </a>
        ) : (
          <span className="rounded-lg px-4 py-2 text-xs font-medium" style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-gray-mid)', border: '1px solid var(--vc-gray-dark)' }}>
            Pronto
          </span>
        )}
      </div>
    </div>
  )
}

// ── Modal crear reunión ─────────────────────────────────

function CreateMeetingModal({ onClose, onCreate }: { onClose: () => void; onCreate: (m: Meeting) => void }) {
  const [form, setForm] = useState({
    titulo: '', tipo: 'comunidad' as MeetingType, plataforma: 'meet' as MeetingPlatform,
    enlace: '', fecha: '', anfitrion: '', descripcion: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo || !form.enlace || !form.fecha || !form.anfitrion) return
    onCreate({
      id: Date.now().toString(),
      ...form,
      estado: 'proxima',
      participantes: [],
      totalParticipantes: 0,
    })
  }

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="vc-card w-full max-w-lg" style={{ padding: '2rem' }}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="heading-sm">Nueva reunión</h3>
          <button onClick={onClose} style={{ color: 'var(--vc-gray-mid)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nombre de la reunión" value={form.titulo} onChange={v => update('titulo', v)} placeholder="Ej: Reunión semanal equipo ventas" required />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm mb-2 block">Tipo</label>
              <select value={form.tipo} onChange={e => update('tipo', e.target.value)} className="w-full rounded-lg px-3 py-3 text-sm outline-none" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}>
                <option value="comunidad">Comunidad</option>
                <option value="grupo">Grupo de trabajo</option>
              </select>
            </div>
            <div>
              <label className="label-sm mb-2 block">Plataforma</label>
              <select value={form.plataforma} onChange={e => update('plataforma', e.target.value)} className="w-full rounded-lg px-3 py-3 text-sm outline-none" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}>
                <option value="meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-sm mb-2 block">Fecha y hora</label>
            <input type="datetime-local" value={form.fecha} onChange={e => update('fecha', e.target.value)} required className="w-full rounded-lg px-3 py-3 text-sm outline-none" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
          </div>

          <FormField label="Enlace de la reunión" value={form.enlace} onChange={v => update('enlace', v)} placeholder="https://meet.google.com/..." required />
          <FormField label="Anfitrión" value={form.anfitrion} onChange={v => update('anfitrion', v)} placeholder="Nombre del anfitrión" required />

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancelar</button>
            <button type="submit" className="vc-btn-primary flex-1 py-2.5 text-sm">Crear reunión</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
  return (
    <div>
      <label className="label-sm mb-2 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
    </div>
  )
}
