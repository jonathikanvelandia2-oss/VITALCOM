import { Send, Search, Phone, Video } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// Chat 1-a-1 entre miembros de la comunidad Vitalcom
const CONVERSATIONS = [
  { id: '1', name: 'Andrés Gómez', last: '¿Tienes el flujo de carrito abandonado?', time: '14:32', unread: 2, avatar: 'AG', active: true },
  { id: '2', name: 'Verónica Salas', last: '¡Genial! Mañana lo pruebo', time: '13:50', unread: 0, avatar: 'VS' },
  { id: '3', name: 'Felipe R. · Marketing', last: 'Te paso los creativos por aquí', time: '11:20', unread: 0, avatar: 'FR' },
  { id: '4', name: 'Soporte Vitalcom', last: 'Tu pedido VC-2026-00298 fue despachado', time: 'ayer', unread: 0, avatar: 'SV' },
  { id: '5', name: 'Laura Bedoya', last: 'Gracias por el tip 🙌', time: 'ayer', unread: 0, avatar: 'LB' },
]

const MESSAGES = [
  { from: 'them', body: 'Hey María, vi tu post del fin de semana 🔥', time: '14:20' },
  { from: 'me', body: '¡Gracias Andrés! Cerré 18 ventas con el flujo de Luzitbot que compartió Felipe', time: '14:22' },
  { from: 'them', body: 'Eso es brutal. ¿Tienes el flujo de carrito abandonado también?', time: '14:32' },
  { from: 'them', body: 'Me interesa probarlo esta semana', time: '14:32' },
]

export default function ChatPage() {
  return (
    <>
      <CommunityTopbar
        title="Chat"
        subtitle="Mensajería con miembros de la comunidad"
      />
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Lista de conversaciones */}
        <div
          className="hidden w-80 shrink-0 flex-col md:flex"
          style={{
            background: 'var(--vc-black-mid)',
            borderRight: '1px solid var(--vc-gray-dark)',
          }}
        >
          <div className="p-4">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
              }}
            >
              <Search size={14} color="var(--vc-gray-mid)" />
              <input
                placeholder="Buscar conversaciones..."
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: 'var(--vc-white-soft)' }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {CONVERSATIONS.map((c) => (
              <button
                key={c.id}
                className="mb-1 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                style={{
                  background: c.active ? 'rgba(198, 255, 60, 0.08)' : 'transparent',
                  border: c.active
                    ? '1px solid rgba(198, 255, 60, 0.3)'
                    : '1px solid transparent',
                }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: 'var(--vc-gradient-primary)',
                    color: 'var(--vc-black)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {c.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className="truncate text-xs font-bold"
                      style={{
                        color: 'var(--vc-white-soft)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {c.name}
                    </p>
                    <span
                      className="shrink-0 text-[10px]"
                      style={{ color: 'var(--vc-gray-mid)' }}
                    >
                      {c.time}
                    </span>
                  </div>
                  <p
                    className="truncate text-[11px]"
                    style={{ color: 'var(--vc-white-dim)' }}
                  >
                    {c.last}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{
                      background: 'var(--vc-lime-main)',
                      color: 'var(--vc-black)',
                    }}
                  >
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversación activa */}
        <div className="flex flex-1 flex-col">
          {/* Header de la conversación */}
          <div
            className="flex items-center justify-between px-6 py-3"
            style={{
              borderBottom: '1px solid var(--vc-gray-dark)',
              background: 'var(--vc-black-mid)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: 'var(--vc-gradient-primary)',
                  color: 'var(--vc-black)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                AG
              </div>
              <div>
                <p
                  className="text-sm font-bold"
                  style={{
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Andrés Gómez
                </p>
                <p className="text-[10px]" style={{ color: 'var(--vc-lime-main)' }}>
                  ● en línea · Rama 🌿
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconBtn icon={<Phone size={14} />} />
              <IconBtn icon={<Video size={14} />} />
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto p-6">
            {MESSAGES.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-md rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    background:
                      m.from === 'me'
                        ? 'var(--vc-lime-main)'
                        : 'var(--vc-black-mid)',
                    color: m.from === 'me' ? 'var(--vc-black)' : 'var(--vc-white-soft)',
                    border:
                      m.from === 'me' ? 'none' : '1px solid var(--vc-gray-dark)',
                    boxShadow:
                      m.from === 'me' ? '0 0 16px var(--vc-glow-lime)' : 'none',
                  }}
                >
                  {m.body}
                  <div
                    className="mt-1 text-[9px]"
                    style={{
                      color: m.from === 'me' ? 'rgba(10,10,10,0.6)' : 'var(--vc-gray-mid)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div
            className="flex items-center gap-3 p-4"
            style={{
              borderTop: '1px solid var(--vc-gray-dark)',
              background: 'var(--vc-black-mid)',
            }}
          >
            <input
              placeholder="Escribe un mensaje..."
              className="flex-1 rounded-full px-5 py-3 text-sm outline-none"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-soft)',
              }}
            />
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                background: 'var(--vc-lime-main)',
                color: 'var(--vc-black)',
                boxShadow: '0 0 20px var(--vc-glow-lime)',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function IconBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button
      className="flex h-9 w-9 items-center justify-center rounded-lg"
      style={{
        background: 'var(--vc-black-soft)',
        border: '1px solid var(--vc-gray-dark)',
        color: 'var(--vc-white-dim)',
      }}
    >
      {icon}
    </button>
  )
}
