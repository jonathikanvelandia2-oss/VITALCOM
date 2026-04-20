'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Send, Brain, Loader2, Sparkles, TrendingUp,
  Package, DollarSign, Target, Users2, MessageSquare, Map,
} from 'lucide-react'

// ── Asesor CEO — chat operativo con datos globales ────

const QUICK_COMMANDS = [
  { label: 'P&L últimos 30 días', command: '¿Cómo va el P&L de Vitalcom en los últimos 30 días? Dame revenue, COGS, margen y delta vs periodo anterior.', icon: DollarSign },
  { label: 'Adquisición del mes', command: 'Resumen de marketing del último mes: nuevos usuarios, dropshippers, tiendas conectadas y engagement.', icon: Target },
  { label: 'Alertas de inventario', command: '¿Qué productos tengo en riesgo de quiebre de stock? Dame los top 10 críticos.', icon: Package },
  { label: 'Pulso operativo', command: '¿Cuántos pedidos tengo pendientes y cuál es el tiempo promedio de despacho de la semana?', icon: TrendingUp },
  { label: 'Top productos rentables', command: 'Dame los top 10 productos por margen de utilidad en los últimos 30 días.', icon: Sparkles },
  { label: 'Segmentación comunidad', command: '¿Cómo está segmentada mi comunidad? Cuéntame cuántos VIP, activos, en riesgo e inactivos tengo.', icon: Users2 },
  { label: 'Inbox interno', command: '¿Qué hilos del inbox interno están sin resolver y cuáles son urgentes?', icon: MessageSquare },
  { label: 'Breakdown por país', command: 'Compárame revenue y actividad entre CO, EC, GT y CL en el último mes.', icon: Map },
]

function getMessageText(msg: { parts: Array<{ type: string; text?: string }> }): string {
  return msg.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text || '')
    .join('')
}

export function CEOAdvisorChat() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/admin/ai/ceo-chat' }),
    [],
  )

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [
      {
        id: 'welcome',
        role: 'assistant' as const,
        parts: [{
          type: 'text' as const,
          text: 'Soy tu **Asesor CEO** — leo los datos en vivo de Vitalcom y te doy recomendaciones basadas en números reales.\n\n**Puedo analizar:**\n• Finanzas (P&L, margen, ticket, delta)\n• Marketing (adquisición, engagement, conversión)\n• Inventario (riesgos de quiebre, rotación)\n• Operación (pedidos, despachos, SLA)\n• Comunidad (segmentación VIP/riesgo)\n• Inbox interno y carga por área\n• Breakdown por país\n\n¿Qué quieres revisar?',
        }],
      },
    ],
  })

  const [input, setInput] = useState('')
  const [showWelcome, setShowWelcome] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length > 1) setShowWelcome(false)
  }, [messages.length])

  function handleSend(text: string) {
    if (!text.trim() || isLoading) return
    setShowWelcome(false)
    sendMessage({ text })
    setInput('')
  }

  function renderText(text: string) {
    return text.split('\n').map((line, i) => {
      const isBullet = line.startsWith('• ') || line.startsWith('- ')
      const parts = line.split(/\*\*(.+?)\*\*/g)
      return (
        <span key={i} className={isBullet ? 'block pl-2' : ''}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ color: 'var(--vc-lime-main)' }}>{part}</strong>
              : part,
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4"
        style={{ borderColor: 'rgba(198, 255, 60, 0.12)' }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(198,255,60,0.18), rgba(168,255,0,0.08))',
            border: '1px solid rgba(198,255,60,0.3)',
            boxShadow: '0 0 20px rgba(198,255,60,0.15)',
          }}>
          <Brain size={22} style={{ color: 'var(--vc-lime-main)' }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-black"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
            Asesor CEO
          </h1>
          <p className="text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
            IA conectada a tus datos operativos en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 animate-pulse rounded-full"
            style={{ background: 'var(--vc-lime-main)' }} />
          <span className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
            Live data
          </span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {showWelcome && messages.length <= 1 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => handleSend(cmd.command)}
                  className="flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(198,255,60,0.04)',
                    border: '1px solid rgba(198,255,60,0.12)',
                  }}
                >
                  <cmd.icon size={16} style={{ color: 'var(--vc-lime-main)' }} />
                  <span className="text-[11px] font-semibold leading-snug"
                    style={{ color: 'var(--vc-white-dim)' }}>
                    {cmd.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => {
            const text = getMessageText(msg)
            if (!text) return null
            const role = msg.role as string

            return (
              <div key={msg.id}
                className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex max-w-[85%] items-start gap-2">
                  {role === 'assistant' && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(198,255,60,0.12)' }}>
                      <Brain size={13} style={{ color: 'var(--vc-lime-main)' }} />
                    </div>
                  )}
                  <div className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                    style={role === 'assistant'
                      ? { background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.12)', color: 'var(--vc-white-soft)' }
                      : { background: 'linear-gradient(135deg, var(--vc-lime-main), var(--vc-lime-electric))', color: 'var(--vc-black)', fontWeight: 500 }}>
                    {renderText(text)}
                  </div>
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(198,255,60,0.12)' }}>
                  <Sparkles size={13} className="animate-pulse"
                    style={{ color: 'var(--vc-lime-main)' }} />
                </div>
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                  style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.12)' }}>
                  <Loader2 size={13} className="animate-spin"
                    style={{ color: 'var(--vc-lime-main)' }} />
                  <span className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
                    Consultando datos…
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl px-4 py-2 text-sm"
              style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#fca5a5' }}>
              {error.message || 'No se pudo conectar con el Asesor CEO'}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4"
        style={{ borderColor: 'rgba(198, 255, 60, 0.12)', background: 'var(--vc-black-mid)' }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl px-4 py-2.5"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid rgba(198,255,60,0.15)' }}>
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
            placeholder="Pregunta sobre finanzas, marketing, operación…"
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--vc-white-soft)' }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:scale-110 disabled:opacity-30"
            style={{ background: 'var(--vc-lime-main)', boxShadow: '0 0 12px var(--vc-glow-lime)' }}
          >
            <Send size={14} color="var(--vc-black)" />
          </button>
        </div>
      </div>
    </div>
  )
}
