'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Reportar con digest Next.js para correlacionar con server logs
    fetch('/api/observability/client-error', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        surface: 'root',
        message: error.message,
        digest: error.digest,
      }),
    }).catch(() => {})
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[var(--vc-black)]">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8"
          style={{
            background: 'var(--vc-gradient-glow)',
            border: '1px solid rgba(255, 71, 87, 0.4)',
          }}
        >
          <span className="text-4xl">⚠️</span>
        </div>

        <h1
          className="text-3xl md:text-4xl font-black mb-4"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
        >
          Algo salió mal
        </h1>

        <p className="mb-2 text-[var(--vc-white-dim)]">
          Ocurrió un error inesperado mientras procesábamos tu solicitud.
        </p>

        {error.digest && (
          <p className="mb-8 text-xs font-mono text-[var(--vc-gray-mid)]">
            Código de referencia: <span className="text-[var(--vc-lime-main)]">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all"
            style={{
              background: 'var(--vc-lime-main)',
              color: 'var(--vc-black)',
              boxShadow: '0 0 24px var(--vc-glow-lime), 0 4px 16px rgba(168,255,0,0.25)',
              border: '1px solid rgba(223, 255, 128, 0.4)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Reintentar
          </button>

          <Link
            href="/"
            className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all border"
            style={{
              background: 'transparent',
              color: 'var(--vc-white-soft)',
              borderColor: 'rgba(198, 255, 60, 0.3)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
