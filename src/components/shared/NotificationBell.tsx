'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, Package, MessageSquare, Store, Heart, AtSign, AlertCircle, CheckCheck,
} from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllRead, type Notification } from '@/hooks/useNotifications'

// ── Bell de notificaciones ─────────────────────────────
// Dropdown compacto que muestra últimas 15 notificaciones
// con badge pulsante del total no leído.

const ICONS: Record<Notification['type'], typeof Bell> = {
  ORDER_STATUS: Package,
  ORDER_NEW: Package,
  INBOX_MESSAGE: MessageSquare,
  INBOX_ASSIGNED: MessageSquare,
  COMMUNITY_LIKE: Heart,
  COMMUNITY_REPLY: AtSign,
  COMMUNITY_DM: MessageSquare,
  STORE_CONNECTED: Store,
  SYSTEM: AlertCircle,
}

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

export function NotificationBell() {
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllRead()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const unread = data?.unreadCount ?? 0
  const items = data?.items ?? []

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:scale-105"
        style={{
          background: 'var(--vc-black-soft)',
          border: '1px solid var(--vc-gray-dark)',
          color: 'var(--vc-white-dim)',
        }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full px-1 text-[9px] font-bold"
            style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl shadow-2xl"
          style={{
            background: 'var(--vc-black-mid)',
            border: '1px solid rgba(198, 255, 60, 0.18)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 24px var(--vc-glow-lime)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'var(--vc-gray-dark)' }}>
            <div>
              <p className="text-sm font-bold"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                Notificaciones
              </p>
              <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
                {unread > 0 ? `${unread} sin leer` : 'Todo al día'}
              </p>
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all hover:opacity-80"
                style={{
                  background: 'rgba(198,255,60,0.1)',
                  color: 'var(--vc-lime-main)',
                  border: '1px solid rgba(198,255,60,0.3)',
                }}
              >
                <CheckCheck size={11} />
                Leer todo
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto mb-2 opacity-30"
                  style={{ color: 'var(--vc-white-dim)' }} />
                <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell
                const inner = (
                  <div className={`flex gap-3 px-4 py-3 transition-all ${n.read ? '' : 'bg-opacity-50'}`}
                    style={{
                      borderTop: '1px solid var(--vc-gray-dark)',
                      background: n.read ? 'transparent' : 'rgba(198,255,60,0.04)',
                    }}>
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(198,255,60,0.12)' }}>
                      <Icon size={13} style={{ color: 'var(--vc-lime-main)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold"
                        style={{ color: 'var(--vc-white-soft)' }}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-[11px]"
                          style={{ color: 'var(--vc-white-dim)' }}>
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[9px] uppercase tracking-wider"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: 'var(--vc-lime-main)' }} />
                    )}
                  </div>
                )

                function handleClick() {
                  if (!n.read) markRead.mutate(n.id)
                  setOpen(false)
                }

                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={handleClick}
                    className="block transition-colors hover:brightness-125">
                    {inner}
                  </Link>
                ) : (
                  <button key={n.id} onClick={handleClick}
                    className="block w-full text-left transition-colors hover:brightness-125">
                    {inner}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
