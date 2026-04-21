'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Phone, Plus, Loader2, CheckCircle2, AlertTriangle, Copy,
  MessageSquare, Users, Workflow as WorkflowIcon,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useWhatsappAccounts, useCreateWhatsappAccount } from '@/hooks/useWaWorkflows'

const QUALITY_COLOR: Record<string, string> = {
  GREEN: '#C6FF3C',
  YELLOW: '#FFB800',
  RED: '#FF4757',
  UNKNOWN: '#8B9BA8',
}

export default function AdminWhatsappPage() {
  const accountsQ = useWhatsappAccounts()
  const createM = useCreateWhatsappAccount()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phoneNumberId: '',
    wabaId: '',
    displayPhone: '',
    accessToken: '',
    businessName: '',
  })

  const accounts = accountsQ.data?.items ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phoneNumberId || !form.wabaId || !form.displayPhone || !form.accessToken) return
    await createM.mutateAsync(form)
    setShowForm(false)
    setForm({ name: '', phoneNumberId: '', wabaId: '', displayPhone: '', accessToken: '', businessName: '' })
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title="Cuentas WhatsApp" subtitle="Multi-tienda · Meta Cloud API" />

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[var(--vc-white-dim)]">
            {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} conectada{accounts.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] hover:bg-[var(--vc-lime-electric)]"
          >
            <Plus className="h-3 w-3" />
            {showForm ? 'Cancelar' : 'Conectar cuenta'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-5 rounded-xl border border-[var(--vc-lime-main)]/30 bg-[var(--vc-black-mid)] p-4"
          >
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-lime-main)]">
              Nueva cuenta WhatsApp Business
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Nombre interno" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Caramela Beauty" required />
              <Field label="Nombre del negocio" value={form.businessName} onChange={v => setForm({ ...form, businessName: v })} placeholder="Caramela Beauty LLC" />
              <Field label="Teléfono visible" value={form.displayPhone} onChange={v => setForm({ ...form, displayPhone: v })} placeholder="+57 300 123 4567" required />
              <Field label="Phone Number ID (Meta)" value={form.phoneNumberId} onChange={v => setForm({ ...form, phoneNumberId: v })} placeholder="109361..." required />
              <Field label="WABA ID" value={form.wabaId} onChange={v => setForm({ ...form, wabaId: v })} placeholder="312459..." required />
              <Field label="Access Token" value={form.accessToken} onChange={v => setForm({ ...form, accessToken: v })} placeholder="EAA..." required type="password" />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={createM.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] hover:bg-[var(--vc-lime-electric)] disabled:opacity-40"
              >
                {createM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Conectar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {accountsQ.isLoading && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              Cargando…
            </div>
          )}

          {!accountsQ.isLoading && accounts.length === 0 && !showForm && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-8 text-center">
              <Phone className="mx-auto mb-3 h-12 w-12 text-[var(--vc-gray-mid)]" />
              <div className="mb-2 text-sm font-semibold text-[var(--vc-white-soft)]">
                Sin cuentas conectadas
              </div>
              <div className="text-xs text-[var(--vc-white-dim)]">
                Conecta tu primera cuenta WhatsApp Business para empezar a automatizar.
              </div>
            </div>
          )}

          {accounts.map(a => {
            const webhookUrl = typeof window !== 'undefined'
              ? `${window.location.origin}/api/webhooks/whatsapp`
              : '/api/webhooks/whatsapp'

            return (
              <div key={a.id} className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--vc-lime-main)]/10">
                      <Phone className="h-5 w-5 text-[var(--vc-lime-main)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--vc-white-soft)]">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-[var(--vc-white-dim)]">
                        {a.displayPhone} · {a.businessName ?? 'Sin branding'}
                      </div>
                    </div>
                  </div>
                  {a.quality && (
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: `${QUALITY_COLOR[a.quality]}20`,
                        color: QUALITY_COLOR[a.quality],
                      }}
                    >
                      {a.quality}
                    </span>
                  )}
                </div>

                <div className="mb-3 grid grid-cols-4 gap-2 border-t border-[var(--vc-gray-dark)] pt-3 text-center">
                  <Metric Icon={WorkflowIcon} label="Workflows" value={a.workflowsCount} />
                  <Metric Icon={Users} label="Contactos" value={a.contactsCount} />
                  <Metric Icon={MessageSquare} label="Chats" value={a.conversationsCount} />
                  <Metric label="Templates" value={a.templatesCount} />
                </div>

                <div className="rounded-lg border border-[var(--vc-info)]/20 bg-[var(--vc-info)]/5 p-2.5">
                  <div className="mb-1 text-[9px] font-bold uppercase text-[var(--vc-info)]">
                    Setup webhook en Meta
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <KVRow label="Webhook URL" value={webhookUrl} onCopy={() => copy(webhookUrl)} />
                    <KVRow label="Verify Token" value={a.webhookVerifyToken} onCopy={() => copy(a.webhookVerifyToken)} />
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/admin/workflows`}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--vc-lime-main)]/40 bg-[var(--vc-lime-main)]/10 px-2 py-1 text-[11px] font-semibold text-[var(--vc-lime-main)]"
                  >
                    <WorkflowIcon className="h-3 w-3" />
                    Ver workflows
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-lg border border-[var(--vc-warning)]/20 bg-[var(--vc-warning)]/5 p-3 text-xs text-[var(--vc-white-dim)]">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--vc-warning)]">
            <AlertTriangle className="h-3 w-3" />
            Blocker pendiente
          </div>
          Para conectar una cuenta necesitas credenciales de Meta Business App + WABA verificado.
          Sin ellas, el sistema opera en modo mock. Avísale al CEO que cree la app en Meta Developers y la
          someta a review de permissions messaging.
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, required, type }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  required?: boolean
  type?: string
}) {
  return (
    <label className="block">
      <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
        {label} {required && <span className="text-[var(--vc-error)]">*</span>}
      </div>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1.5 text-xs text-[var(--vc-white-soft)] placeholder-[var(--vc-gray-mid)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
      />
    </label>
  )
}

function Metric({ Icon, label, value }: { Icon?: typeof Phone; label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {label}
      </div>
      <div className="text-lg font-bold text-[var(--vc-white-soft)]">{value}</div>
    </div>
  )
}

function KVRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex-shrink-0 text-[var(--vc-gray-mid)]">{label}:</span>
      <code className="flex-1 min-w-0 truncate font-mono text-[var(--vc-white-dim)]">{value}</code>
      <button
        onClick={onCopy}
        className="flex-shrink-0 rounded p-1 text-[var(--vc-white-dim)] hover:bg-[var(--vc-black-soft)] hover:text-[var(--vc-lime-main)]"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  )
}
