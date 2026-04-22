'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    fetch('/api/observability/client-error', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        surface: 'auth',
        message: error.message,
        digest: error.digest,
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--vc-black)]">
      <div className="max-w-md w-full rounded-2xl border border-[var(--vc-error)]/30 bg-[var(--vc-black-mid)] p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--vc-error)]/10 border border-[var(--vc-error)]/40">
          <AlertCircle className="h-7 w-7 text-[var(--vc-error)]" />
        </div>
        <h2
          className="mb-2 text-xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
        >
          No pudimos autenticarte
        </h2>
        <p className="mb-4 text-sm text-[var(--vc-white-dim)]">
          Hubo un problema procesando tu sesión. Intenta de nuevo o regresa al inicio.
        </p>
        {error.digest && (
          <div className="mb-4 rounded-md bg-[var(--vc-black-soft)] px-3 py-1.5 font-mono text-[10px] text-[var(--vc-gray-mid)]">
            Ref: <span className="text-[var(--vc-lime-main)]">{error.digest}</span>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] transition hover:bg-[var(--vc-lime-electric)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--vc-white-soft)] transition hover:border-[var(--vc-lime-main)]/40"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
