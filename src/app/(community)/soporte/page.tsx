'use client'

import { useState, useRef, useEffect } from 'react'
import { LifeBuoy, Send, Loader2, Sparkles, User, Bot } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useSoporteChat, type ChatMessage } from '@/hooks/useSoporteIA'

// ── SoporteIA — V22 · 7° agente IA (chat 24/7) ───────────
// Chat conversacional para los VITALCOMMERS con contexto:
// perfil + métricas + top productos ganadores + catálogo.

const SUGGESTED_PROMPTS = [
  '¿Cómo empiezo a vender con Vitalcom?',
  '¿Qué productos vendo para tener más ganancia?',
  '¿Cómo lanzo mi primera campaña de Meta Ads?',
  '¿Qué significa ROAS y cómo lo mejoro?',
  '¿Cómo conecto mi Shopify?',
  '¿Qué hace el Command Center?',
]

export default function SoportePage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '¡Hola 👋 Soy **SoporteIA**, tu asistente 24/7 de Vitalcom. Te ayudo con ventas, publicidad, P&G, productos ganadores, lo que sea. Escríbeme tu duda o elige una de las sugerencias abajo.',
    },
  ])

  const chatMut = useSoporteChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chatMut.isPending])

  async function send(content: string) {
    if (!content.trim()) return
    const userMsg: ChatMessage = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    const res = await chatMut.mutateAsync(newMessages)
    setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunityTopbar
        title="SoporteIA"
        subtitle="Tu asistente 24/7 — respuestas rápidas con contexto de tu negocio"
      />

      {/* Hero compacto */}
      <div
        className="border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(60,198,255,0.05) 0%, rgba(198,255,60,0.05) 100%)',
          borderColor: 'rgba(198,255,60,0.15)',
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: 'var(--vc-gradient-primary)',
                boxShadow: '0 0 24px var(--vc-glow-lime)',
              }}
            >
              <LifeBuoy size={20} style={{ color: 'var(--vc-black)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-xl font-black"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                >
                  SoporteIA
                </h1>
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                  style={{
                    background: 'var(--vc-lime-main)',
                    color: 'var(--vc-black)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  V22 · 24/7
                </span>
              </div>
              <p className="text-[12px]" style={{ color: 'var(--vc-white-dim)' }}>
                Tu asistente oficial con contexto de tu tienda y el catálogo Vitalcom
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat container */}
      <div className="mx-auto flex max-w-4xl flex-col px-6" style={{ minHeight: 'calc(100vh - 160px)' }}>
        {/* Mensajes */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-6"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          <div className="space-y-4">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {chatMut.isPending && (
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--vc-gradient-primary)' }}
                >
                  <Bot size={15} style={{ color: 'var(--vc-black)' }} />
                </div>
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{
                    background: 'var(--vc-black-mid)',
                    border: '1px solid rgba(198,255,60,0.15)',
                  }}
                >
                  <Loader2
                    size={14}
                    className="animate-spin"
                    style={{ color: 'var(--vc-lime-main)' }}
                  />
                  <span className="text-[13px]" style={{ color: 'var(--vc-white-dim)' }}>
                    Pensando…
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sugerencias */}
        {messages.length === 1 && !chatMut.isPending && (
          <div className="pb-3">
            <p
              className="mb-2 text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              Preguntas frecuentes
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all hover:translate-y-[-1px]"
                  style={{
                    background: 'var(--vc-black-mid)',
                    border: '1px solid rgba(198,255,60,0.2)',
                    color: 'var(--vc-white-dim)',
                  }}
                >
                  <Sparkles size={11} style={{ color: 'var(--vc-lime-main)' }} />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="sticky bottom-0 mb-4"
          style={{ background: 'var(--vc-black)' }}
        >
          <div
            className="flex items-end gap-2 rounded-xl p-2 transition-all"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px solid rgba(198,255,60,0.2)',
              boxShadow: '0 0 24px var(--vc-glow-lime)',
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Pregúntame cualquier cosa sobre tu tienda Vitalcom…"
              rows={1}
              disabled={chatMut.isPending}
              className="flex-1 resize-none bg-transparent px-3 py-2 text-[14px] outline-none"
              style={{
                color: 'var(--vc-white-soft)',
                maxHeight: 150,
                fontFamily: 'var(--font-body)',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMut.isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-40"
              style={{
                background: 'var(--vc-gradient-primary)',
                color: 'var(--vc-black)',
                boxShadow: '0 0 12px var(--vc-glow-lime)',
              }}
            >
              {chatMut.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          background: isUser ? 'var(--vc-black-soft)' : 'var(--vc-gradient-primary)',
          border: isUser ? '1px solid var(--vc-gray-dark)' : 'none',
        }}
      >
        {isUser ? (
          <User size={14} style={{ color: 'var(--vc-white-dim)' }} />
        ) : (
          <Bot size={15} style={{ color: 'var(--vc-black)' }} />
        )}
      </div>
      <div
        className="max-w-[calc(100%-60px)] rounded-xl px-4 py-3"
        style={{
          background: isUser ? 'rgba(198,255,60,0.08)' : 'var(--vc-black-mid)',
          border: isUser
            ? '1px solid rgba(198,255,60,0.25)'
            : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="whitespace-pre-wrap text-[13px] leading-relaxed"
          style={{ color: 'var(--vc-white-soft)' }}
          dangerouslySetInnerHTML={{
            __html: formatInlineMarkdown(message.content),
          }}
        />
      </div>
    </div>
  )
}

// Minimal markdown: **bold** + /rutas clickables + backticks como code
function formatInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--vc-lime-main)">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(198,255,60,0.12);padding:1px 5px;border-radius:3px;font-family:var(--font-mono);font-size:0.9em;">$1</code>')
    .replace(
      /(\s|^)(\/[a-z\-]+(?:\/[a-z\-0-9]+)*)/g,
      '$1<a href="$2" style="color:var(--vc-lime-main);text-decoration:underline;text-underline-offset:2px">$2</a>',
    )
}
