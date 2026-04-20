'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Mail, Lock, Eye, EyeOff, Users, AlertCircle } from 'lucide-react'

// Login para miembros de la comunidad Vitalcom (1500+ VITALCOMMERS)
export default function LoginComunidadPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Redirigir a feed de comunidad
    router.push('/feed')
    router.refresh()
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
            <Users size={24} color="var(--vc-lime-main)" />
          </div>
          <h1
            className="mb-1 text-2xl font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Comunidad Vitalcom
          </h1>
          <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            Entra a tu mundo de bienestar y emprendimiento
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg p-3"
              style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
              <AlertCircle size={16} style={{ color: 'var(--vc-error)', flexShrink: 0 }} />
              <p className="text-xs font-medium" style={{ color: 'var(--vc-error)' }}>{error}</p>
            </div>
          )}

          <Field
            icon={<Mail size={16} />}
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={setEmail}
          />

          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider"
              style={{
                color: 'var(--vc-white-dim)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Contraseña
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--vc-gray-mid)' }}
              >
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg py-3 pl-10 pr-10 text-sm outline-none transition-all"
                style={{
                  background: 'var(--vc-black-soft)',
                  border: '1px solid var(--vc-gray-dark)',
                  color: 'var(--vc-white-soft)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--vc-gray-mid)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label
              className="flex items-center gap-2"
              style={{ color: 'var(--vc-white-dim)' }}
            >
              <input type="checkbox" className="accent-[--vc-lime-main]" />
              Recordarme
            </label>
            <Link
              href="/forgot-password"
              style={{
                color: 'var(--vc-lime-main)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="vc-btn-primary vc-pulse w-full"
          >
            {loading ? 'Entrando...' : 'Entrar a la comunidad'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'var(--vc-gray-dark)' }} />
          <span className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
            o
          </span>
          <div className="h-px flex-1" style={{ background: 'var(--vc-gray-dark)' }} />
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
          ¿Aún no eres miembro?{' '}
          <Link
            href="/register"
            style={{
              color: 'var(--vc-lime-main)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
            }}
          >
            Únete a Vitalcom
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
        ¿Eres parte del equipo Vitalcom?{' '}
        <Link href="/login/equipo" style={{ color: 'var(--vc-lime-main)' }}>
          Acceso staff →
        </Link>
      </p>
    </div>
  )
}

// Campo de input con icono — reutilizable dentro del módulo auth
function Field({
  icon,
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label
        className="mb-2 block text-xs font-semibold uppercase tracking-wider"
        style={{
          color: 'var(--vc-white-dim)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--vc-gray-mid)' }}
        >
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
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
  )
}
