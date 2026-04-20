'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[vitalcom:global-error]', error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#f5f5f5',
          fontFamily: "'Inter', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '4rem',
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 0 24px rgba(255, 71, 87, 0.4))',
            }}
          >
            🚨
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              marginBottom: '1rem',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Error crítico del sistema
          </h1>

          <p style={{ color: '#b8b8b8', marginBottom: '2rem' }}>
            Ocurrió un fallo en la capa raíz de la aplicación. Nuestro equipo ha sido notificado.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#4a4a4a',
                marginBottom: '2rem',
              }}
            >
              Ref: <span style={{ color: '#c6ff3c' }}>{error.digest}</span>
            </p>
          )}

          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.625rem',
              background: '#c6ff3c',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid rgba(223, 255, 128, 0.4)',
              boxShadow: '0 0 24px rgba(198, 255, 60, 0.4)',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
