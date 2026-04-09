'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Crown,
  ShoppingCart,
  Truck,
  Megaphone,
  Headphones,
  DollarSign,
  Briefcase,
  Package,
  HeartHandshake,
} from 'lucide-react'

// Login para el equipo Vitalcom (CEO + 8 áreas)
// El CEO usa el rol SUPERADMIN; cada empleado entra y su área se infiere del backend.
// Para UX clara mostramos las áreas como referencia visual.
const AREAS = [
  { key: 'DIRECCION', label: 'Dirección', icon: Crown, ceo: true },
  { key: 'VENTAS', label: 'Ventas', icon: ShoppingCart },
  { key: 'LOGISTICA', label: 'Logística', icon: Truck },
  { key: 'MARKETING', label: 'Marketing', icon: Megaphone },
  { key: 'SOPORTE', label: 'Soporte', icon: Headphones },
  { key: 'FINANZAS', label: 'Finanzas', icon: DollarSign },
  { key: 'PRODUCTO', label: 'Producto', icon: Package },
  { key: 'COMUNIDAD', label: 'Comunidad', icon: HeartHandshake },
]

export default function LoginEquipoPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [area, setArea] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Stub: redirige al panel admin sin validar (mockup)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push('/admin'), 600)
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
      {/* Columna izquierda: selector de áreas (decorativo + UX) */}
      <div className="vc-card flex flex-col" style={{ padding: '2rem' }}>
        <div className="mb-5">
          <p
            className="mb-2 text-xs uppercase tracking-[0.25em]"
            style={{
              color: 'var(--vc-lime-main)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Equipo Vitalcom · 🇨🇴 Colombia
          </p>
          <h2
            className="text-xl font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            ¿De qué área eres?
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
            Selecciona tu área para personalizar tu acceso. El CEO entra como{' '}
            <span style={{ color: 'var(--vc-lime-main)' }}>SUPERADMIN</span>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {AREAS.map((a) => {
            const Icon = a.icon
            const active = area === a.key
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => setArea(a.key)}
                className="group flex items-center gap-2 rounded-lg p-3 text-left transition-all"
                style={{
                  background: active
                    ? 'rgba(198, 255, 60, 0.12)'
                    : 'var(--vc-black-soft)',
                  border: active
                    ? '1px solid var(--vc-lime-main)'
                    : '1px solid var(--vc-gray-dark)',
                  boxShadow: active ? '0 0 16px var(--vc-glow-lime)' : 'none',
                }}
              >
                <Icon
                  size={16}
                  color={active ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)'}
                />
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: active ? 'var(--vc-white-soft)' : 'var(--vc-white-dim)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {a.label}
                </span>
                {a.ceo && (
                  <span
                    className="ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold"
                    style={{
                      background: 'var(--vc-lime-main)',
                      color: 'var(--vc-black)',
                    }}
                  >
                    CEO
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p
          className="mt-5 text-[11px] leading-relaxed"
          style={{ color: 'var(--vc-gray-mid)' }}
        >
          Cada área accede a sus módulos asignados: catálogo, stock, pedidos,
          inbox interno, finanzas y analíticas — según tus permisos.
        </p>
      </div>

      {/* Columna derecha: formulario */}
      <div className="vc-card" style={{ padding: '2.5rem' }}>
        <div className="mb-6 flex items-center gap-3">
          <div
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(198, 255, 60, 0.12)',
              border: '1px solid rgba(198, 255, 60, 0.3)',
            }}
          >
            <Building2 size={22} color="var(--vc-lime-main)" />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Acceso Staff Vitalcom
            </h1>
            <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
              Panel administrativo y operativo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wider"
              style={{
                color: 'var(--vc-white-dim)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Correo corporativo
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
                placeholder="nombre@vitalcom.co"
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

          {area && (
            <div
              className="rounded-lg px-3 py-2 text-xs"
              style={{
                background: 'rgba(198, 255, 60, 0.08)',
                border: '1px solid rgba(198, 255, 60, 0.25)',
                color: 'var(--vc-white-soft)',
              }}
            >
              Entrarás con permisos del área{' '}
              <strong style={{ color: 'var(--vc-lime-main)' }}>{area}</strong>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="vc-btn-primary vc-pulse w-full"
          >
            {loading ? 'Validando...' : 'Acceder al panel'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
          ¿Eres miembro de la comunidad?{' '}
          <Link href="/login/comunidad" style={{ color: 'var(--vc-lime-main)' }}>
            Acceso comunidad →
          </Link>
        </p>
      </div>
    </div>
  )
}
