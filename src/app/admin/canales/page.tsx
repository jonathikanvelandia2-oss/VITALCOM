'use client'

// V38 — Admin · Gestión de canales Vitalcom con analytics.
// CRUD completo + métricas de clicks últimos 30 días. Preview en vivo.

import { useState } from 'react'
import {
  Plus, Edit2, Trash2, Loader2, ExternalLink, TrendingUp, Clock, Check, X,
  MessageCircle, Users, Megaphone, Hash, AlertCircle,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useAdminChannels, useCreateChannel, useUpdateChannel, useDeleteChannel,
  type ChannelAdmin, type ChannelInput,
} from '@/hooks/useChannels'
import { buildWaMeUrl, isValidE164, isValidWhatsAppInvite } from '@/lib/channels/helpers'

const TYPE_LABEL: Record<string, string> = {
  STAFF_DM: 'Chat 1-a-1 (área)',
  COMMUNITY_GROUP: 'Grupo comunidad',
  BROADCAST_LIST: 'Lista de difusión',
  ANNOUNCEMENTS: 'Canal de anuncios',
}

const TYPE_ICON: Record<string, typeof MessageCircle> = {
  STAFF_DM: MessageCircle,
  COMMUNITY_GROUP: Users,
  BROADCAST_LIST: Megaphone,
  ANNOUNCEMENTS: Hash,
}

const AREA_OPTIONS = ['DIRECCION', 'MARKETING', 'COMERCIAL', 'ADMINISTRATIVA', 'LOGISTICA', 'CONTABILIDAD']

export default function AdminCanalesPage() {
  const q = useAdminChannels()
  const del = useDeleteChannel()
  const [editing, setEditing] = useState<ChannelAdmin | null>(null)
  const [creating, setCreating] = useState(false)

  const channels = q.data?.items ?? []
  const totalClicks = channels.reduce((sum, c) => sum + c.analytics.total, 0)
  const totalLast7 = channels.reduce((sum, c) => sum + c.analytics.last7Days, 0)
  const activeCount = channels.filter((c) => c.active).length

  const handleDelete = (id: string, label: string) => {
    if (!confirm(`Desactivar canal "${label}"? Puedes reactivarlo después editándolo.`)) return
    del.mutate(id)
  }

  return (
    <>
      <AdminTopbar
        title="Canales Vitalcom"
        subtitle={`${channels.length} canales · ${activeCount} activos · ${totalClicks} clicks (30d)`}
      />
      <div className="flex-1 space-y-5 p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total canales" value={channels.length} />
          <StatCard label="Activos" value={activeCount} highlight />
          <StatCard label="Clicks 7d" value={totalLast7} />
          <StatCard label="Clicks 30d" value={totalClicks} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--vc-white-dim)]">
            Canales oficiales que la comunidad verá en <code className="rounded bg-[var(--vc-black-soft)] px-1 py-0.5 text-[10px]">/canales</code>
          </p>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition"
            style={{
              background: 'var(--vc-lime-main)',
              color: 'var(--vc-black)',
              boxShadow: '0 0 16px var(--vc-glow-lime)',
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo canal
          </button>
        </div>

        {q.isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
          </div>
        )}

        {!q.isLoading && channels.length === 0 && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-10 text-center">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[var(--vc-lime-main)]" />
            <p className="text-sm font-bold text-[var(--vc-white-soft)]">Aún no hay canales</p>
            <p className="mt-1 text-xs text-[var(--vc-white-dim)]">Crea el primero para que la comunidad pueda conectarse</p>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {channels.map((c) => (
            <ChannelAdminCard
              key={c.id}
              channel={c}
              onEdit={() => setEditing(c)}
              onDelete={() => handleDelete(c.id, c.label)}
            />
          ))}
        </div>
      </div>

      {(creating || editing) && (
        <ChannelFormModal
          channel={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: `1px solid ${highlight ? 'rgba(198,255,60,0.4)' : 'var(--vc-gray-dark)'}`,
      }}
    >
      <p
        className="text-2xl font-black"
        style={{
          color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">{label}</p>
    </div>
  )
}

function ChannelAdminCard({
  channel,
  onEdit,
  onDelete,
}: {
  channel: ChannelAdmin
  onEdit: () => void
  onDelete: () => void
}) {
  const Icon = TYPE_ICON[channel.type] ?? MessageCircle
  const a = channel.analytics

  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: `1px solid ${channel.active ? 'rgba(198,255,60,0.2)' : 'var(--vc-gray-dark)'}`,
        opacity: channel.active ? 1 : 0.6,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl"
            style={{
              background: 'rgba(198,255,60,0.1)',
              border: '1px solid rgba(198,255,60,0.3)',
            }}
          >
            {channel.icon || <Icon className="h-5 w-5 text-[var(--vc-lime-main)]" />}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--vc-lime-main)]">
              {TYPE_LABEL[channel.type]} {channel.area && `· ${channel.area}`}
            </p>
            <h3
              className="text-sm font-black"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
            >
              {channel.label}
            </h3>
            {channel.description && (
              <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--vc-white-dim)]">{channel.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!channel.active && (
            <span className="rounded-full bg-[var(--vc-black-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--vc-white-dim)]">
              Inactivo
            </span>
          )}
        </div>
      </div>

      {/* Technical details */}
      <div className="space-y-1 rounded-lg bg-[var(--vc-black-soft)] p-2 text-[10px]">
        {channel.phone && (
          <DetailRow label="Teléfono" value={channel.phone} />
        )}
        {channel.inviteUrl && (
          <DetailRow label="Invite" value={channel.inviteUrl} truncate />
        )}
        {channel.country && (
          <DetailRow label="País" value={channel.country} />
        )}
        {channel.order !== 0 && (
          <DetailRow label="Orden" value={String(channel.order)} />
        )}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-3 gap-2">
        <AnalyticsPill icon={<TrendingUp className="h-3 w-3" />} label="Total" value={a.total} />
        <AnalyticsPill icon={<Clock className="h-3 w-3" />} label="7d" value={a.last7Days} highlight />
        <AnalyticsPill icon={<Clock className="h-3 w-3" />} label="30d" value={a.last30Days} />
      </div>

      {/* Actions */}
      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-soft)] transition hover:border-[var(--vc-lime-main)]/40"
        >
          <Edit2 className="h-3 w-3" /> Editar
        </button>
        {channel.active ? (
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)] transition hover:border-[var(--vc-error)]/40 hover:text-[var(--vc-error)]"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        ) : (
          <span className="px-3 py-2 text-[10px] text-[var(--vc-gray-mid)]">—</span>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--vc-gray-mid)]">{label}</span>
      <code
        className={`font-mono text-[var(--vc-white-dim)] ${truncate ? 'truncate' : ''}`}
        style={{ maxWidth: truncate ? '180px' : undefined }}
      >
        {value}
      </code>
    </div>
  )
}

function AnalyticsPill({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className="flex items-center justify-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold"
      style={{
        background: highlight ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
        color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
      }}
    >
      {icon}
      <span>{value}</span>
      <span className="uppercase tracking-wider opacity-70">{label}</span>
    </div>
  )
}

// ─── FORM MODAL ─────────────────────────────────────────
function ChannelFormModal({ channel, onClose }: { channel: ChannelAdmin | null; onClose: () => void }) {
  const isEdit = Boolean(channel)
  const create = useCreateChannel()
  const update = useUpdateChannel()

  const [form, setForm] = useState<ChannelInput>({
    type: channel?.type ?? 'STAFF_DM',
    area: channel?.area ?? null,
    label: channel?.label ?? '',
    description: channel?.description ?? '',
    phone: channel?.phone ?? '',
    inviteUrl: channel?.inviteUrl ?? '',
    defaultMessage: channel?.defaultMessage ?? '',
    icon: channel?.icon ?? '',
    country: channel?.country ?? null,
    active: channel?.active ?? true,
    order: channel?.order ?? 0,
  })

  const requiresPhone = form.type === 'STAFF_DM' || form.type === 'BROADCAST_LIST'
  const requiresInvite = form.type === 'COMMUNITY_GROUP' || form.type === 'ANNOUNCEMENTS'

  const phoneValid = !requiresPhone || (form.phone && isValidE164(form.phone))
  const inviteValid = !requiresInvite || (form.inviteUrl && isValidWhatsAppInvite(form.inviteUrl))
  const labelValid = form.label.trim().length >= 2
  const canSubmit = phoneValid && inviteValid && labelValid

  const previewUrl = requiresPhone
    ? buildWaMeUrl(form.phone ?? null, form.defaultMessage ?? null)
    : form.inviteUrl && isValidWhatsAppInvite(form.inviteUrl)
      ? form.inviteUrl
      : null

  const handleSubmit = () => {
    const payload: ChannelInput = {
      ...form,
      phone: requiresPhone ? form.phone : null,
      inviteUrl: requiresInvite ? form.inviteUrl : null,
      description: form.description || null,
      defaultMessage: form.defaultMessage || null,
      icon: form.icon || null,
    }

    if (isEdit && channel) {
      update.mutate({ id: channel.id, data: payload }, { onSuccess: onClose })
    } else {
      create.mutate(payload, { onSuccess: onClose })
    }
  }

  const busy = create.isPending || update.isPending
  const error = (create.error ?? update.error) as Error | null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-5 lg:p-6"
        style={{
          background: 'var(--vc-black-mid)',
          border: '1px solid rgba(198,255,60,0.25)',
          boxShadow: '0 0 48px rgba(198,255,60,0.1)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--vc-gray-dark)] pb-3">
          <div>
            <h3
              className="text-base font-black"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
            >
              {isEdit ? 'Editar canal' : 'Nuevo canal'}
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--vc-white-dim)]">
              {isEdit ? 'Actualiza teléfono, etiqueta o estado' : 'Visible en /canales al activar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-1.5 text-[var(--vc-white-dim)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tipo de canal">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ChannelInput['type'] })}
              className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)]"
            >
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Área (opcional)">
            <select
              value={form.area ?? ''}
              onChange={(e) => setForm({ ...form, area: e.target.value || null })}
              className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)]"
            >
              <option value="">Sin área</option>
              {AREA_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Field>

          <Field label="Etiqueta *" error={!labelValid && form.label.length > 0 ? 'Mínimo 2 caracteres' : null}>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ej: Soporte Comunidad CO"
              className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)]"
            />
          </Field>

          <Field label="Icono (emoji opcional)">
            <input
              value={form.icon ?? ''}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="🌿"
              maxLength={4}
              className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)]"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Descripción (opcional)">
              <textarea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Ej: Consultas sobre tu tienda, pedidos y facturación"
                className="w-full resize-none rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)]"
              />
            </Field>
          </div>

          {requiresPhone && (
            <>
              <Field label="Teléfono (E.164 sin +) *" error={form.phone && !phoneValid ? 'Formato inválido' : null}>
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="573001234567"
                  className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 font-mono text-xs text-[var(--vc-white-soft)]"
                />
              </Field>

              <Field label="Mensaje pre-cargado">
                <input
                  value={form.defaultMessage ?? ''}
                  onChange={(e) => setForm({ ...form, defaultMessage: e.target.value })}
                  placeholder="Hola, necesito ayuda con..."
                  className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)]"
                />
              </Field>
            </>
          )}

          {requiresInvite && (
            <div className="md:col-span-2">
              <Field
                label="URL de invitación *"
                error={form.inviteUrl && !inviteValid ? 'Debe ser chat.whatsapp.com o whatsapp.com' : null}
              >
                <input
                  value={form.inviteUrl ?? ''}
                  onChange={(e) => setForm({ ...form, inviteUrl: e.target.value })}
                  placeholder="https://chat.whatsapp.com/XYZ123"
                  className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 font-mono text-xs text-[var(--vc-white-soft)]"
                />
              </Field>
            </div>
          )}

          <Field label="País">
            <select
              value={form.country ?? ''}
              onChange={(e) => setForm({ ...form, country: (e.target.value || null) as ChannelInput['country'] })}
              className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 text-xs text-[var(--vc-white-soft)]"
            >
              <option value="">Todos</option>
              <option value="CO">🇨🇴 Colombia</option>
              <option value="EC">🇪🇨 Ecuador</option>
              <option value="GT">🇬🇹 Guatemala</option>
              <option value="CL">🇨🇱 Chile</option>
            </select>
          </Field>

          <Field label="Orden (menor = primero)">
            <input
              type="number"
              value={form.order ?? 0}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              className="w-full rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2 font-mono text-xs text-[var(--vc-white-soft)]"
            />
          </Field>

          <div className="md:col-span-2 flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--vc-white-soft)]">
              <input
                type="checkbox"
                checked={form.active !== false}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-[var(--vc-lime-main)]"
              />
              Canal activo (visible en /canales)
            </label>
          </div>
        </div>

        {/* Preview URL */}
        {previewUrl && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/5 p-3 text-[11px]">
            <Check className="h-3.5 w-3.5 flex-shrink-0 text-[var(--vc-lime-main)]" />
            <span className="flex-1 truncate text-[var(--vc-white-dim)]">
              Preview: <code className="font-mono text-[var(--vc-lime-main)]">{previewUrl}</code>
            </span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--vc-lime-main)] p-1 text-[var(--vc-black)]"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/5 p-3 text-[11px] text-[var(--vc-error)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error.message}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || busy}
          className="mt-4 w-full rounded-lg px-4 py-3 text-xs font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--vc-lime-main)',
            color: 'var(--vc-black)',
            boxShadow: canSubmit && !busy ? '0 0 20px var(--vc-glow-lime)' : undefined,
          }}
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Guardando…
            </span>
          ) : isEdit ? (
            'Actualizar canal'
          ) : (
            'Crear canal'
          )}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[10px] text-[var(--vc-error)]">{error}</p>}
    </div>
  )
}
