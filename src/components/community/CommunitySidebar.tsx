'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  GraduationCap,
  Calendar,
  Calculator,
  BookOpen,
  Store,
  MessageSquare,
  User,
  Trophy,
  LogOut,
  BarChart3,
  Zap,
  CheckSquare,
  Megaphone,
  Video,
  ShoppingBag,
  TrendingUp,
  Package,
  Leaf,
  Wallet,
  ShoppingCart,
  Target,
  Rocket,
  Sparkles,
  Brain,
  Wand2,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

// Sidebar de la plataforma comunitaria VITALCOMMERS
// Prioridad: Tienda > Rendimiento > Catálogo > Comunidad > Herramientas

type NavSection = { title: string; items: { href: string; label: string; icon: typeof Home; badge?: string }[] }

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Tu negocio',
    items: [
      { href: '/mi-tienda', label: 'Mi Tienda', icon: ShoppingBag, badge: '3' },
      { href: '/pedidos', label: 'Mis Pedidos', icon: ShoppingCart },
      { href: '/mi-pyg', label: 'Mi P&G', icon: Wallet },
      { href: '/publicidad', label: 'Publicidad', icon: Rocket },
      { href: '/lanzador', label: 'Lanzador Ads', icon: Sparkles },
      { href: '/mediabuyer', label: 'MediaBuyer IA', icon: Brain },
      { href: '/creativo', label: 'CreativoMaker', icon: Wand2 },
      { href: '/optimizador', label: 'OptimizadorTienda', icon: Store, badge: 'NEW' },
      { href: '/mi-blueprint', label: 'Mi Blueprint', icon: Target, badge: 'IA' },
      { href: '/rendimiento', label: 'Rendimiento', icon: TrendingUp },
      { href: '/herramientas/catalogo', label: 'Catálogo Vitalcom', icon: Package },
      { href: '/herramientas/calculadora', label: 'Calculadora', icon: Calculator },
      { href: '/asistente', label: 'VITA IA', icon: Leaf },
    ],
  },
  {
    title: 'Comunidad',
    items: [
      { href: '/feed', label: 'Feed', icon: Home },
      { href: '/cursos', label: 'Cursos', icon: GraduationCap },
      { href: '/ranking', label: 'Ranking', icon: Trophy },
      { href: '/chat', label: 'Chat', icon: MessageSquare },
      { href: '/eventos', label: 'Eventos', icon: Calendar },
      { href: '/reuniones', label: 'Reuniones', icon: Video },
    ],
  },
  {
    title: 'Herramientas',
    items: [
      { href: '/marketing', label: 'Marketing', icon: Megaphone },
      { href: '/automatizaciones', label: 'Automatizaciones', icon: Zap },
      { href: '/analitica', label: 'Analítica', icon: BarChart3 },
      { href: '/tareas', label: 'Tareas', icon: CheckSquare },
      { href: '/recursos', label: 'Biblioteca', icon: BookOpen },
    ],
  },
]

export function CommunitySidebar() {
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
            color: 'var(--vc-lime-main)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          VITALCOMMERS
        </p>
        <p
          className="mt-1 text-sm font-bold"
          style={{
            color: 'var(--vc-white-soft)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          1.547 miembros · 🇨🇴
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-3">
            <p
              className="mb-1.5 px-3 text-[9px] uppercase tracking-[0.15em]"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all"
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
                  <Icon size={16} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Tarjeta de perfil con nivel */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid var(--vc-gray-dark)' }}
      >
        <Link href="/perfil"
          className="mb-3 block rounded-lg p-3 transition-all hover:border-[rgba(198,255,60,0.4)]"
          style={{
            background: 'var(--vc-black-soft)',
            border: '1px solid rgba(198, 255, 60, 0.2)',
          }}
        >
          <div className="mb-2 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: 'var(--vc-gradient-primary)',
                color: 'var(--vc-black)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              MR
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-xs font-semibold"
                style={{ color: 'var(--vc-white-soft)' }}
              >
                María Restrepo
              </p>
              <p
                className="text-[10px]"
                style={{ color: 'var(--vc-lime-main)' }}
              >
                Nivel 4 · Tallo 🌱
              </p>
            </div>
          </div>
          {/* Barra de progreso al siguiente nivel */}
          <div
            className="h-1.5 overflow-hidden rounded-full"
            style={{ background: 'var(--vc-gray-dark)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: '64%',
                background: 'var(--vc-gradient-primary)',
                boxShadow: '0 0 8px var(--vc-glow-lime)',
              }}
            />
          </div>
          <p
            className="mt-1.5 text-[9px]"
            style={{
              color: 'var(--vc-gray-mid)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            2.240 / 3.500 pts → Rama
          </p>
        </Link>
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{
            background: 'transparent',
            border: '1px solid var(--vc-gray-dark)',
            color: 'var(--vc-white-dim)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          <LogOut size={14} /> Salir
        </Link>
      </div>
    </aside>
  )
}
