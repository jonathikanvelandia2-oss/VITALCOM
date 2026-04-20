'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'

// Página de "olvidé mi contraseña" — pide email y dispara email de reset
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok && res.status !== 200) {
        setError(json?.error || 'No pudimos procesar tu solicitud. Intenta más tarde.')
        setLoading(false)
        return
      }

      setSent(true)
      setLoading(false)
    } catch {
      setError('Error de conexión. Verifica tu internet.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="vc-card" style={{ padding: '2.5rem' }}>
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(198, 255, 60, 0.12)',
              border: '1px solid rgba(198, 255, 60, 0.3)',
            }}
          >
            <KeyRound size={24} color="var(--vc-lime-main)" />
          </div>
          <h1
            className="mb-1 text-2xl font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            Recupera tu acceso
          </h1>
          <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            Te enviaremos un enlace seguro para crear una nueva contraseña.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div
              className="flex items-start gap-3 rounded-lg p-4"
              style={{
                background: 'rgba(198, 255, 60, 0.08)',
                border: '1px solid rgba(198, 255, 60, 0.3)',
              }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--vc-lime-main)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--vc-lime-main)' }}>
                  Revisa tu correo
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                  Si el email existe en nuestra base, llegará un enlace válido por 60 minutos.
                  Mira también la carpeta de spam.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="block text-center text-sm font-semibold"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="flex items-center gap-2 rounded-lg p-3"
                style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}
              >
                <AlertCircle size={16} style={{ color: 'var(--vc-error)', flexShrink: 0 }} />
                <p className="text-xs font-medium" style={{ color: 'var(--vc-error)' }}>
                  {error}
                </p>
              </div>
            )}

            <div>
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--vc-gray-mid)' }}
                >
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  autoFocus
                  className="w-full rounded-lg py-3 pl-10 pr-3 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="vc-btn-primary vc-pulse w-full">
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
              ¿Recordaste tu contraseña?{' '}
              <Link
                href="/login"
                style={{
                  color: 'var(--vc-lime-main)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                }}
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
