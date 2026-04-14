'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  User, Mail, Lock, Phone, Sparkles, ChevronDown,
  Shield, Globe, CheckCircle, Eye, EyeOff, AlertCircle,
} from 'lucide-react'
import { CountryFlag } from '@/components/shared/CountryFlag'

// ── Prefijos telefónicos hispanohablantes ────────────────
// Cualquier persona de habla hispana puede vender con Vitalcom
const PHONE_PREFIXES = [
  { code: 'CO', prefix: '+57', name: 'Colombia', flag: true },
  { code: 'EC', prefix: '+593', name: 'Ecuador', flag: true },
  { code: 'GT', prefix: '+502', name: 'Guatemala', flag: true },
  { code: 'CL', prefix: '+56', name: 'Chile', flag: true },
  { code: 'MX', prefix: '+52', name: 'México', flag: false },
  { code: 'PE', prefix: '+51', name: 'Perú', flag: false },
  { code: 'AR', prefix: '+54', name: 'Argentina', flag: false },
  { code: 'ES', prefix: '+34', name: 'España', flag: false },
  { code: 'VE', prefix: '+58', name: 'Venezuela', flag: false },
  { code: 'DO', prefix: '+1', name: 'Rep. Dominicana', flag: false },
  { code: 'PA', prefix: '+507', name: 'Panamá', flag: false },
  { code: 'CR', prefix: '+506', name: 'Costa Rica', flag: false },
  { code: 'SV', prefix: '+503', name: 'El Salvador', flag: false },
  { code: 'HN', prefix: '+504', name: 'Honduras', flag: false },
  { code: 'NI', prefix: '+505', name: 'Nicaragua', flag: false },
  { code: 'BO', prefix: '+591', name: 'Bolivia', flag: false },
  { code: 'PY', prefix: '+595', name: 'Paraguay', flag: false },
  { code: 'UY', prefix: '+598', name: 'Uruguay', flag: false },
  { code: 'PR', prefix: '+1', name: 'Puerto Rico', flag: false },
  { code: 'CU', prefix: '+53', name: 'Cuba', flag: false },
  { code: 'US', prefix: '+1', name: 'Estados Unidos', flag: false },
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [phonePrefix, setPhonePrefix] = useState('+57')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    country: 'CO',
  })

  function handleChange(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: [] }))
  }

  function handlePrefixChange(prefix: string, code: string) {
    setPhonePrefix(prefix)
    handleChange('country', code)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptTerms) return
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.password,
          whatsapp: form.phone ? `${phonePrefix}${form.phone}` : '',
          acceptTerms: true,
          acceptPrivacy: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors)
        setError(data.error || 'Error al crear la cuenta')
        setLoading(false)
        return
      }

      // Registro exitoso — redirigir a login
      router.push('/login/comunidad?registered=true')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  // Fuerza de la contraseña
  const pwStrength = getPasswordStrength(form.password)

  return (
    <div className="w-full max-w-lg">
      <div className="vc-card" style={{ padding: '2rem 2.5rem' }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(198, 255, 60, 0.1)',
              border: '1px solid rgba(198, 255, 60, 0.3)',
              boxShadow: '0 0 30px rgba(198, 255, 60, 0.08)',
            }}
          >
            <Sparkles size={28} color="var(--vc-lime-main)" />
          </div>
          <h1
            className="vc-text-gradient mb-2 text-2xl font-black"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ÚNETE A VITALCOM
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
            Más de <strong style={{ color: 'var(--vc-lime-main)' }}>1.500 emprendedores</strong> en
            4 países ya hacen parte de la comunidad
          </p>
        </div>

        {/* Badges de confianza */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Shield, text: 'Registro seguro' },
            { icon: Globe, text: 'Desde cualquier país' },
            { icon: CheckCircle, text: '100% gratis' },
          ].map((b) => (
            <span
              key={b.text}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: 'rgba(198, 255, 60, 0.05)',
                border: '1px solid rgba(198, 255, 60, 0.12)',
                color: 'var(--vc-lime-main)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <b.icon size={12} />
              {b.text}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg p-3"
              style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
              <AlertCircle size={16} style={{ color: 'var(--vc-error)', flexShrink: 0 }} />
              <p className="text-xs font-medium" style={{ color: 'var(--vc-error)' }}>{error}</p>
            </div>
          )}

          {/* Nombre */}
          <Field
            icon={<User size={16} />}
            label="Nombre completo"
            type="text"
            placeholder="Tu nombre y apellido"
            value={form.name}
            onChange={(v) => handleChange('name', v)}
          />

          {/* Email */}
          <Field
            icon={<Mail size={16} />}
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={form.email}
            onChange={(v) => handleChange('email', v)}
          />

          {/* WhatsApp con selector de país */}
          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}
            >
              WhatsApp
            </label>
            <div className="flex gap-2">
              {/* Selector de prefijo */}
              <div className="relative shrink-0">
                <select
                  value={phonePrefix}
                  onChange={(e) => {
                    const selected = PHONE_PREFIXES.find((p) => p.prefix === e.target.value)
                    if (selected) handlePrefixChange(selected.prefix, selected.code)
                  }}
                  className="h-full w-[130px] appearance-none rounded-lg py-3 pl-3 pr-8 text-sm font-bold outline-none"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-lime-main)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {PHONE_PREFIXES.map((p) => (
                    <option key={`${p.code}-${p.prefix}`} value={p.prefix}>
                      {p.prefix} {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--vc-gray-mid)' }}
                />
              </div>

              {/* Número */}
              <div className="relative flex-1">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--vc-gray-mid)' }}
                >
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="300 000 0000"
                  required
                  className="w-full rounded-lg py-3 pl-10 pr-3 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
            </div>
            <p className="mt-1.5 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
              Usamos WhatsApp para notificaciones de pedidos y soporte directo
            </p>
          </div>

          {/* Contraseña con toggle y medidor de fuerza */}
          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}
            >
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                className="w-full rounded-lg py-3 pl-10 pr-11 text-sm outline-none transition-all"
                style={{
                  background: 'var(--vc-black-soft)',
                  border: '1px solid var(--vc-gray-dark)',
                  color: 'var(--vc-white-soft)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--vc-gray-mid)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Medidor de fuerza */}
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: pwStrength.level >= level
                          ? pwStrength.color
                          : 'var(--vc-gray-dark)',
                      }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px]" style={{ color: pwStrength.color }}>
                  {pwStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Términos y privacidad */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="sr-only"
              />
              <div
                className="flex h-5 w-5 items-center justify-center rounded-md transition-all"
                style={{
                  background: acceptTerms ? 'var(--vc-lime-main)' : 'var(--vc-black-soft)',
                  border: acceptTerms ? 'none' : '1px solid var(--vc-gray-dark)',
                }}
              >
                {acceptTerms && <CheckCircle size={14} color="var(--vc-black)" />}
              </div>
            </div>
            <span className="text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
              Acepto los{' '}
              <Link href="/terminos" className="underline" style={{ color: 'var(--vc-lime-main)' }}>
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link href="/politica-privacidad" className="underline" style={{ color: 'var(--vc-lime-main)' }}>
                Política de Privacidad
              </Link>.
              Mis datos se protegen bajo la legislación de mi país de residencia.
            </span>
          </label>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading || !acceptTerms}
            className="vc-btn-primary w-full py-3.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              boxShadow: acceptTerms
                ? '0 0 24px var(--vc-glow-lime), 0 4px 16px rgba(168,255,0,0.25)'
                : 'none',
            }}
          >
            {loading ? 'Creando tu cuenta...' : 'Crear mi cuenta gratis'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login/comunidad"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
            >
              Inicia sesión
            </Link>
          </p>
        </div>

        {/* Países activos */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {(['CO', 'EC', 'GT', 'CL'] as const).map((code) => (
            <CountryFlag key={code} country={code} size={20} />
          ))}
          <span className="ml-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
            + 17 países hispanohablantes
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Campo reutilizable ──────────────────────────────────

function Field({ icon, label, type, placeholder, value, onChange }: {
  icon: React.ReactNode; label: string; type: string; placeholder: string; value: string; onChange: (v: string) => void
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
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full rounded-lg py-3 pl-10 pr-3 text-sm outline-none transition-all focus:border-[--vc-lime-main]"
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

// ── Medidor de fuerza de contraseña ─────────────────────

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: '', color: 'var(--vc-gray-dark)' }

  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { level: 1, label: 'Débil — agrega mayúsculas y números', color: 'var(--vc-error)' }
  if (score === 2) return { level: 2, label: 'Regular — agrega un carácter especial', color: 'var(--vc-warning)' }
  if (score === 3) return { level: 3, label: 'Buena — casi perfecta', color: 'var(--vc-info)' }
  return { level: 4, label: 'Excelente', color: 'var(--vc-lime-main)' }
}
