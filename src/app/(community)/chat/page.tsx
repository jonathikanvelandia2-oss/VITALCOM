'use client'

import { useState } from 'react'
import { Send, Search, Loader2, Plus, X } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useThreads, useThreadMessages, useCreateThread, useSendMessage } from '@/hooks/useInbox'
import { formatLevel } from '@/lib/gamification/points'
import { useSession } from 'next-auth/react'

export default function ChatPage() {
  const { data: session } = useSession()
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useThreads({ limit: 30 })
  const threads = data?.threads ?? []

  const filtered = search
    ? threads.filter((t: any) => t.subject.toLowerCase().includes(search.toLowerCase()))
    : threads

  const myId = (session?.user as any)?.id

  return (
    <>
      <CommunityTopbar title="Chat" subtitle="Mensajería con miembros de la comunidad" />
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Lista de conversaciones */}
        <div className="hidden w-80 shrink-0 flex-col md:flex"
          style={{ background: 'var(--vc-black-mid)', borderRight: '1px solid var(--vc-gray-dark)' }}>
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
              <Search size={14} color="var(--vc-gray-mid)" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversaciones..."
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: 'var(--vc-white-soft)' }} />
            </div>
            <button onClick={() => setShowNew(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-bold"
              style={{ background: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.3)' }}>
              <Plus size={12} /> Nueva conversación
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                {search ? 'Sin resultados' : 'No hay conversaciones'}
              </p>
            ) : (
              filtered.map((t: any) => {
                const isActive = selectedThread === t.id
                const senderName = t.lastMessage?.senderName ?? 'Sin mensajes'
                return (
                  <button key={t.id} onClick={() => setSelectedThread(t.id)}
                    className="mb-1 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                    style={{
                      background: isActive ? 'rgba(198,255,60,0.08)' : 'transparent',
                      border: isActive ? '1px solid rgba(198,255,60,0.3)' : '1px solid transparent',
                    }}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
                      {t.subject.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                          {t.subject}
                        </p>
                        {t.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                            style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}>
                            {t.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                        {t.lastMessage ? `${senderName}: ${t.lastMessage.body.slice(0, 40)}` : '—'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Conversación activa */}
        {selectedThread ? (
          <ChatMessages threadId={selectedThread} myId={myId} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Send size={40} color="var(--vc-gray-dark)" className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>Selecciona una conversación</p>
            </div>
          </div>
        )}

        {/* Modal nueva conversación */}
        {showNew && <NewChatModal onClose={() => setShowNew(false)} onCreated={(id) => { setShowNew(false); setSelectedThread(id) }} />}
      </div>
    </>
  )
}

function ChatMessages({ threadId, myId }: { threadId: string; myId?: string }) {
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
        <div className="flex items-center gap-3 px-6 py-3"
          style={{ borderBottom: '1px solid var(--vc-gray-dark)', background: 'var(--vc-black-mid)' }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
            {thread.subject.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              {thread.subject}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--vc-lime-main)' }}>
              {thread.area}
            </p>
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
          <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Envía el primer mensaje</p>
        ) : (
          messages.map((m: any) => {
            const isMe = m.sender?.id === myId
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-md rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    background: isMe ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                    color: isMe ? 'var(--vc-black)' : 'var(--vc-white-soft)',
                    border: isMe ? 'none' : '1px solid var(--vc-gray-dark)',
                    boxShadow: isMe ? '0 0 16px var(--vc-glow-lime)' : 'none',
                  }}>
                  {!isMe && (
                    <p className="mb-1 text-[10px] font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                      {m.sender?.name}
                    </p>
                  )}
                  {m.body}
                  <div className="mt-1 text-[9px]"
                    style={{ color: isMe ? 'rgba(10,10,10,0.6)' : 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
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
          className="flex-1 rounded-full px-5 py-3 text-sm outline-none"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
        <button onClick={handleSend} disabled={sendMessage.isPending || !body.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)', boxShadow: '0 0 20px var(--vc-glow-lime)' }}>
          {sendMessage.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}

function NewChatModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const createThread = useCreateThread()
  const [form, setForm] = useState({ subject: '', body: '', area: 'COMERCIAL' as string, priority: 'normal' as string })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createThread.mutate(form as any, { onSuccess: (data: any) => onCreated(data.id) })
  }

  const inputStyle = { background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="vc-card w-full max-w-md p-6" style={{ borderColor: 'rgba(198,255,60,0.3)' }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Nueva conversación</h3>
          <button onClick={onClose}><X size={16} color="var(--vc-gray-mid)" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Tema de conversación" required
            className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Primer mensaje..." required rows={3}
            className="w-full resize-none rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} />
          <button type="submit" disabled={createThread.isPending}
            className="vc-btn-primary flex w-full items-center justify-center gap-2">
            {createThread.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Iniciar conversación
          </button>
        </form>
      </div>
    </div>
  )
}
