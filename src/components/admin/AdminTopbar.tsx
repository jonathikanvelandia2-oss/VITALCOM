'use client'

import { Bell, Search } from 'lucide-react'

// Topbar fija del panel admin con buscador global y notificaciones
type Props = {
  title: string
  subtitle?: string
}

export function AdminTopbar({ title, subtitle }: Props) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-6"
      style={{
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(198, 255, 60, 0.18)',
      }}
    >
      <div className="min-w-0">
        <h1
          className="truncate text-lg font-bold"
          style={{
            color: 'var(--vc-white-soft)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="truncate text-[11px]"
            style={{
              color: 'var(--vc-gray-mid)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="hidden items-center gap-2 rounded-lg px-3 py-2 md:flex"
          style={{
            background: 'var(--vc-black-soft)',
            border: '1px solid var(--vc-gray-dark)',
            minWidth: 280,
          }}
        >
          <Search size={14} color="var(--vc-gray-mid)" />
          <input
            placeholder="Buscar pedidos, productos, clientes..."
            className="w-full bg-transparent text-xs outline-none"
            style={{ color: 'var(--vc-white-soft)' }}
          />
        </div>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            background: 'var(--vc-black-soft)',
            border: '1px solid var(--vc-gray-dark)',
            color: 'var(--vc-white-dim)',
          }}
        >
          <Bell size={16} />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{
              background: 'var(--vc-lime-main)',
              boxShadow: '0 0 8px var(--vc-glow-strong)',
            }}
          />
        </button>
      </div>
    </header>
  )
}
