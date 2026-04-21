'use client'

import { useState, useEffect } from 'react'
import {
  AlertCircle, CheckCircle2, Clock, Loader2, Send, User as UserIcon, Bot,
  ShieldAlert, MessageSquare, X,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useAdminEscalations, useAdminEscalation, useResolveEscalation,
  type EscalationStatus, type EscalationPriority, type EscalationArea,
} from '@/hooks/useAdminEscalations'
import { AGENT_LABELS, AGENT_COLORS } from '@/hooks/useVitaChat'

const PRIORITY_META: Record<EscalationPriority, { color: string; label: string }> = {
  LOW: { color: '#3CC6FF', label: 'Baja' },
  MEDIUM: { color: '#FFB800', label: 'Media' },
  HIGH: { color: '#FF6B35', label: 'Alta' },
  URGENT: { color: '#FF4757', label: 'URGENTE' },
}

const STATUS_META: Record<EscalationStatus, { color: string; label: string; icon: typeof Clock }> = {
  OPEN: { color: '#FF4757', label: 'Abierto', icon: AlertCircle },
  IN_PROGRESS: { color: '#FFB800', label: 'En curso', icon: Loader2 },
  RESOLVED: { color: '#C6FF3C', label: 'Resuelto', icon: CheckCircle2 },
  CLOSED: { color: '#8B9BA8', label: 'Cerrado', icon: CheckCircle2 },
}

const AREAS: EscalationArea[] = ['DIRECCION', 'MARKETING', 'COMERCIAL', 'ADMINISTRATIVA', 'LOGISTICA', 'CONTABILIDAD']

export default function AdminEscalationsPage() {
  const [statusFilter, setStatusFilter] = useState<EscalationStatus | null>('OPEN')
  const [areaFilter, setAreaFilter] = useState<EscalationArea | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQ = useAdminEscalations({
    status: statusFilter ?? undefined,
    area: areaFilter ?? undefined,
  })
  const detailQ = useAdminEscalation(selectedId)

  const summary = listQ.data?.summary ?? { open: 0, inProgress: 0, resolved: 0 }
  const items = listQ.data?.items ?? []

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title="Escalaciones IA" subtitle="Tickets donde la IA no resolvió y necesita humano" />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatCard
            label="Abiertos"
            value={summary.open}
            color="#FF4757"
            icon={AlertCircle}
          />
          <StatCard
            label="En curso"
            value={summary.inProgress}
            color="#FFB800"
            icon={Loader2}
          />
          <StatCard
            label="Resueltos"
            value={summary.resolved}
            color="#C6FF3C"
            icon={CheckCircle2}
          />
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as EscalationStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase transition ${
                  statusFilter === s
                    ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/20 text-[var(--vc-lime-main)]'
                    : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] text-[var(--vc-white-dim)]'
                }`}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="mx-1 h-4 w-px bg-[var(--vc-gray-dark)]" />
          <div className="flex flex-wrap gap-1">
            {AREAS.map(a => (
              <button
                key={a}
                onClick={() => setAreaFilter(areaFilter === a ? null : a)}
                className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase transition ${
                  areaFilter === a
                    ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/20 text-[var(--vc-lime-main)]'
                    : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] text-[var(--vc-white-dim)]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr,520px]">
          {/* Lista */}
          <div className="space-y-2">
            {listQ.isLoading && (
              <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                Cargando tickets…
              </div>
            )}
            {!listQ.isLoading && items.length === 0 && (
              <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[var(--vc-lime-main)]" />
                Sin escalaciones en este filtro
              </div>
            )}
            {items.map(t => {
              const StatusIcon = STATUS_META[t.status].icon
              const prio = PRIORITY_META[t.priority]
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedId === t.id
                      ? 'border-[var(--vc-lime-main)]/50 bg-[var(--vc-lime-main)]/5'
                      : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] hover:border-[var(--vc-lime-main)]/30'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${prio.color}20`, border: `1px solid ${prio.color}40` }}
                      >
                        <ShieldAlert className="h-4 w-4" style={{ color: prio.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase"
                            style={{ backgroundColor: `${prio.color}20`, color: prio.color }}
                          >
                            {prio.label}
                          </span>
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase"
                            style={{ backgroundColor: `${AGENT_COLORS[t.fromAgent]}20`, color: AGENT_COLORS[t.fromAgent] }}
                          >
                            {AGENT_LABELS[t.fromAgent]}
                          </span>
                          <span className="rounded-md bg-[var(--vc-black-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--vc-white-dim)]">
                            {t.toArea}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StatusIcon
                      className={`h-4 w-4 ${t.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`}
                      style={{ color: STATUS_META[t.status].color }}
                    />
                  </div>
                  <div className="mb-1 line-clamp-2 text-xs text-[var(--vc-white-soft)]">
                    {t.reason}
                  </div>
                  {t.summary && (
                    <div className="mb-2 line-clamp-2 rounded bg-[var(--vc-black-soft)]/50 p-2 text-[10px] italic text-[var(--vc-white-dim)]">
                      💡 {t.summary}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-[var(--vc-gray-mid)]">
                    <span>{t.user.name ?? t.user.email} · {t.user.country ?? '—'}</span>
                    <span>{new Date(t.createdAt).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Panel detalle */}
          <div className="sticky top-4 self-start">
            {!selectedId && (
              <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Selecciona un ticket para ver el contexto y responder
              </div>
            )}
            {selectedId && <DetailPanel ticketId={selectedId} onClose={() => setSelectedId(null)} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: typeof Clock
}) {
  return (
    <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div>
          <div className="text-lg font-bold text-[var(--vc-white-soft)]">{value}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">{label}</div>
        </div>
      </div>
    </div>
  )
}

function DetailPanel({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const detailQ = useAdminEscalation(ticketId)
  const resolveM = useResolveEscalation()
  const [resolution, setResolution] = useState('')
  const [replyToUser, setReplyToUser] = useState('')

  const ticket = detailQ.data

  const handleResolve = async () => {
    if (resolution.length < 5) return
    await resolveM.mutateAsync({
      id: ticketId,
      resolution,
      replyToUser: replyToUser.trim() || undefined,
    })
    setResolution('')
    setReplyToUser('')
    onClose()
  }

  // Al abrir, pre-cargar draftResponse si existe
  useEffect(() => {
    if (ticket?.draftResponse && !replyToUser) {
      setReplyToUser(ticket.draftResponse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id])

  if (!ticket) {
    return (
      <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--vc-lime-main)]" />
      </div>
    )
  }

  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'

  return (
    <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]">
      <div className="flex items-center justify-between border-b border-[var(--vc-gray-dark)] px-4 py-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--vc-white-soft)]">
          Ticket #{ticket.id.slice(-6)}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-[var(--vc-white-dim)] hover:bg-[var(--vc-black-soft)] hover:text-[var(--vc-white-soft)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Usuario + contexto */}
      <div className="border-b border-[var(--vc-gray-dark)] p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--vc-black-soft)]">
            <UserIcon className="h-4 w-4 text-[var(--vc-white-dim)]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--vc-white-soft)]">
              {ticket.user.name ?? ticket.user.email}
            </div>
            <div className="text-[10px] text-[var(--vc-white-dim)]">
              {ticket.user.email} · {ticket.user.country ?? '—'}
            </div>
          </div>
        </div>
        <div className="text-xs text-[var(--vc-white-dim)]">
          <strong className="text-[var(--vc-white-soft)]">Razón:</strong> {ticket.reason}
        </div>
        {ticket.summary && (
          <div className="mt-2 rounded-lg border border-[var(--vc-lime-main)]/20 bg-[var(--vc-lime-main)]/5 p-2 text-[11px] italic text-[var(--vc-white-soft)]">
            💡 {ticket.summary}
          </div>
        )}
      </div>

      {/* Mensajes del thread */}
      <div className="max-h-[300px] space-y-2 overflow-y-auto border-b border-[var(--vc-gray-dark)] p-3">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
          Thread del usuario
        </div>
        {ticket.thread.messages.map(m => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role !== 'USER' && (
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-[var(--vc-lime-main)]/20">
                <Bot className="h-3 w-3 text-[var(--vc-lime-main)]" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-[11px] ${
              m.role === 'USER'
                ? 'bg-[var(--vc-lime-main)]/15 text-[var(--vc-white-soft)]'
                : 'bg-[var(--vc-black-soft)] text-[var(--vc-white-soft)]'
            }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Resolución */}
      {isResolved ? (
        <div className="p-3">
          <div className="rounded-lg border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/10 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-[var(--vc-lime-main)]">
              <CheckCircle2 className="h-3 w-3" /> Resuelto
            </div>
            <div className="text-xs text-[var(--vc-white-soft)]">{ticket.resolution}</div>
            {ticket.replyToUser && (
              <div className="mt-2 rounded bg-[var(--vc-black-soft)] p-2 text-[11px] italic text-[var(--vc-white-dim)]">
                Respuesta enviada al usuario: "{ticket.replyToUser.slice(0, 100)}…"
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
              Resolución interna (notas)
            </label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={2}
              placeholder="Ej: Verifiqué en Dropi, el pedido ya está despachado. Enviado tracking al usuario."
              className="w-full resize-none rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2.5 py-1.5 text-xs text-[var(--vc-white-soft)] placeholder-[var(--vc-gray-mid)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
              Respuesta al usuario (opcional)
            </label>
            <textarea
              value={replyToUser}
              onChange={e => setReplyToUser(e.target.value)}
              rows={3}
              placeholder="Mensaje que verá el usuario en el chat. Déjalo vacío si no hace falta."
              className="w-full resize-none rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2.5 py-1.5 text-xs text-[var(--vc-white-soft)] placeholder-[var(--vc-gray-mid)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
            />
          </div>
          <button
            onClick={handleResolve}
            disabled={resolution.length < 5 || resolveM.isPending}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] py-2 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] transition hover:bg-[var(--vc-lime-electric)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resolveM.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Resolver ticket
          </button>
        </div>
      )}
    </div>
  )
}
