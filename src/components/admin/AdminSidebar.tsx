'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Warehouse, ShoppingBag, Users,
  Inbox, DollarSign, Settings, LogOut, Megaphone, Truck,
  FileText, Calculator, Crown, BarChart3, Target, Zap,
  MessageSquare, Receipt, UserCheck, FolderOpen, Building2,
  Bot, Gauge, Brain, ShieldAlert,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { useInboxUnread } from '@/hooks/useInbox'

// ── Sidebar Admin Vitalcom ───────────────────────────────
// Vista CEO: acceso total a todas las áreas.
// Cada área tiene sus módulos asignados.
// Los agentes IA controlarán la operación en tiempo real.

type NavSection = {
  title: string
  icon: typeof Crown
  color: string
  items: { href: string; label: string; icon: typeof LayoutDashboard; badge?: string }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'CEO · Dirección',
    icon: Crown,
    color: 'var(--vc-lime-main)',
    items: [
      { href: '/admin', label: 'Dashboard general', icon: LayoutDashboard },
      { href: '/admin/asistente', label: 'Asesor CEO (IA)', icon: Brain, badge: 'IA' },
      { href: '/admin/bots', label: 'Bots autónomos', icon: Bot },
      { href: '/admin/escalations', label: 'Escalaciones IA', icon: ShieldAlert, badge: 'NEW' },
      { href: '/admin/inbox', label: 'Inbox interno', icon: Inbox },
      { href: '/admin/cache-stats', label: 'Cache stats', icon: Gauge },
      { href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
  {
    title: 'Comercial',
    icon: ShoppingBag,
    color: '#a855f7',
    items: [
      { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
      { href: '/admin/clientes', label: 'Clientes CRM', icon: Users },
      { href: '/admin/catalogo', label: 'Catálogo maestro', icon: Package },
    ],
  },
  {
    title: 'Marketing',
    icon: Megaphone,
    color: 'var(--vc-info)',
    items: [
      { href: '/admin/marketing', label: 'Campañas', icon: Target },
      { href: '/admin/comunidad', label: 'Comunidad', icon: MessageSquare },
      { href: '/admin/contenido', label: 'Contenido', icon: Megaphone },
    ],
  },
  {
    title: 'Logística',
    icon: Truck,
    color: 'var(--vc-lime-electric)',
    items: [
      { href: '/admin/stock', label: 'Stock multi-país', icon: Warehouse },
      { href: '/admin/despachos', label: 'Despachos Dropi', icon: Truck },
    ],
  },
  {
    title: 'Contabilidad',
    icon: Calculator,
    color: 'var(--vc-lime-deep)',
    items: [
      { href: '/admin/finanzas', label: 'Finanzas', icon: DollarSign },
      { href: '/admin/facturacion', label: 'Facturación', icon: Receipt },
    ],
  },
  {
    title: 'Administrativa',
    icon: FileText,
    color: 'var(--vc-warning)',
    items: [
      { href: '/admin/equipo', label: 'Equipo', icon: UserCheck },
      { href: '/admin/documentos', label: 'Documentos', icon: FolderOpen },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: unread } = useInboxUnread()
  const inboxBadge = unread?.total && unread.total > 0 ? String(unread.total > 99 ? '99+' : unread.total) : undefined

  return (
    <aside
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col lg:flex"
      style={{
        background: 'var(--vc-black-mid)',
        borderRight: '1px solid rgba(198, 255, 60, 0.12)',
      }}
    >
      <div className="flex h-16 items-center px-5"
        style={{ borderBottom: '1px solid rgba(198, 255, 60, 0.12)' }}>
        <Logo size={36} />
      </div>

      {/* Identificador de panel */}
      <div className="px-5 py-3"
        style={{ borderBottom: '1px solid var(--vc-gray-dark)' }}>
        <p className="text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
          Panel administrativo
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            🇨🇴 Colombia
          </span>
          <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase"
            style={{ background: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)' }}>
            <Bot size={8} /> Agentes activos
          </span>
        </div>
      </div>

      {/* Navegación por áreas */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => {
          const SectionIcon = section.icon
          return (
            <div key={section.title} className="mb-2">
              <div className="mb-1 flex items-center gap-2 px-3 py-1">
                <SectionIcon size={10} style={{ color: section.color }} />
                <p className="text-[9px] uppercase tracking-[0.15em]"
                  style={{ color: section.color, fontFamily: 'var(--font-mono)' }}>
                  {section.title}
                </p>
              </div>
              {section.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                const dynamicBadge = item.href === '/admin/inbox' ? inboxBadge : item.badge
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all"
                    style={{
                      background: active ? 'rgba(198, 255, 60, 0.1)' : 'transparent',
                      border: active ? '1px solid rgba(198,255,60,0.35)' : '1px solid transparent',
                      color: active ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: active ? 600 : 500,
                      boxShadow: active ? '0 0 16px var(--vc-glow-lime)' : 'none',
                    }}
                  >
                    <Icon size={15} />
                    <span className="flex-1">{item.label}</span>
                    {dynamicBadge && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-bold animate-pulse"
                        style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}>
                        {dynamicBadge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Perfil CEO */}
      <div className="p-4" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
        <div className="mb-3 flex items-center gap-3 rounded-lg p-2"
          style={{ background: 'var(--vc-black-soft)' }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
            CV
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              CEO Vitalcom
            </p>
            <p className="truncate text-[10px]" style={{ color: 'var(--vc-lime-main)' }}>
              SUPERADMIN
            </p>
          </div>
        </div>
        <Link href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
          style={{ background: 'transparent', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
          <LogOut size={14} /> Cerrar sesión
        </Link>
      </div>
    </aside>
  )
}
