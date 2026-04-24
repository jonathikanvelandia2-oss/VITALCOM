'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  Inbox, Plus, Send, Loader2, X, Check, CheckCircle2, CircleDot, AlertTriangle, Flame,
  Clock, TrendingUp, UserPlus, Shield, Timer,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useThreads, useThreadMessages, useCreateThread, useSendMessage, useInboxUnread, useUpdateThread,
  useInboxStats, useAssignableUsers,
} from '@/hooks/useInbox'
import { computeSlaStatus, formatSlaStatus, hoursUntilSlaBreach, type PriorityLite } from '@/lib/inbox/helpers'

const PRIO_COLORS: Record<string, { bg: string; fg: string }> = {
  urgent: { bg: 'rgba(255, 71, 87, 0.18)', fg: 'var(--vc-error)' },
  high:   { bg: 'rgba(255, 184, 0, 0.18)', fg: 'var(--vc-warning)' },
  normal: { bg: 'rgba(198, 255, 60, 0.12)', fg: 'var(--vc-lime-main)' },
  low:    { bg: 'rgba(255,255,255,0.06)', fg: 'var(--vc-gray-mid)' },
}

const AREA_LABELS: Record<string, string> = {
  DIRECCION: 'Dirección', MARKETING: 'Marketing', COMERCIAL: 'Comercial',
  ADMINISTRATIVA: 'Administrativa', LOGISTICA: 'Logística', CONTABILIDAD: 'Contabilidad',
}

const AREA_FILTERS = ['', 'DIRECCION', 'MARKETING', 'COMERCIAL', 'ADMINISTRATIVA', 'LOGISTICA', 'CONTABILIDAD']

export default function InboxPage() {
  const [areaFilter, setAreaFilter] = useState('')
  const [resolvedFilter, setResolvedFilter] = useState<'open' | 'all' | 'resolved'>('open')
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [showNewThread, setShowNewThread] = useState(false)

  const { data, isLoading } = useThreads({
    area: areaFilter || undefined,
    limit: 30,
    resolved: resolvedFilter === 'resolved' ? 'true' : resolvedFilter === 'open' ? 'false' : undefined,
  })
  const unread = useInboxUnread()
  const threads = data?.threads ?? []
  const total = data?.pagination?.total ?? 0
  const byArea = unread.data?.byArea ?? {}

  return (
    <>
      <AdminTopbar title="Inbox interno" subtitle={isLoading ? 'Cargando...' : `${total} hilos · ${unread.data?.total ?? 0} sin leer`} />
      <StatsStrip />
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Panel izquierdo: hilos */}
        <div className="flex w-full flex-col md:w-96 md:shrink-0" style={{ borderRight: '1px solid var(--vc-gray-dark)' }}>
          <div className="space-y-3 p-4">
            {/* Filtros de área con badge de unread */}
            <div className="flex flex-wrap gap-1.5">
              {AREA_FILTERS.map((a) => {
                const isActive = areaFilter === a
                const count = a ? (byArea[a] ?? 0) : Object.values(byArea).reduce((s, n) => s + n, 0)
                return (
                  <button key={a} onClick={() => setAreaFilter(a)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      background: isActive ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                      color: isActive ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                      border: isActive ? 'none' : '1px solid var(--vc-gray-dark)',
                      fontFamily: 'var(--font-heading)',
                    }}>
                    {a ? (AREA_LABELS[a] ?? a) : 'Todas'}
                    {count > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px]"
                        style={{
                          background: isActive ? 'var(--vc-black)' : 'var(--vc-lime-main)',
                          color: isActive ? 'var(--vc-lime-main)' : 'var(--vc-black)',
                        }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Filtro estado */}
            <div className="flex gap-1.5">
              {([
                { k: 'open', label: 'Abiertos', icon: CircleDot },
                { k: 'all', label: 'Todos', icon: Inbox },
                { k: 'resolved', label: 'Resueltos', icon: CheckCircle2 },
              ] as const).map(({ k, label, icon: Icon }) => (
                <button key={k} onClick={() => setResolvedFilter(k)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors"
                  style={{
                    background: resolvedFilter === k ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-mid)',
                    color: resolvedFilter === k ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                    border: `1px solid ${resolvedFilter === k ? 'rgba(198,255,60,0.4)' : 'var(--vc-gray-dark)'}`,
                    fontFamily: 'var(--font-heading)',
                  }}>
                  <Icon size={11} /> {label}
                </button>
              ))}
            </div>

            <button onClick={() => setShowNewThread(true)} className="vc-btn-primary flex w-full items-center justify-center gap-2">
              <Plus size={14} /> Nuevo hilo
            </button>
          </div>

          {/* Lista de hilos */}
          <div className="flex-1 overflow-y-auto px-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
              </div>
            ) : threads.length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>No hay hilos</p>
            ) : (
              threads.map((t: any) => {
                const c = PRIO_COLORS[t.priority] ?? PRIO_COLORS.normal
                const isActive = selectedThread === t.id
                return (
                  <button key={t.id} onClick={() => setSelectedThread(t.id)}
                    className="mb-1 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                    style={{
                      background: isActive ? 'rgba(198,255,60,0.08)' : 'transparent',
                      border: isActive ? '1px solid rgba(198,255,60,0.3)' : '1px solid transparent',
                    }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.fg}` }}>
                      <Inbox size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-xs font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                          {t.subject}
                        </h3>
                        {t.unreadCount > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                            style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}>
                            {t.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
                        {t.lastMessage ? `${t.lastMessage.senderName}: ${t.lastMessage.body.slice(0, 50)}` : 'Sin mensajes'}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="rounded px-1 py-0.5 text-[8px] font-bold"
                          style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-lime-main)', border: '1px solid var(--vc-gray-dark)' }}>
                          {AREA_LABELS[t.area] ?? t.area}
                        </span>
                        <SlaBadge thread={t} />
                        {t.assignedTo && (
                          <span
                            className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
                            style={{ background: 'var(--vc-info)', color: 'var(--vc-black)' }}
                            title={`Asignado a ${t.assignedTo.name ?? t.assignedTo.email}`}
                          >
                            {(t.assignedTo.name ?? t.assignedTo.email ?? '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        {t.resolved && <Check size={10} color="var(--vc-lime-main)" />}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Panel derecho: mensajes */}
        <div className="hidden flex-1 flex-col md:flex">
          {selectedThread ? (
            <ThreadMessages threadId={selectedThread} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <Inbox size={40} color="var(--vc-gray-dark)" className="mx-auto mb-3" />
                <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>Selecciona un hilo para ver los mensajes</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal nuevo hilo */}
        {showNewThread && <NewThreadModal onClose={() => setShowNewThread(false)} onCreated={(id) => { setShowNewThread(false); setSelectedThread(id) }} />}
      </div>
    </>
  )
}

// ── Mensajes del hilo ──────────────────────────────────
function ThreadMessages({ threadId }: { threadId: string }) {
  const { data: session } = useSession()
  const myId = (session?.user as any)?.id as string | undefined
  const { data, isLoading } = useThreadMessages(threadId)
  const sendMessage = useSendMessage(threadId)
  const updateThread = useUpdateThread(threadId)
  const [body, setBody] = useState('')

  const thread = data?.thread
  const messages = data?.messages ?? []

  const assignable = useAssignableUsers(thread?.area as string | undefined)

  function handleAssign(userId: string) {
    updateThread.mutate({ assignedToId: userId === 'none' ? null : userId } as any)
  }

  function handleTakeThread() {
    if (!myId) return
    updateThread.mutate({ assignedToId: myId } as any)
  }

  const currentAssigneeId = (thread as any)?.assignedTo?.id ?? null

  function handleSend() {
    if (!body.trim()) return
    sendMessage.mutate({ body }, { onSuccess: () => setBody('') })
  }

  function handleToggleResolved() {
    if (!thread) return
    updateThread.mutate({ resolved: !thread.resolved })
  }

  function handlePriority(priority: string) {
    if (!thread || thread.priority === priority) return
    updateThread.mutate({ priority: priority as any })
  }

  function handleReassign(area: string) {
    if (!thread || thread.area === area) return
    if (!confirm(`¿Reasignar este hilo a ${AREA_LABELS[area] ?? area}? Dejará de aparecer en tu bandeja.`)) return
    updateThread.mutate({ area: area as any })
  }

  const isMessageSystem = (m: any) => m.body?.startsWith('— ')

  return (
    <div className="flex flex-1 flex-col">
      {/* Header con acciones */}
      {thread && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
          style={{ borderBottom: '1px solid var(--vc-gray-dark)', background: 'var(--vc-black-mid)' }}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                {thread.subject}
              </h3>
              {thread.resolved && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.4)' }}>
                  <CheckCircle2 size={10} /> Resuelto
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-lime-main)', border: '1px solid var(--vc-gray-dark)' }}>
                {AREA_LABELS[thread.area] ?? thread.area}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold"
                style={{ color: (PRIO_COLORS[thread.priority] ?? PRIO_COLORS.normal).fg }}>
                {thread.priority === 'urgent' && <Flame size={10} />}
                {thread.priority === 'high' && <AlertTriangle size={10} />}
                {thread.priority}
              </span>
              <SlaBadge thread={thread as any} />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-1.5">
            <select value={thread.priority} onChange={(e) => handlePriority(e.target.value)}
              disabled={updateThread.isPending}
              className="rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none"
              style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-soft)', border: '1px solid var(--vc-gray-dark)', fontFamily: 'var(--font-heading)' }}>
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
            <select value={thread.area} onChange={(e) => handleReassign(e.target.value)}
              disabled={updateThread.isPending}
              className="rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none"
              style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-soft)', border: '1px solid var(--vc-gray-dark)', fontFamily: 'var(--font-heading)' }}>
              {Object.entries(AREA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {/* Asignación: dropdown con lista del área + botón "tomar" */}
            <select
              value={currentAssigneeId ?? 'none'}
              onChange={(e) => handleAssign(e.target.value)}
              disabled={updateThread.isPending || assignable.isLoading}
              className="rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none"
              style={{
                background: currentAssigneeId ? 'rgba(60,198,255,0.1)' : 'var(--vc-black-soft)',
                color: currentAssigneeId ? 'var(--vc-info)' : 'var(--vc-white-soft)',
                border: `1px solid ${currentAssigneeId ? 'rgba(60,198,255,0.4)' : 'var(--vc-gray-dark)'}`,
                fontFamily: 'var(--font-heading)',
                maxWidth: '160px',
              }}
              title={currentAssigneeId ? 'Cambiar asignación' : 'Asignar staff'}
            >
              <option value="none">Sin asignar</option>
              {(assignable.data?.items ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email.split('@')[0]} · {u.role}
                </option>
              ))}
            </select>

            {currentAssigneeId !== myId && (
              <button
                onClick={handleTakeThread}
                disabled={updateThread.isPending}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors"
                style={{
                  background: 'rgba(60,198,255,0.1)',
                  color: 'var(--vc-info)',
                  border: '1px solid rgba(60,198,255,0.4)',
                  fontFamily: 'var(--font-heading)',
                }}
                title="Asignarme este hilo"
              >
                <UserPlus size={10} /> Tomar
              </button>
            )}

            <button onClick={handleToggleResolved} disabled={updateThread.isPending}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors"
              style={{
                background: thread.resolved ? 'rgba(255,184,0,0.12)' : 'rgba(198,255,60,0.12)',
                color: thread.resolved ? 'var(--vc-warning)' : 'var(--vc-lime-main)',
                border: `1px solid ${thread.resolved ? 'rgba(255,184,0,0.4)' : 'rgba(198,255,60,0.4)'}`,
                fontFamily: 'var(--font-heading)',
              }}>
              {updateThread.isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              {thread.resolved ? 'Reabrir' : 'Resolver'}
            </button>
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin mensajes aún</p>
        ) : (
          messages.map((m: any) => {
            // Auditoría (cambio de estado) con estilo diferente
            if (isMessageSystem(m)) {
              return (
                <div key={m.id} className="flex items-center gap-2 py-1 text-[10px]"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  <div className="h-px flex-1" style={{ background: 'var(--vc-gray-dark)' }} />
                  <span>{m.body.replace(/^—\s?/, '')}</span>
                  <span>·</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="h-px flex-1" style={{ background: 'var(--vc-gray-dark)' }} />
                </div>
              )
            }

            const isMine = m.sender?.id === myId
            const initials = (m.sender?.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

            return (
              <div key={m.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{
                    background: isMine ? 'var(--vc-info)' : 'var(--vc-gradient-primary)',
                    color: 'var(--vc-black)', fontFamily: 'var(--font-heading)',
                  }}>
                  {initials}
                </div>
                <div className={`max-w-[70%] rounded-xl px-3 py-2 ${isMine ? 'items-end' : ''}`}
                  style={{
                    background: isMine ? 'rgba(60,198,255,0.1)' : 'var(--vc-black-mid)',
                    border: `1px solid ${isMine ? 'rgba(60,198,255,0.3)' : 'var(--vc-gray-dark)'}`,
                  }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--vc-white-soft)' }}>{m.sender?.name}</span>
                    <span className="text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                      {m.sender?.area ? AREA_LABELS[m.sender.area] ?? m.sender.area : ''}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-xs" style={{ color: 'var(--vc-white-dim)' }}>{m.body}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-3 p-4" style={{ borderTop: '1px solid var(--vc-gray-dark)', background: 'var(--vc-black-mid)' }}>
        <input value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
        <button onClick={handleSend} disabled={sendMessage.isPending || !body.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)', boxShadow: '0 0 16px var(--vc-glow-lime)' }}>
          {sendMessage.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

// ── V39: Stats Strip operativo ─────────────────────────
function StatsStrip() {
  const q = useInboxStats()
  const s = q.data?.stats

  if (q.isLoading || !s) {
    return (
      <div
        className="flex items-center gap-3 border-b px-4 py-3 md:px-6"
        style={{ background: 'var(--vc-black-mid)', borderColor: 'var(--vc-gray-dark)' }}
      >
        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        <span className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>Cargando KPIs…</span>
      </div>
    )
  }

  const complianceTone =
    s.sla.complianceRate >= 90
      ? 'var(--vc-lime-main)'
      : s.sla.complianceRate >= 70
        ? 'var(--vc-warning)'
        : 'var(--vc-error)'

  return (
    <div
      className="grid grid-cols-2 gap-2 border-b px-4 py-3 md:grid-cols-5 md:px-6"
      style={{ background: 'var(--vc-black-mid)', borderColor: 'var(--vc-gray-dark)' }}
    >
      <StatChip icon={<CircleDot size={12} />} label="Abiertos" value={s.open} />
      <StatChip icon={<Flame size={12} />} label="Urgentes" value={s.byPriority.urgent ?? 0} tone="error" />
      <StatChip
        icon={<Shield size={12} />}
        label={`SLA ${s.sla.complianceRate}%`}
        value={`${s.sla.onTrack + s.sla.atRisk}/${s.sla.onTrack + s.sla.atRisk + s.sla.breached}`}
        tone={complianceTone as string}
      />
      <StatChip icon={<UserPlus size={12} />} label="Sin asignar" value={s.byAssignment.unassigned} />
      <StatChip
        icon={<Timer size={12} />}
        label="Más viejo"
        value={s.oldestOpenHours ? `${s.oldestOpenHours}h` : '—'}
      />
    </div>
  )
}

function StatChip({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tone?: 'error' | string
}) {
  const color =
    tone === 'error'
      ? 'var(--vc-error)'
      : typeof tone === 'string'
        ? tone
        : 'var(--vc-lime-main)'
  return (
    <div className="flex items-center gap-2">
      <span style={{ color }}>{icon}</span>
      <div className="flex flex-col">
        <span className="font-mono text-sm font-black" style={{ color: 'var(--vc-white-soft)' }}>
          {value}
        </span>
        <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)' }}>
          {label}
        </span>
      </div>
    </div>
  )
}

// ── V39: SLA badge inline ──────────────────────────────
function SlaBadge({ thread }: { thread: any }) {
  const status = useMemo(() => {
    if (thread.resolved) return null
    return computeSlaStatus(
      thread.priority as PriorityLite,
      thread.createdAt,
      thread.firstResponseAt ?? null,
    )
  }, [thread.priority, thread.createdAt, thread.firstResponseAt, thread.resolved])

  if (!status || status === 'met') return null

  const meta = formatSlaStatus(status)
  const colorMap: Record<string, { bg: string; fg: string; border: string }> = {
    success: { bg: 'rgba(198,255,60,0.1)', fg: 'var(--vc-lime-main)', border: 'rgba(198,255,60,0.4)' },
    info: { bg: 'rgba(60,198,255,0.1)', fg: 'var(--vc-info)', border: 'rgba(60,198,255,0.4)' },
    warning: { bg: 'rgba(255,184,0,0.12)', fg: 'var(--vc-warning)', border: 'rgba(255,184,0,0.4)' },
    error: { bg: 'rgba(255,71,87,0.12)', fg: 'var(--vc-error)', border: 'rgba(255,71,87,0.4)' },
  }
  const c = colorMap[meta.tone]

  const hours = hoursUntilSlaBreach(thread.priority as PriorityLite, thread.createdAt)
  const suffix = status === 'breached' ? `+${Math.abs(hours).toFixed(0)}h` : `${hours.toFixed(0)}h`

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
      title={`${meta.label} · ${suffix} vs deadline`}
    >
      <Clock size={8} /> {meta.label}
    </span>
  )
}

// ── Modal nuevo hilo ───────────────────────────────────
function NewThreadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const createThread = useCreateThread()
  const [form, setForm] = useState({ subject: '', area: 'COMERCIAL' as string, priority: 'normal' as string, body: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createThread.mutate(form as any, {
      onSuccess: (data: any) => onCreated(data.id),
    })
  }

  const inputStyle = { background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="vc-card w-full max-w-lg p-6" style={{ borderColor: 'rgba(198,255,60,0.3)' }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Nuevo hilo</h3>
          <button onClick={onClose}><X size={16} color="var(--vc-gray-mid)" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Asunto" required className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle}>
              {Object.entries(AREA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle}>
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Primer mensaje..." required rows={4}
            className="w-full resize-none rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
          <button type="submit" disabled={createThread.isPending}
            className="vc-btn-primary flex w-full items-center justify-center gap-2">
            {createThread.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Crear hilo
          </button>
          {createThread.isError && (
            <p className="text-xs" style={{ color: 'var(--vc-error)' }}>{(createThread.error as Error).message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
