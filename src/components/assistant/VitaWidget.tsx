'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Send, Loader2, Leaf } from 'lucide-react'

const QUICK_COMMANDS = [
  { label: '🛍️ Ver catálogo', command: 'Muéstrame los productos más vendidos del catálogo' },
  { label: '💰 Calcular precio', command: 'Ayúdame a calcular el precio de venta de un producto' },
  { label: '📦 Mis pedidos', command: 'Muéstrame mis pedidos recientes' },
  { label: '📊 Mi ranking', command: 'Cómo estoy en el ranking de la comunidad?' },
]

interface ActionChip {
  label: string
  href: string
}

function getActionChips(text: string): ActionChip[] {
  const chips: ActionChip[] = []
  const lower = text.toLowerCase()
  if (lower.includes('catálogo') || lower.includes('producto')) {
    chips.push({ label: '🛍️ Ver catálogo', href: '/herramientas/catalogo' })
  }
  if (lower.includes('pedido')) {
    chips.push({ label: '📦 Mis pedidos', href: '/mi-tienda' })
  }
  if (lower.includes('ranking') || lower.includes('nivel') || lower.includes('puntos')) {
    chips.push({ label: '🏆 Ranking', href: '/ranking' })
  }
  if (lower.includes('curso') || lower.includes('formación')) {
    chips.push({ label: '📚 Cursos', href: '/cursos' })
  }
  if (lower.includes('calculadora') || lower.includes('precio') || lower.includes('margen')) {
    chips.push({ label: '💰 Calculadora', href: '/herramientas/calculadora' })
  }
  return chips.slice(0, 3)
}

function getMessageText(msg: { parts: Array<{ type: string; text?: string }> }): string {
  return msg.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text || '')
    .join('')
}

export function VitaWidget() {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/assistant/chat' }), [])
  const router = useRouter()

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [
      {
        id: 'welcome',
        role: 'assistant' as const,
        parts: [{ type: 'text' as const, text: '¡Hola! Soy **VITA**, tu asistente IA de Vitalcom. Puedo ayudarte con el catálogo, precios, pedidos, ranking y todo lo que necesites como VITALCOMMER. ¿En qué te ayudo?' }],
      },
    ],
  })

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  function handleSend(text: string) {
    if (!text.trim() || isLoading) return
    sendMessage({ text })
    setInput('')
  }

  function renderText(text: string) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="text-[#C6FF3C]">{part}</strong> : part,
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <>
      {open && (
        <div
          className="fixed z-50 flex flex-col rounded-2xl overflow-hidden inset-3 sm:inset-auto sm:bottom-24 sm:right-6"
          style={{
            maxWidth: 400,
            maxHeight: 560,
            background: '#0A0A0A',
            border: '1px solid rgba(198, 255, 60, 0.3)',
            boxShadow: '0 0 40px rgba(198, 255, 60, 0.15), 0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(198, 255, 60, 0.08) 0%, rgba(10, 10, 10, 0.95) 100%)',
              borderBottom: '1px solid rgba(198, 255, 60, 0.15)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(198, 255, 60, 0.2), rgba(168, 255, 0, 0.1))',
                  border: '1px solid rgba(198, 255, 60, 0.3)',
                }}
              >
                <Leaf size={16} style={{ color: '#C6FF3C' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#F5F5F5', fontFamily: 'var(--font-heading)' }}>
                  VITA
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C6FF3C' }} />
                  <p className="text-[10px]" style={{ color: '#B8B8B8' }}>En línea</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: '#B8B8B8' }}
              aria-label="Cerrar VITA"
            >
              <X size={14} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.map((msg) => {
              const text = getMessageText(msg)
              if (!text) return null
              const role = msg.role as string
              return (
                <div key={msg.id}>
                  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[88%] px-3 py-2.5 rounded-xl text-sm leading-relaxed"
                      style={
                        role === 'assistant'
                          ? { background: '#141414', border: '1px solid rgba(198, 255, 60, 0.15)', color: '#E0E0E0' }
                          : { background: 'linear-gradient(135deg, #C6FF3C, #A8FF00)', color: '#0A0A0A', fontWeight: 500 }
                      }
                    >
                      {renderText(text)}
                      {role === 'assistant' && (() => {
                        const chips = getActionChips(text)
                        if (chips.length === 0) return null
                        return (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2" style={{ borderTop: '1px solid rgba(198, 255, 60, 0.1)' }}>
                            {chips.map(chip => (
                              <button
                                key={chip.href}
                                onClick={() => { router.push(chip.href); setOpen(false) }}
                                className="px-2 py-1 rounded-md text-[10px] font-medium transition-all hover:scale-105"
                                style={{ background: 'rgba(198, 255, 60, 0.1)', border: '1px solid rgba(198, 255, 60, 0.2)', color: '#C6FF3C' }}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded-xl flex items-center gap-1.5"
                  style={{ background: '#141414', border: '1px solid rgba(198, 255, 60, 0.15)' }}
                >
                  <Loader2 size={12} className="animate-spin" style={{ color: '#C6FF3C' }} />
                  <span className="text-xs" style={{ color: '#B8B8B8' }}>VITA está pensando...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded-xl text-xs"
                  style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.3)', color: '#fca5a5' }}
                >
                  Error: {error.message || 'No se pudo conectar con VITA'}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Comandos rápidos */}
          <div
            className="shrink-0 px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => handleSend(cmd.command)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] transition-all whitespace-nowrap disabled:opacity-50 hover:scale-105"
                style={{ background: 'rgba(198, 255, 60, 0.08)', border: '1px solid rgba(198, 255, 60, 0.2)', color: '#C6FF3C' }}
              >
                {cmd.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="shrink-0 px-3 py-2.5">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(198, 255, 60, 0.12)' }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(input)
                  }
                }}
                placeholder="Pregúntale a VITA..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#4A4A4A]"
                style={{ color: '#F5F5F5' }}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={isLoading || !input.trim()}
                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30 transition-all hover:scale-110"
                style={{ background: '#C6FF3C' }}
              >
                <Send size={13} color="#0A0A0A" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: open
            ? 'linear-gradient(135deg, #4A6B00, #7FB800)'
            : 'linear-gradient(135deg, #A8FF00, #C6FF3C)',
          boxShadow: '0 0 24px rgba(198, 255, 60, 0.4), 0 4px 16px rgba(168, 255, 0, 0.25)',
        }}
        aria-label={open ? 'Cerrar VITA' : 'Abrir VITA'}
      >
        {open ? <X size={22} color="#0A0A0A" /> : <Leaf size={22} color="#0A0A0A" />}
      </button>
    </>
  )
}
