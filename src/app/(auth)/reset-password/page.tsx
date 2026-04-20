'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'

// ── /reset-password?token=XXX ──────────────────────────
// Página que valida token y permite crear nueva contraseña.

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('Enlace inválido. Solicita uno nuevo.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password, confirmPassword: confirm }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json.ok) {
        if (json?.fieldErrors) setFieldErrors(json.fieldErrors)
        setError(json?.error || 'No pudimos restablecer tu contraseña.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/login'), 2500)
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
            Nueva contraseña
          </h1>
          <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            Mínimo 8 caracteres, con mayúscula, minúscula y número.
          </p>
        </div>

        {success ? (
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
                  ¡Listo!
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                  Tu contraseña fue actualizada. Te redirigimos al inicio de sesión...
                </p>
              </div>
            </div>
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

            <PasswordField
              label="Nueva contraseña"
              value={password}
              onChange={setPassword}
              show={showPassword}
              toggleShow={() => setShowPassword((s) => !s)}
              errors={fieldErrors.newPassword}
            />

            <PasswordField
              label="Confirmar contraseña"
              value={confirm}
              onChange={setConfirm}
              show={showPassword}
              toggleShow={() => setShowPassword((s) => !s)}
              errors={fieldErrors.confirmPassword}
            />

            <button type="submit" disabled={loading || !token} className="vc-btn-primary vc-pulse w-full">
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
              <Link
                href="/login"
                style={{
                  color: 'var(--vc-lime-main)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                }}
              >
                ← Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggleShow,
  errors,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  toggleShow: () => void
  errors?: string[]
}) {
  return (
    <div>
      <label
        className="mb-2 block text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }}>
          <Lock size={16} />
        </span>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full rounded-lg py-3 pl-10 pr-10 text-sm outline-none transition-all"
          style={{
            background: 'var(--vc-black-soft)',
            border: `1px solid ${errors?.length ? 'rgba(255,71,87,0.4)' : 'var(--vc-gray-dark)'}`,
            color: 'var(--vc-white-soft)',
            fontFamily: 'var(--font-body)',
          }}
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--vc-gray-mid)' }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {errors?.map((err, i) => (
        <p key={i} className="mt-1 text-xs" style={{ color: 'var(--vc-error)' }}>
          {err}
        </p>
      ))}
    </div>
  )
}
