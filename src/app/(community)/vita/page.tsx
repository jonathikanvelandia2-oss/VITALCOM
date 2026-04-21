'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Loader2, Plus, Bot, User, Sparkles, AlertCircle, Zap, Database } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useChatThreads,
  useChatThread,
  useSendChat,
  type ChatAgent,
  AGENT_LABELS,
  AGENT_COLORS,
} from '@/hooks/useVitaChat'

// ── V26 — Chat universal IA (VITA Orchestrator) ─────────
// Entrada única al sistema IA. El orchestrator clasifica la
// intención y rutea automáticamente al agente correcto.
// Si la confianza es baja o urgencia alta → escala al equipo humano.

const FORCE_AGENTS: { key: ChatAgent; label: string; desc: string }[] = [
  { key: 'VITA', label: 'Auto', desc: 'Que VITA decida' },
  { key: 'MENTOR_FINANCIERO', label: 'Finanzas', desc: 'P&G · ROAS · margen' },
  { key: 'MEDIA_BUYER', label: 'Ads', desc: 'Campañas · pausar · escalar' },
  { key: 'CREATIVO_MAKER', label: 'Creativo', desc: 'Copy · ángulos · reels' },
  { key: 'OPTIMIZADOR_TIENDA', label: 'Tienda', desc: 'Conversión · pricing' },
  { key: 'BLUEPRINT_ANALYST', label: 'Blueprint', desc: 'Diagnóstico holístico' },
  { key: 'SOPORTE_IA', label: 'Soporte', desc: 'Uso plataforma' },
]

export default function VitaChatPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [forceAgent, setForceAgent] = useState<ChatAgent>('VITA')
  const scrollRef = useRef<HTMLDivElement>(null)

  const threadsQ = useChatThreads()
  const threadQ = useChatThread(selectedThreadId)
  const sendM = useSendChat()

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [threadQ.data?.messages.length, sendM.isPending])

  const messages = threadQ.data?.messages ?? []
  const threads = threadsQ.data?.items ?? []

  const handleSend = async () => {
    const text = message.trim()
    if (!text || sendM.isPending) return
    setMessage('')

    try {
      const result = await sendM.mutateAsync({
        message: text,
        threadId: selectedThreadId ?? undefined,
        forceAgent: forceAgent === 'VITA' ? undefined : forceAgent,
      })
      if (!selectedThreadId) setSelectedThreadId(result.threadId)
    } catch {
      setMessage(text) // restore on error
    }
  }

  const handleNewThread = () => {
    setSelectedThreadId(null)
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <CommunityTopbar title="VITA — Chat Universal IA" />

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:py-6">
        {/* Hero compacto */}
        <div className="mb-4 rounded-xl border border-[var(--vc-lime-main)]/30 bg-gradient-to-br from-[var(--vc-black-mid)] via-[var(--vc-black-soft)] to-[var(--vc-black-mid)] p-4 lg:p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--vc-lime-main)]">
              <Sparkles className="h-5 w-5 text-[var(--vc-black)]" />
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--vc-lime-electric)] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--vc-lime-electric)]" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-[var(--font-display)] text-lg font-bold text-[var(--vc-lime-main)] lg:text-xl">
                VITA · CHAT UNIVERSAL IA
              </div>
              <div className="text-xs text-[var(--vc-white-dim)]">
                Pregunta lo que sea — el sistema rutea automáticamente al agente correcto
              </div>
            </div>
            <button
              onClick={handleNewThread}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--vc-lime-main)]/40 bg-[var(--vc-lime-main)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--vc-lime-main)] hover:bg-[var(--vc-lime-main)]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px,1fr]">
          {/* Columna threads */}
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
              Conversaciones ({threads.length})
            </div>
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {threads.length === 0 && (
                <div className="rounded-lg border border-[var(--vc-gray-dark)]/50 bg-[var(--vc-black-soft)]/50 p-3 text-center text-xs text-[var(--vc-white-dim)]">
                  Inicia tu primera conversación escribiendo abajo
                </div>
              )}
              {threads.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`w-full rounded-lg border p-2 text-left transition ${
                    selectedThreadId === t.id
                      ? 'border-[var(--vc-lime-main)]/50 bg-[var(--vc-lime-main)]/10'
                      : 'border-[var(--vc-gray-dark)]/50 bg-[var(--vc-black-soft)] hover:border-[var(--vc-lime-main)]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: AGENT_COLORS[t.agent] }}
                    />
                    <div className="flex-1 truncate text-xs font-semibold text-[var(--vc-white-soft)]">
                      {t.title}
                    </div>
                    {t.escalated && (
                      <AlertCircle className="h-3 w-3 text-[var(--vc-error)]" />
                    )}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[10px] text-[var(--vc-white-dim)]">
                    {t.preview}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] text-[var(--vc-gray-mid)]">
                    <span>{AGENT_LABELS[t.agent]}</span>
                    <span>{t.messageCount} msgs</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Columna chat */}
          <div className="flex flex-col rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]">
            {/* Mensajes */}
            <div
              ref={scrollRef}
              className="min-h-[50vh] flex-1 space-y-3 overflow-y-auto p-4 lg:min-h-[60vh]"
            >
              {!selectedThreadId && messages.length === 0 && (
                <EmptyState />
              )}
              {messages.map(m => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {sendM.isPending && (
                <div className="flex items-center gap-2 text-xs text-[var(--vc-white-dim)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  VITA está pensando…
                </div>
              )}
            </div>

            {/* Selector de agente */}
            <div className="border-t border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)]/50 px-3 py-2">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {FORCE_AGENTS.map(a => (
                  <button
                    key={a.key}
                    onClick={() => setForceAgent(a.key)}
                    className={`flex-shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold transition ${
                      forceAgent === a.key
                        ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/20 text-[var(--vc-lime-main)]'
                        : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/30'
                    }`}
                    title={a.desc}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-[var(--vc-gray-dark)] p-3">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Pregúntale a VITA lo que sea sobre tu negocio…"
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-sm text-[var(--vc-white-soft)] placeholder-[var(--vc-gray-mid)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sendM.isPending}
                  className="flex items-center justify-center rounded-lg bg-[var(--vc-lime-main)] px-4 text-[var(--vc-black)] transition hover:bg-[var(--vc-lime-electric)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sendM.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-1.5 text-[9px] text-[var(--vc-gray-mid)]">
                Enter envía · Shift+Enter salto de línea · El agente {AGENT_LABELS[forceAgent]} {forceAgent === 'VITA' ? 'será seleccionado automáticamente' : 'responderá'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: { role: string; content: string; source: string | null; confidence: number | null } }) {
  const isUser = message.role === 'USER'
  const isEscalation = message.source === 'escalation' || message.source === 'human'
  const isCache = message.source === 'cache'
  const isRules = message.source === 'rules'

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--vc-lime-main)]/20">
          <Bot className="h-4 w-4 text-[var(--vc-lime-main)]" />
        </div>
      )}
      <div className={`max-w-[78%] rounded-xl px-3 py-2 text-sm ${
        isUser
          ? 'bg-[var(--vc-lime-main)]/20 text-[var(--vc-white-soft)]'
          : isEscalation
          ? 'bg-[var(--vc-warning)]/10 text-[var(--vc-white-soft)] border border-[var(--vc-warning)]/30'
          : 'bg-[var(--vc-black-soft)] text-[var(--vc-white-soft)]'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        {!isUser && (isCache || isRules || isEscalation) && (
          <div className="mt-1.5 flex items-center gap-1 text-[9px] text-[var(--vc-gray-mid)]">
            {isCache && <><Database className="h-2.5 w-2.5" />Respuesta en caché</>}
            {isRules && <><Zap className="h-2.5 w-2.5" />Modo fallback</>}
            {isEscalation && <><AlertCircle className="h-2.5 w-2.5" />Escalado al equipo</>}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--vc-black-soft)]">
          <User className="h-4 w-4 text-[var(--vc-white-dim)]" />
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  const suggestions = useMemo(() => [
    { icon: '💰', text: '¿Cómo está mi P&G este mes?', agent: 'MENTOR_FINANCIERO' },
    { icon: '🎯', text: 'Dame un diagnóstico de mi tienda', agent: 'BLUEPRINT_ANALYST' },
    { icon: '📢', text: 'Mi ROAS cayó a 1.2x, ¿qué hago?', agent: 'MEDIA_BUYER' },
    { icon: '✍️', text: 'Dame 3 copys para colágeno', agent: 'CREATIVO_MAKER' },
    { icon: '🛍️', text: '¿Qué producto debo destacar?', agent: 'OPTIMIZADOR_TIENDA' },
  ], [])

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--vc-lime-main)] to-[var(--vc-lime-electric)]">
        <Sparkles className="h-7 w-7 text-[var(--vc-black)]" />
      </div>
      <div className="mb-1 font-[var(--font-display)] text-lg font-bold text-[var(--vc-lime-main)]">
        Hola, soy VITA
      </div>
      <div className="mb-4 max-w-md text-center text-xs text-[var(--vc-white-dim)]">
        El orquestador IA de Vitalcom. Conozco tu P&G, tu catálogo, tus campañas y tu historial.
        Pregúntame lo que sea — te conecto con el agente correcto automáticamente.
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="rounded-full border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-1.5 text-[11px] text-[var(--vc-white-dim)]"
          >
            {s.icon} {s.text}
          </div>
        ))}
      </div>
    </div>
  )
}
