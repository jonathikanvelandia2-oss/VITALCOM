'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Send, Search, Loader2, Plus, X, MessageSquare, Users } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useConversations,
  useConversationMessages,
  useStartConversation,
  useSendDirectMessage,
  useMarkConversationRead,
  useCommunityMembers,
  type Conversation,
  type Member,
} from '@/hooks/useDirectChat'

// ── Chat 1:1 Comunidad Vitalcom ────────────────────────
// Panel de 2 columnas: lista izquierda + conversación activa.
// Deep-link vía ?c=<conversationId> para notificaciones.

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function ChatPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(searchParams.get('c'))
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useConversations()

  // Sync con query param (cuando llega de notificación)
  useEffect(() => {
    const c = searchParams.get('c')
    if (c && c !== selected) setSelected(c)
  }, [searchParams, selected])

  const filtered = useMemo(() => {
    const list = data?.items ?? []
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(
      (c) => c.other.name.toLowerCase().includes(q) || (c.lastPreview ?? '').toLowerCase().includes(q),
    )
  }, [data?.items, search])

  const myId = (session?.user as any)?.id as string | undefined

  function openConversation(id: string) {
    setSelected(id)
    const url = new URL(window.location.href)
    url.searchParams.set('c', id)
    router.replace(`${url.pathname}?${url.searchParams.toString()}`)
  }

  return (
    <>
      <CommunityTopbar title="Chat" subtitle="Mensajería 1:1 con la comunidad Vitalcom" />
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Lista de conversaciones */}
        <aside
          className="hidden w-80 shrink-0 flex-col md:flex"
          style={{ background: 'var(--vc-black-mid)', borderRight: '1px solid var(--vc-gray-dark)' }}
        >
          <div className="space-y-2 p-4">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
            >
              <Search size={14} color="var(--vc-gray-mid)" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversaciones..."
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: 'var(--vc-white-soft)' }}
              />
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-bold transition-all hover:brightness-110"
              style={{
                background: 'rgba(198,255,60,0.1)',
                color: 'var(--vc-lime-main)',
                border: '1px solid rgba(198,255,60,0.3)',
              }}
            >
              <Plus size={12} /> Nueva conversación
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--vc-white-dim)' }} />
                <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                  {search ? 'Sin resultados' : 'Aún no tienes conversaciones'}
                </p>
                {!search && (
                  <p className="mt-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
                    Inicia una con el botón de arriba
                  </p>
                )}
              </div>
            ) : (
              filtered.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  active={selected === c.id}
                  onClick={() => openConversation(c.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Conversación activa */}
        {selected ? (
          <ActiveConversation conversationId={selected} myId={myId} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} color="var(--vc-gray-dark)" className="mx-auto mb-4" />
              <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                Selecciona una conversación
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                O inicia una nueva con otro VITALCOMMER
              </p>
            </div>
          </div>
        )}

        {showNew && (
          <NewChatModal
            onClose={() => setShowNew(false)}
            onStart={(id) => {
              setShowNew(false)
              openConversation(id)
            }}
          />
        )}
      </div>
    </>
  )
}

// ── Row de la lista ────────────────────────────────────
function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="mb-1 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:brightness-110"
      style={{
        background: active ? 'rgba(198,255,60,0.08)' : 'transparent',
        border: active ? '1px solid rgba(198,255,60,0.3)' : '1px solid transparent',
      }}
    >
      <Avatar name={conversation.other.name} avatar={conversation.other.avatar} size={42} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className="truncate text-xs font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            {conversation.other.name}
          </p>
          <span className="shrink-0 text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
            {conversation.lastPreview ?? 'Inicia la conversación'}
          </p>
          {conversation.unread > 0 && (
            <span
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold"
              style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}
            >
              {conversation.unread > 99 ? '99+' : conversation.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Conversación activa ────────────────────────────────
function ActiveConversation({ conversationId, myId }: { conversationId: string; myId?: string }) {
  const { data, isLoading } = useConversationMessages(conversationId)
  const send = useSendDirectMessage(conversationId)
  const markRead = useMarkConversationRead()
  const [body, setBody] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const markedRef = useRef<string | null>(null)

  const messages = data?.messages ?? []
  const other = data?.conversation.other

  // Marcar leída al abrir (una sola vez por conversación)
  useEffect(() => {
    if (conversationId && markedRef.current !== conversationId) {
      markedRef.current = conversationId
      markRead.mutate(conversationId)
    }
  }, [conversationId, markRead])

  // Scroll al final cuando lleguen mensajes nuevos
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend() {
    const trimmed = body.trim()
    if (!trimmed) return
    send.mutate(trimmed, { onSuccess: () => setBody('') })
  }

  return (
    <section className="flex flex-1 flex-col">
      {/* Header */}
      {other && (
        <header
          className="flex items-center gap-3 px-6 py-3"
          style={{ borderBottom: '1px solid var(--vc-gray-dark)', background: 'var(--vc-black-mid)' }}
        >
          <Avatar name={other.name} avatar={other.avatar} size={42} />
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              {other.name}
            </p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
              {roleLabel(other.role)} · Nivel {other.level}
            </p>
          </div>
        </header>
      )}

      {/* Mensajes */}
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare size={36} color="var(--vc-gray-dark)" className="mb-3" />
            <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
              Envía el primer mensaje para iniciar el chat
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === myId
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-md rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    background: isMe ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                    color: isMe ? 'var(--vc-black)' : 'var(--vc-white-soft)',
                    border: isMe ? 'none' : '1px solid var(--vc-gray-dark)',
                    boxShadow: isMe ? '0 0 16px var(--vc-glow-lime)' : 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.body}
                  <div
                    className="mt-1 flex items-center justify-end gap-1 text-[9px]"
                    style={{
                      color: isMe ? 'rgba(10,10,10,0.6)' : 'var(--vc-gray-mid)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {new Date(m.createdAt).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {isMe && m.readAt && <span>· leído</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div
        className="flex items-center gap-3 p-4"
        style={{ borderTop: '1px solid var(--vc-gray-dark)', background: 'var(--vc-black-mid)' }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={2000}
          className="flex-1 rounded-full px-5 py-3 text-sm outline-none"
          style={{
            background: 'var(--vc-black-soft)',
            border: '1px solid var(--vc-gray-dark)',
            color: 'var(--vc-white-soft)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={send.isPending || !body.trim()}
          aria-label="Enviar"
          className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-105 disabled:opacity-40"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            boxShadow: '0 0 20px var(--vc-glow-lime)',
          }}
        >
          {send.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </section>
  )
}

// ── Modal: nueva conversación (directorio) ─────────────
function NewChatModal({ onClose, onStart }: { onClose: () => void; onStart: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const { data, isLoading } = useCommunityMembers(query)
  const start = useStartConversation()

  function handleStart(userId: string) {
    start.mutate(userId, { onSuccess: (c) => onStart(c.id) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--vc-black-mid)',
          border: '1px solid rgba(198,255,60,0.3)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 24px var(--vc-glow-lime)',
        }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: 'var(--vc-gray-dark)' }}
        >
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: 'var(--vc-lime-main)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Iniciar conversación
            </h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} color="var(--vc-gray-mid)" />
          </button>
        </div>

        <div className="p-4">
          <div
            className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
          >
            <Search size={14} color="var(--vc-gray-mid)" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: 'var(--vc-white-soft)' }}
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
              </div>
            ) : (data?.items ?? []).length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                Sin miembros
              </p>
            ) : (
              data!.items.map((m: Member) => (
                <button
                  key={m.id}
                  onClick={() => handleStart(m.id)}
                  disabled={start.isPending}
                  className="mb-1 flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:brightness-125 disabled:opacity-50"
                >
                  <Avatar name={m.name} avatar={m.avatar} size={36} />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-bold"
                      style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                    >
                      {m.name}
                    </p>
                    <p className="truncate text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
                      {roleLabel(m.role)}
                      {m.country ? ` · ${m.country}` : ''}
                      {' · Nivel '}
                      {m.level}
                    </p>
                  </div>
                  {start.isPending && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Avatar con iniciales fallback ──────────────────────
function Avatar({ name, avatar, size }: { name: string; avatar: string | null; size: number }) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ border: '1px solid rgba(198,255,60,0.2)' }}
      />
    )
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        width: size,
        height: size,
        background: 'var(--vc-gradient-primary)',
        color: 'var(--vc-black)',
        fontFamily: 'var(--font-heading)',
      }}
    >
      {initials(name)}
    </div>
  )
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPERADMIN: 'Vitalcom Staff',
    ADMIN: 'Vitalcom Staff',
    MANAGER_AREA: 'Líder de área',
    EMPLOYEE: 'Staff',
    DROPSHIPPER: 'Dropshipper',
    COMMUNITY: 'VITALCOMMER',
  }
  return map[role] ?? role
}
