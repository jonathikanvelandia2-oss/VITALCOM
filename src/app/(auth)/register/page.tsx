'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { User, Mail, Lock, Phone, Sparkles } from 'lucide-react'

// Registro abierto solo a comunidad. El staff es onboarded internamente por RR.HH.
export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  function handleChange(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push('/feed'), 700)
  }

  return (
    <div className="w-full max-w-md">
      <div className="vc-card" style={{ padding: '2.5rem' }}>
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(198, 255, 60, 0.12)',
              border: '1px solid rgba(198, 255, 60, 0.3)',
            }}
          >
            <Sparkles size={24} color="var(--vc-lime-main)" />
          </div>
          <h1
            className="vc-text-gradient mb-1 text-2xl font-bold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ÚNETE A VITALCOM
          </h1>
          <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            Más de 1.500 emprendedores ya forman parte de la comunidad
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            icon={<User size={16} />}
            label="Nombre completo"
            type="text"
            placeholder="Tu nombre"
            value={form.name}
            onChange={(v) => handleChange('name', v)}
          />
          <Field
            icon={<Mail size={16} />}
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={form.email}
            onChange={(v) => handleChange('email', v)}
          />
          <Field
            icon={<Phone size={16} />}
            label="WhatsApp (Colombia)"
            type="tel"
            placeholder="+57 300 000 0000"
            value={form.phone}
            onChange={(v) => handleChange('phone', v)}
          />
          <Field
            icon={<Lock size={16} />}
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(v) => handleChange('password', v)}
          />

          <p
            className="text-[11px] leading-relaxed"
            style={{ color: 'var(--vc-gray-mid)' }}
          >
            Al registrarte aceptas los Términos de Vitalcom y nuestra Política de
            Privacidad. Tus datos quedan bajo la regulación 🇨🇴 colombiana.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="vc-btn-primary vc-pulse w-full"
          >
            {loading ? 'Creando tu cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: 'var(--vc-white-dim)' }}
        >
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login/comunidad"
            style={{
              color: 'var(--vc-lime-main)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
            }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

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
