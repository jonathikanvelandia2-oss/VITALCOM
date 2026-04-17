'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Leaf, Loader2, Sparkles, TrendingUp, ShoppingBag, Trophy, BookOpen, Calculator } from 'lucide-react'

const QUICK_COMMANDS = [
  { label: '🛍️ Catálogo completo', command: 'Muéstrame el catálogo completo con los productos más vendidos', icon: ShoppingBag },
  { label: '💰 Calcular precio', command: 'Quiero calcular el precio de venta de un producto con margen del 30%', icon: Calculator },
  { label: '📦 Mis pedidos', command: 'Muéstrame todos mis pedidos y su estado actual', icon: TrendingUp },
  { label: '🏆 Ranking comunidad', command: 'Muéstrame el ranking de la comunidad VITALCOMMERS', icon: Trophy },
  { label: '📊 Mis estadísticas', command: 'Quiero ver mis estadísticas personales completas', icon: TrendingUp },
  { label: '🔍 Buscar producto', command: 'Busca productos de la categoría Suplementos Nutricionales', icon: BookOpen },
]

function getMessageText(msg: { parts: Array<{ type: string; text?: string }> }): string {
  return msg.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text || '')
    .join('')
}

export function VitaFullPage() {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/assistant/chat' }), [])

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [
      {
        id: 'welcome',
        role: 'assistant' as const,
        parts: [{ type: 'text' as const, text: '¡Hola! Soy **VITA**, tu asistente IA de Vitalcom. Estoy aquí para ayudarte con todo lo que necesites como VITALCOMMER:\n\n• **Catálogo**: Buscar productos, ver precios, stock disponible\n• **Precios**: Calcular márgenes de venta por país\n• **Pedidos**: Consultar estado, historial\n• **Comunidad**: Ranking, estadísticas, niveles\n\n¿En qué te puedo ayudar hoy?' }],
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
            j % 2 === 1 ? <strong key={j} className="text-[#C6FF3C]">{part}</strong> : part,
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(198, 255, 60, 0.15), rgba(168, 255, 0, 0.08))',
            border: '1px solid rgba(198, 255, 60, 0.25)',
            boxShadow: '0 0 20px rgba(198, 255, 60, 0.1)',
          }}
        >
          <Leaf size={24} style={{ color: '#C6FF3C' }} />
        </div>
        <div>
          <h1 className="font-bold text-xl" style={{ color: '#F5F5F5', fontFamily: 'var(--font-heading)' }}>
            VITA
          </h1>
          <p className="text-xs" style={{ color: '#B8B8B8' }}>
            Vitalcom Intelligent Tech Assistant
          </p>
        </div>
        <div className="flex items-center gap-1.5 ml-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#C6FF3C' }} />
          <span className="text-[11px]" style={{ color: '#C6FF3C' }}>En línea</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <div
        className="flex-1 overflow-y-auto rounded-xl px-4 py-4 flex flex-col gap-4 mb-4"
        style={{ background: '#0D0D0D', border: '1px solid rgba(198, 255, 60, 0.1)' }}
      >
        {/* Tarjetas de bienvenida */}
        {showWelcome && messages.length <= 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => handleSend(cmd.command)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all hover:scale-105"
                style={{ background: 'rgba(198, 255, 60, 0.04)', border: '1px solid rgba(198, 255, 60, 0.12)' }}
              >
                <cmd.icon size={20} style={{ color: '#C6FF3C' }} />
                <span className="text-[11px] font-medium" style={{ color: '#B8B8B8' }}>
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
            <div key={msg.id}>
              <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-start gap-2 max-w-[85%]">
                  {role === 'assistant' && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1"
                      style={{ background: 'rgba(198, 255, 60, 0.1)' }}
                    >
                      <Leaf size={14} style={{ color: '#C6FF3C' }} />
                    </div>
                  )}
                  <div
                    className="px-4 py-3 rounded-xl text-sm leading-relaxed"
                    style={
                      role === 'assistant'
                        ? { background: '#141414', border: '1px solid rgba(198, 255, 60, 0.12)', color: '#E0E0E0' }
                        : { background: 'linear-gradient(135deg, #C6FF3C, #A8FF00)', color: '#0A0A0A', fontWeight: 500 }
                    }
                  >
                    {renderText(text)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(198, 255, 60, 0.1)' }}
              >
                <Sparkles size={14} className="animate-pulse" style={{ color: '#C6FF3C' }} />
              </div>
              <div
                className="px-4 py-2.5 rounded-xl flex items-center gap-2"
                style={{ background: '#141414', border: '1px solid rgba(198, 255, 60, 0.12)' }}
              >
                <Loader2 size={14} className="animate-spin" style={{ color: '#C6FF3C' }} />
                <span className="text-sm" style={{ color: '#B8B8B8' }}>VITA está pensando...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.3)', color: '#fca5a5' }}
            >
              Error: {error.message || 'No se pudo conectar con VITA'}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(198, 255, 60, 0.15)' }}
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
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: '#F5F5F5' }}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30 transition-all hover:scale-110"
          style={{ background: '#C6FF3C', boxShadow: '0 0 12px rgba(198, 255, 60, 0.3)' }}
        >
          <Send size={15} color="#0A0A0A" />
        </button>
      </div>
    </div>
  )
}
