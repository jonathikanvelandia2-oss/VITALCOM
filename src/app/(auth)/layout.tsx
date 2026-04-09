import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

// Layout compartido para todas las pantallas de autenticación
// Mantiene el branding Vitalcom: fondo negro + glow lima + logo arriba
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Glow radial de fondo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--vc-gradient-glow)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: 'var(--vc-gradient-hero)' }}
      />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <Logo size={42} />
        <Link
          href="/"
          className="text-sm font-medium transition-colors"
          style={{
            color: 'var(--vc-white-dim)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          ← Volver al inicio
        </Link>
      </header>

      {/* Contenido */}
      <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-6 pb-16">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="absolute bottom-4 left-0 right-0 text-center text-xs"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
      >
        Vitalcom Platform · Bienestar que conecta · 🇨🇴 Colombia
      </footer>
    </div>
  )
}
