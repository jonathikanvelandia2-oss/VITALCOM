'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Settings, Globe, Bell, Users, Shield, Palette, Loader2, Check,
  User as UserIcon, Lock, Plug, Mail,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// ── Ajustes del panel admin ─────────────────────────────
// Tres secciones funcionales:
// 1) Perfil — PATCH /api/users/me
// 2) Seguridad — POST /api/users/me/password
// 3) Integraciones — tarjetas informativas con enlaces

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

type ProfileData = {
  id: string
  email: string
  name: string | null
  role: string
  area: string | null
  country: string | null
  avatar: string | null
  phone: string | null
  whatsapp: string | null
  bio: string | null
}

const INTEGRATIONS = [
  {
    name: 'Shopify',
    desc: 'OAuth + webhooks + sync de productos y pedidos',
    envKeys: ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET'],
    href: '/admin/catalogo',
  },
  {
    name: 'Dropi',
    desc: 'Fulfillment multi-país con webhook HMAC',
    envKeys: ['DROPI_API_KEY', 'DROPI_WEBHOOK_SECRET'],
    href: '/admin/pedidos',
  },
  {
    name: 'Resend',
    desc: 'Emails transaccionales (confirmaciones, estado, reset)',
    envKeys: ['RESEND_API_KEY', 'EMAIL_FROM'],
    href: null,
  },
  {
    name: 'OpenAI',
    desc: 'Asesor CEO, VITA asistente, generador de marketing',
    envKeys: ['OPENAI_API_KEY'],
    href: '/admin/asistente',
  },
  {
    name: 'Supabase',
    desc: 'BD PostgreSQL + Storage + Realtime (futuro)',
    envKeys: ['DATABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    href: null,
  },
  {
    name: 'Cloudinary',
    desc: 'Hosting de imágenes de producto y avatares',
    envKeys: ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'],
    href: '/admin/catalogo',
  },
]

export default function AjustesPage() {
  const [tab, setTab] = useState<'perfil' | 'seguridad' | 'integraciones' | 'info'>('perfil')

  return (
    <>
      <AdminTopbar title="Ajustes" subtitle="Perfil, seguridad e integraciones" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Tabs */}
          <div
            className="flex gap-1 overflow-x-auto rounded-lg p-1"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
          >
            {(
              [
                { key: 'perfil', label: 'Perfil', icon: UserIcon },
                { key: 'seguridad', label: 'Seguridad', icon: Lock },
                { key: 'integraciones', label: 'Integraciones', icon: Plug },
                { key: 'info', label: 'Información', icon: Settings },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all"
                style={{
                  background: tab === t.key ? 'var(--vc-black-mid)' : 'transparent',
                  color: tab === t.key ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                  border: tab === t.key ? '1px solid rgba(198,255,60,0.25)' : '1px solid transparent',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'perfil' && <ProfileSection />}
          {tab === 'seguridad' && <SecuritySection />}
          {tab === 'integraciones' && <IntegrationsSection />}
          {tab === 'info' && <InfoSection />}
        </div>
      </div>
    </>
  )
}

// ── Perfil ─────────────────────────────────────────────
function ProfileSection() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [form, setForm] = useState({ name: '', bio: '', avatar: '', phone: '', whatsapp: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJson('/api/users/me')
      .then((data) => {
        setProfile(data)
        setForm({
          name: data.name ?? '',
          bio: data.bio ?? '',
          avatar: data.avatar ?? '',
          phone: data.phone ?? '',
          whatsapp: data.whatsapp ?? '',
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await fetchJson('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || undefined,
          bio: form.bio || undefined,
          avatar: form.avatar || undefined,
          phone: form.phone || undefined,
          whatsapp: form.whatsapp || undefined,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SectionLoader />

  const inputStyle = {
    background: 'var(--vc-black-soft)',
    border: '1px solid var(--vc-gray-dark)',
    color: 'var(--vc-white-soft)',
  }

  return (
    <form onSubmit={handleSave} className="vc-card space-y-4 p-6">
      <div>
        <h3
          className="text-sm font-bold"
          style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
        >
          Mi perfil
        </h3>
        <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
          Información visible para tu equipo y la comunidad
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ReadonlyField label="Email" value={profile?.email ?? ''} />
        <ReadonlyField label="Rol" value={profile?.role ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ReadonlyField label="Área" value={profile?.area ?? '—'} />
        <ReadonlyField label="País" value={profile?.country ?? '—'} />
      </div>

      <div>
        <Label>Nombre</Label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <Label>Bio corta</Label>
        <textarea
          rows={3}
          maxLength={500}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <Label>Avatar URL</Label>
          <input
            type="url"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label>Teléfono</Label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
            placeholder="+57 300..."
          />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
            placeholder="+57 300..."
          />
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--vc-error)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="vc-btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Guardar cambios
        </button>
        {saved && (
          <span
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: 'var(--vc-lime-main)' }}
          >
            <Check size={14} /> Guardado
          </span>
        )}
      </div>
    </form>
  )
}

// ── Seguridad ──────────────────────────────────────────
function SecuritySection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.newPassword !== form.confirm) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Mínimo 8 caracteres')
      return
    }
    setSaving(true)
    try {
      await fetchJson('/api/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      setSaved(true)
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--vc-black-soft)',
    border: '1px solid var(--vc-gray-dark)',
    color: 'var(--vc-white-soft)',
  }

  return (
    <form onSubmit={handleSubmit} className="vc-card space-y-4 p-6">
      <div>
        <h3
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
        >
          <Shield size={14} color="var(--vc-lime-main)" /> Cambiar contraseña
        </h3>
        <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
          Necesitas tu contraseña actual para hacer el cambio
        </p>
      </div>

      <div>
        <Label>Contraseña actual</Label>
        <input
          type="password"
          required
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nueva contraseña</Label>
          <input
            type="password"
            required
            minLength={8}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <Label>Confirmar nueva</Label>
          <input
            type="password"
            required
            minLength={8}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--vc-error)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="vc-btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Actualizar contraseña
        </button>
        {saved && (
          <span
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: 'var(--vc-lime-main)' }}
          >
            <Check size={14} /> Contraseña actualizada
          </span>
        )}
      </div>
    </form>
  )
}

// ── Integraciones ──────────────────────────────────────
function IntegrationsSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
        Variables de entorno configuradas en Vercel. Las credenciales se gestionan fuera de la app.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {INTEGRATIONS.map((it) => (
          <div key={it.name} className="vc-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Plug size={14} color="var(--vc-lime-main)" />
              <h4
                className="text-sm font-bold"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
              >
                {it.name}
              </h4>
            </div>
            <p className="mb-3 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
              {it.desc}
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {it.envKeys.map((k) => (
                <code
                  key={k}
                  className="rounded px-2 py-0.5 text-[9px]"
                  style={{
                    background: 'var(--vc-black-soft)',
                    color: 'var(--vc-lime-main)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {k}
                </code>
              ))}
            </div>
            {it.href && (
              <Link
                href={it.href}
                className="text-[11px] font-semibold hover:underline"
                style={{ color: 'var(--vc-lime-main)' }}
              >
                Abrir módulo →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Info estática ─────────────────────────────────────
function InfoSection() {
  const items = [
    { icon: Globe, title: 'Países activos', desc: 'Colombia (principal) · Ecuador · Guatemala · Chile' },
    { icon: Users, title: 'Equipo', desc: 'Gestión de staff por área', href: '/admin/equipo' },
    { icon: Shield, title: 'Auditoría', desc: 'Logs de pedidos, cambios de estado, notificaciones' },
    { icon: Bell, title: 'Notificaciones', desc: 'Bell in-app (30s polling) + emails transaccionales' },
    { icon: Mail, title: 'Plantillas email', desc: 'Confirmación, estado, reset password, bienvenida' },
    { icon: Palette, title: 'Identidad visual', desc: 'Paleta neón lima sobre negro — tokens en globals.css' },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((it) => {
        const card = (
          <div className="vc-card h-full">
            <div
              className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: 'rgba(198, 255, 60, 0.12)', border: '1px solid rgba(198, 255, 60, 0.3)' }}
            >
              <it.icon size={20} color="var(--vc-lime-main)" />
            </div>
            <h3
              className="mb-1 text-base font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              {it.title}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
              {it.desc}
            </p>
          </div>
        )
        return it.href ? (
          <Link key={it.title} href={it.href}>
            {card}
          </Link>
        ) : (
          <div key={it.title}>{card}</div>
        )
      })}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="mb-2 block text-[10px] font-bold uppercase tracking-wider"
      style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-heading)' }}
    >
      {children}
    </label>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        className="rounded-lg px-3 py-2 text-sm"
        style={{
          background: 'var(--vc-black-soft)',
          border: '1px solid var(--vc-gray-dark)',
          color: 'var(--vc-white-dim)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SectionLoader() {
  return (
    <div className="vc-card flex items-center justify-center py-12">
      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
    </div>
  )
}
