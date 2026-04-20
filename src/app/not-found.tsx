import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada · Vitalcom',
  description: 'La página que buscas no existe o fue movida.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[var(--vc-black)]">
      <div className="max-w-lg w-full text-center">
        <div
          className="text-8xl md:text-9xl font-black mb-6 leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            background: 'var(--vc-gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.02em',
          }}
        >
          404
        </div>

        <h1
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
        >
          Esta hoja no está en el bosque
        </h1>

        <p className="mb-10 text-[var(--vc-white-dim)]">
          La página que buscas no existe o fue movida. Volvamos a terreno conocido.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all"
            style={{
              background: 'var(--vc-lime-main)',
              color: 'var(--vc-black)',
              boxShadow: '0 0 24px var(--vc-glow-lime), 0 4px 16px rgba(168,255,0,0.25)',
              border: '1px solid rgba(223, 255, 128, 0.4)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Ir al inicio
          </Link>

          <Link
            href="/feed"
            className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all border"
            style={{
              background: 'transparent',
              color: 'var(--vc-white-soft)',
              borderColor: 'rgba(198, 255, 60, 0.3)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Ir a la comunidad
          </Link>
        </div>
      </div>
    </main>
  )
}
