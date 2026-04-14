'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

// ── Navegación móvil fija inferior ───────────────────────
// Se usa tanto en admin como en comunidad.
// Muestra los 5 ítems más importantes de cada contexto.

type MobileNavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
}

export function MobileNav({ items }: { items: MobileNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around lg:hidden"
      style={{
        background: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(198, 255, 60, 0.12)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href ||
          (item.href !== '/feed' && item.href !== '/admin' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center gap-0.5 px-2 py-3 transition-all"
            style={{ minWidth: 56 }}
          >
            <div className="relative">
              <Icon size={20} style={{ color: active ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
              {item.badge && (
                <span
                  className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[8px] font-bold"
                  style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className="text-[9px] font-semibold"
              style={{
                color: active ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {item.label}
            </span>
            {active && (
              <span
                className="absolute top-0 h-0.5 w-8 rounded-full"
                style={{ background: 'var(--vc-lime-main)', boxShadow: '0 0 8px var(--vc-glow-lime)' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
