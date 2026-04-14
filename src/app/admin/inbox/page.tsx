'use client'

import { useState } from 'react'
import { Inbox, Plus, Send, Loader2, X, Check } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useThreads, useThreadMessages, useCreateThread, useSendMessage } from '@/hooks/useInbox'

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
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [showNewThread, setShowNewThread] = useState(false)

  const { data, isLoading } = useThreads({ area: areaFilter || undefined, limit: 30 })
  const threads = data?.threads ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <>
      <AdminTopbar title="Inbox interno" subtitle={isLoading ? 'Cargando...' : `Comunicación entre áreas · ${total} hilos`} />
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 'calc(100vh - 130px)' }}>
        {/* Panel izquierdo: hilos */}
        <div className="flex w-full flex-col md:w-96 md:shrink-0" style={{ borderRight: '1px solid var(--vc-gray-dark)' }}>
          <div className="space-y-3 p-4">
            {/* Filtros de área */}
            <div className="flex flex-wrap gap-1.5">
              {AREA_FILTERS.map((a) => (
                <button key={a} onClick={() => setAreaFilter(a)}
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    background: areaFilter === a ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                    color: areaFilter === a ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                    border: areaFilter === a ? 'none' : '1px solid var(--vc-gray-dark)',
                    fontFamily: 'var(--font-heading)',
                  }}>
                  {a ? (AREA_LABELS[a] ?? a) : 'Todas'}
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
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="rounded px-1 py-0.5 text-[8px] font-bold"
                          style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-lime-main)', border: '1px solid var(--vc-gray-dark)' }}>
                          {AREA_LABELS[t.area] ?? t.area}
                        </span>
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
  const { data, isLoading } = useThreadMessages(threadId)
  const sendMessage = useSendMessage(threadId)
  const [body, setBody] = useState('')

  const thread = data?.thread
  const messages = data?.messages ?? []

  function handleSend() {
    if (!body.trim()) return
    sendMessage.mutate({ body }, { onSuccess: () => setBody('') })
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      {thread && (
        <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--vc-gray-dark)', background: 'var(--vc-black-mid)' }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              {thread.subject}
            </h3>
            <div className="flex items-center gap-2">
              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-lime-main)', border: '1px solid var(--vc-gray-dark)' }}>
                {AREA_LABELS[thread.area] ?? thread.area}
              </span>
              <span className="text-[10px]" style={{ color: (PRIO_COLORS[thread.priority] ?? PRIO_COLORS.normal).fg }}>
                {thread.priority}
              </span>
            </div>
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
            const initials = (m.sender?.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div key={m.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
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
