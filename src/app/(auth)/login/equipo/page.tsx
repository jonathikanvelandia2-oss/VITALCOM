'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import {
  Mail, Lock, Eye, EyeOff, Building2, Crown, Megaphone,
  ShoppingCart, FileText, Truck, Calculator, ArrowRight,
  Shield, Users, AlertCircle,
} from 'lucide-react'

// ── Login Staff Vitalcom ─────────────────────────────────
// CEO (SUPERADMIN) + 5 áreas operativas reales.
// El área seleccionada determina la vista inicial tras login.

const AREAS = [
  {
    key: 'DIRECCION',
    label: 'CEO / Dirección',
    icon: Crown,
    ceo: true,
    description: 'Visión 360° de toda la operación',
    color: 'var(--vc-lime-main)',
    modules: ['Dashboard global', 'Todas las áreas', 'Agentes IA'],
  },
  {
    key: 'MARKETING',
    label: 'Marketing',
    icon: Megaphone,
    description: 'Campañas, contenido y comunidad',
    color: 'var(--vc-info)',
    modules: ['Campañas', 'Contenido', 'Comunidad', 'Analítica'],
  },
  {
    key: 'COMERCIAL',
    label: 'Comercial',
    icon: ShoppingCart,
    description: 'Ventas, clientes y catálogo',
    color: '#a855f7',
    modules: ['Pedidos', 'Clientes CRM', 'Catálogo', 'Cotizaciones'],
  },
  {
    key: 'ADMINISTRATIVA',
    label: 'Administrativa',
    icon: FileText,
    description: 'Operaciones, RRHH y procesos',
    color: 'var(--vc-warning)',
    modules: ['Procesos', 'RRHH', 'Documentos', 'Proveedores'],
  },
  {
    key: 'LOGISTICA',
    label: 'Logística y Despacho',
    icon: Truck,
    description: 'Stock, envíos y fulfillment Dropi',
    color: 'var(--vc-lime-electric)',
    modules: ['Stock', 'Despachos', 'Dropi', 'Devoluciones'],
  },
  {
    key: 'CONTABILIDAD',
    label: 'Contabilidad',
    icon: Calculator,
    description: 'Finanzas, facturación y liquidaciones',
    color: 'var(--vc-lime-deep)',
    modules: ['Finanzas', 'Facturación', 'Liquidaciones', 'Reportes'],
  },
]

export default function LoginEquipoPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [area, setArea] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedArea = AREAS.find(a => a.key === area)

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
      setError('Credenciales incorrectas o no tienes acceso de staff')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
      {/* Columna izquierda: áreas de Vitalcom */}
      <div className="vc-card flex flex-col" style={{ padding: '2rem' }}>
        <div className="mb-5">
          <p className="mb-2 text-xs uppercase tracking-[0.25em]"
            style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
            Equipo Vitalcom
          </p>
          <h2 className="text-xl font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Selecciona tu área
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
            Tu área determina tu vista inicial y accesos en el panel.
          </p>
        </div>

        <div className="space-y-2">
          {AREAS.map((a) => {
            const Icon = a.icon
            const active = area === a.key
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => setArea(a.key)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all"
                style={{
                  background: active ? `${a.color}15` : 'var(--vc-black-soft)',
                  border: active ? `1px solid ${a.color}` : '1px solid var(--vc-gray-dark)',
                  boxShadow: active ? `0 0 16px ${a.color}40` : 'none',
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: active ? `${a.color}20` : 'var(--vc-black-mid)', border: `1px solid ${active ? a.color : 'var(--vc-gray-dark)'}` }}>
                  <Icon size={18} style={{ color: active ? a.color : 'var(--vc-gray-mid)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold"
                      style={{ color: active ? 'var(--vc-white-soft)' : 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
                      {a.label}
                    </span>
                    {a.ceo && (
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: 'var(--vc-lime-main)', color: 'var(--vc-black)' }}>
                        SUPERADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>{a.description}</p>
                </div>
                {active && <ArrowRight size={14} style={{ color: a.color }} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Columna derecha: formulario */}
      <div className="vc-card flex flex-col" style={{ padding: '2.5rem' }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'rgba(198,255,60,0.12)', border: '1px solid rgba(198,255,60,0.3)' }}>
            <Building2 size={22} color="var(--vc-lime-main)" />
          </div>
          <div>
            <h1 className="text-xl font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Acceso Staff
            </h1>
            <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
              Panel administrativo Vitalcom
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg p-3"
              style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
              <AlertCircle size={16} style={{ color: 'var(--vc-error)', flexShrink: 0 }} />
              <p className="text-xs font-medium" style={{ color: 'var(--vc-error)' }}>{error}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
              Correo corporativo
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@vitalcom.co" required
                className="w-full rounded-lg py-3 pl-10 pr-3 text-sm outline-none"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}>
              Contraseña
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full rounded-lg py-3 pl-10 pr-10 text-sm outline-none"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }} />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Info del área seleccionada */}
          {selectedArea && (
            <div className="rounded-lg p-3"
              style={{ background: `${selectedArea.color}10`, border: `1px solid ${selectedArea.color}40` }}>
              <div className="mb-2 flex items-center gap-2">
                <selectedArea.icon size={14} style={{ color: selectedArea.color }} />
                <span className="text-xs font-bold" style={{ color: 'var(--vc-white-soft)' }}>
                  {selectedArea.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedArea.modules.map(m => (
                  <span key={m} className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                    style={{ background: `${selectedArea.color}15`, color: selectedArea.color }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="vc-btn-primary vc-pulse w-full">
            {loading ? 'Validando...' : 'Acceder al panel'}
          </button>
        </form>

        {/* Info de seguridad */}
        <div className="mt-5 flex items-center gap-2 rounded-lg p-2"
          style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
          <Shield size={14} style={{ color: 'var(--vc-gray-mid)' }} />
          <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
            Conexión segura · Sesión cifrada · Acceso auditado
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <Link href="/login/comunidad" style={{ color: 'var(--vc-lime-main)' }}>
            Acceso comunidad →
          </Link>
          <span className="flex items-center gap-1" style={{ color: 'var(--vc-gray-mid)' }}>
            <Users size={11} /> 1.547 VITALCOMMERS activos
          </span>
        </div>
      </div>
    </div>
  )
}
