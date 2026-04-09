'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingBag,
  Users,
  Inbox,
  DollarSign,
  Settings,
  LogOut,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

// Navegación lateral del SaaS administrativo Vitalcom
// Cada item lleva al módulo correspondiente del panel
const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/catalogo', label: 'Catálogo', icon: Package },
  { href: '/admin/stock', label: 'Stock', icon: Warehouse },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/inbox', label: 'Inbox interno', icon: Inbox },
  { href: '/admin/finanzas', label: 'Finanzas', icon: DollarSign },
  { href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col lg:flex"
      style={{
        background: 'var(--vc-black-mid)',
        borderRight: '1px solid rgba(198, 255, 60, 0.12)',
      }}
    >
      <div
        className="flex h-16 items-center px-5"
        style={{ borderBottom: '1px solid rgba(198, 255, 60, 0.12)' }}
      >
        <Logo size={36} />
      </div>

      <div
        className="px-5 py-4"
        style={{ borderBottom: '1px solid var(--vc-gray-dark)' }}
      >
        <p
          className="text-[10px] uppercase tracking-[0.2em]"
          style={{
            color: 'var(--vc-gray-mid)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Panel administrativo
        </p>
        <p
          className="mt-1 text-sm font-bold"
          style={{
            color: 'var(--vc-lime-main)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          🇨🇴 Colombia
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all"
              style={{
                background: active ? 'rgba(198, 255, 60, 0.1)' : 'transparent',
                border: active
                  ? '1px solid rgba(198, 255, 60, 0.35)'
                  : '1px solid transparent',
                color: active ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                fontFamily: 'var(--font-heading)',
                fontWeight: active ? 600 : 500,
                boxShadow: active ? '0 0 16px var(--vc-glow-lime)' : 'none',
              }}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer del sidebar */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid var(--vc-gray-dark)' }}
      >
        <div
          className="mb-3 flex items-center gap-3 rounded-lg p-2"
          style={{ background: 'var(--vc-black-soft)' }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
            style={{
              background: 'var(--vc-lime-main)',
              color: 'var(--vc-black)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            CV
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-xs font-semibold"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              CEO Vitalcom
            </p>
            <p
              className="truncate text-[10px]"
              style={{ color: 'var(--vc-lime-main)' }}
            >
              SUPERADMIN
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
          style={{
            background: 'transparent',
            border: '1px solid var(--vc-gray-dark)',
            color: 'var(--vc-white-dim)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          <LogOut size={14} /> Cerrar sesión
        </Link>
      </div>
    </aside>
  )
}
