'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Megaphone, Plus, Loader2, Play, Users, CheckCircle2, XCircle, Clock,
  AlertTriangle, ChevronRight, Eye,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useBroadcasts, useCreateBroadcast, useExecuteBroadcast, usePreviewBroadcast,
  useWaTemplates,
  type BroadcastStatus,
} from '@/hooks/useWaTemplates'
import { useWhatsappAccounts } from '@/hooks/useWaWorkflows'

const STATUS_META: Record<BroadcastStatus, { label: string; color: string; Icon: typeof Clock }> = {
  DRAFT:     { label: 'Draft',      color: '#8B9BA8', Icon: Clock },
  SCHEDULED: { label: 'Agendado',   color: '#3CC6FF', Icon: Clock },
  RUNNING:   { label: 'Enviando',   color: '#FFB800', Icon: Loader2 },
  COMPLETED: { label: 'Completado', color: '#C6FF3C', Icon: CheckCircle2 },
  FAILED:    { label: 'Falló',      color: '#FF4757', Icon: XCircle },
  CANCELLED: { label: 'Cancelado',  color: '#8B9BA8', Icon: XCircle },
}

export default function BroadcastsPage() {
  const accountsQ = useWhatsappAccounts()
  const accounts = accountsQ.data?.items ?? []
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const firstAccountId = accounts[0]?.id
  useEffect(() => {
    if (!selectedAccount && firstAccountId) setSelectedAccount(firstAccountId)
  }, [firstAccountId, selectedAccount])

  const broadcastsQ = useBroadcasts(selectedAccount ?? undefined)
  const templatesQ = useWaTemplates(selectedAccount)
  const createM = useCreateBroadcast()
  const executeM = useExecuteBroadcast()
  const previewM = usePreviewBroadcast()

  const templates = useMemo(() => templatesQ.data?.items ?? [], [templatesQ.data])
  const broadcasts = broadcastsQ.data?.items ?? []

  const variantGroups = useMemo(() => {
    const set = new Set<string>()
    for (const t of templates) if (t.variantGroup) set.add(t.variantGroup)
    return [...set]
  }, [templates])

  const [form, setForm] = useState({
    name: '',
    templateName: '',
    languageCode: 'es_CO',
    variantGroup: '',
    segment: '',
    tags: '',
    excludeTags: '',
    country: '',
    minLtv: '',
    bodyVariables: '',
    scheduledFor: '', // datetime-local, vacío = enviar ahora
  })
  const [previewData, setPreviewData] = useState<{ total: number; sample: Array<{ firstName: string | null; phoneMasked: string }> } | null>(null)

  const buildFilter = () => ({
    ...(form.segment ? { segment: form.segment } : {}),
    ...(form.tags ? { tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) } : {}),
    ...(form.excludeTags ? { excludeTags: form.excludeTags.split(',').map(s => s.trim()).filter(Boolean) } : {}),
    ...(form.country ? { country: form.country } : {}),
    ...(form.minLtv ? { minLtv: Number(form.minLtv) } : {}),
    onlyOptedIn: true,
  })

  const handlePreview = async () => {
    if (!selectedAccount) return
    const res = await previewM.mutateAsync({ accountId: selectedAccount, segmentFilter: buildFilter() })
    setPreviewData(res)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return
    const scheduledIso = form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined
    const res = await createM.mutateAsync({
      accountId: selectedAccount,
      name: form.name,
      templateName: form.templateName,
      languageCode: form.languageCode,
      segmentFilter: buildFilter(),
      variantGroup: form.variantGroup || undefined,
      bodyVariables: form.bodyVariables ? form.bodyVariables.split('|').map(s => s.trim()) : undefined,
      scheduledFor: scheduledIso,
    })
    setShowForm(false)
    setPreviewData(null)
    setForm({ name: '', templateName: '', languageCode: 'es_CO', variantGroup: '', segment: '', tags: '', excludeTags: '', country: '', minLtv: '', bodyVariables: '', scheduledFor: '' })
    // Auto-ejecutar solo si NO hay schedule futuro (el cron tomará los agendados)
    if (!scheduledIso) {
      await executeM.mutateAsync(res.id)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title="Broadcasts WhatsApp" subtitle="Envío segmentado a tus contactos" />

      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        {accounts.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
              Cuenta:
            </span>
            {accounts.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAccount(a.id)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                  selectedAccount === a.id
                    ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/20 text-[var(--vc-lime-main)]'
                    : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] text-[var(--vc-white-dim)]'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[var(--vc-white-dim)]">
            {broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!selectedAccount}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] hover:bg-[var(--vc-lime-electric)] disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
            {showForm ? 'Cancelar' : 'Nuevo broadcast'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-5 rounded-xl border border-[var(--vc-lime-main)]/30 bg-[var(--vc-black-mid)] p-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-lime-main)]">
              Nuevo broadcast
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Nombre interno" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Promo Black Friday CO" required />
              <label className="block">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">Plantilla *</div>
                <select
                  value={form.templateName}
                  onChange={e => setForm({ ...form, templateName: e.target.value })}
                  required
                  className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1.5 text-xs text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
                >
                  <option value="">— Seleccionar —</option>
                  {templates.filter(t => t.status === 'APPROVED' || t.status === 'DRAFT').map(t => (
                    <option key={t.id} value={t.metaName}>
                      {t.metaName} · {t.purpose} ({t.category})
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Idioma" value={form.languageCode} onChange={v => setForm({ ...form, languageCode: v })} placeholder="es_CO" required />
              <label className="block">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">Grupo A/B (opcional)</div>
                <select
                  value={form.variantGroup}
                  onChange={e => setForm({ ...form, variantGroup: e.target.value })}
                  className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1.5 text-xs text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
                >
                  <option value="">Sin A/B</option>
                  {variantGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <Field label="Body variables (separadas por |)" value={form.bodyVariables} onChange={v => setForm({ ...form, bodyVariables: v })} placeholder="Promo BF | 40% off | hoy" />
              <label className="block">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                  Programar para (opcional)
                </div>
                <input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={e => setForm({ ...form, scheduledFor: e.target.value })}
                  className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1.5 text-xs text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
                />
                <div className="mt-0.5 text-[9px] text-[var(--vc-gray-mid)]">
                  Vacío = enviar ahora · Con fecha = el cron lo ejecuta cuando corresponda
                </div>
              </label>
            </div>

            <div className="mb-4 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)]/30 p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Segmentación
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Segment" value={form.segment} onChange={v => setForm({ ...form, segment: v })} placeholder="repeat_buyer / hot_lead / vip" />
                <Field label="País (CO/EC/GT/CL)" value={form.country} onChange={v => setForm({ ...form, country: v })} placeholder="CO" />
                <Field label="Tags incluir (coma)" value={form.tags} onChange={v => setForm({ ...form, tags: v })} placeholder="confirmado, repeat_intent" />
                <Field label="Tags excluir (coma)" value={form.excludeTags} onChange={v => setForm({ ...form, excludeTags: v })} placeholder="cancelador, not_interested" />
                <Field label="LTV mínimo (COP)" value={form.minLtv} onChange={v => setForm({ ...form, minLtv: v })} placeholder="50000" />
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewM.isPending}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--vc-info)]/40 bg-[var(--vc-info)]/10 px-2 py-1 text-[11px] font-semibold text-[var(--vc-info)] hover:bg-[var(--vc-info)]/20 disabled:opacity-40"
                >
                  {previewM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  Preview recipients
                </button>
                {previewData && (
                  <span className="text-xs text-[var(--vc-white-soft)]">
                    <strong>{previewData.total}</strong> contactos matchean · ej:{' '}
                    {previewData.sample.map(s => `${s.firstName ?? '?'} (${s.phoneMasked})`).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={createM.isPending || executeM.isPending || !form.templateName}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] hover:bg-[var(--vc-lime-electric)] disabled:opacity-40"
              >
                {createM.isPending || executeM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                {form.scheduledFor ? 'Agendar' : 'Crear y ejecutar'}
              </button>
              <div className="text-[10px] text-[var(--vc-white-dim)]">
                {form.scheduledFor
                  ? 'Se ejecutará automáticamente vía cron a la hora programada'
                  : 'Se envía inmediato en modo mock · respeta opt-out'}
              </div>
            </div>
          </form>
        )}

        {/* Broadcasts list */}
        <div className="space-y-2">
          {broadcastsQ.isLoading && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              Cargando…
            </div>
          )}
          {!broadcastsQ.isLoading && broadcasts.length === 0 && selectedAccount && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center">
              <Megaphone className="mx-auto mb-2 h-10 w-10 text-[var(--vc-gray-mid)]" />
              <div className="text-sm text-[var(--vc-white-soft)]">Sin broadcasts aún</div>
              <div className="text-xs text-[var(--vc-white-dim)]">Crea tu primera campaña segmentada</div>
            </div>
          )}

          {broadcasts.map(b => {
            const meta = STATUS_META[b.status]
            const progress = b.totalRecipients > 0
              ? ((b.sentCount + b.failedCount) / b.totalRecipients) * 100
              : 0
            return (
              <Link
                href={`/admin/whatsapp/broadcasts/${b.id}`}
                key={b.id}
                className="block rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3 transition hover:border-[var(--vc-lime-main)]/30"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                      >
                        <meta.Icon className={`h-2.5 w-2.5 ${b.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                        {meta.label}
                      </span>
                      {b.variantGroup && (
                        <span className="rounded border border-[var(--vc-info)]/40 bg-[var(--vc-info)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--vc-info)]">
                          A/B
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--vc-white-soft)]">
                      {b.name}
                    </div>
                    <div className="text-[10px] text-[var(--vc-white-dim)]">
                      Plantilla: <code>{b.templateName}</code> · {b.account.name}
                    </div>
                    {b.status === 'SCHEDULED' && b.scheduledFor && (
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#3CC6FF]">
                        <Clock className="h-2.5 w-2.5" />
                        Agendado para{' '}
                        {new Date(b.scheduledFor).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--vc-gray-mid)]" />
                </div>

                {/* Progress */}
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[var(--vc-black-soft)]">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: b.failedCount > 0 ? '#FFB800' : '#C6FF3C',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-3 text-[var(--vc-white-dim)]">
                    <span><Users className="inline h-2.5 w-2.5" /> {b.totalRecipients} recipients</span>
                    <span className="text-[var(--vc-lime-main)]"><CheckCircle2 className="inline h-2.5 w-2.5" /> {b.sentCount} sent</span>
                    {b.failedCount > 0 && (
                      <span className="text-[var(--vc-error)]"><XCircle className="inline h-2.5 w-2.5" /> {b.failedCount} failed</span>
                    )}
                  </div>
                  <span className="text-[var(--vc-gray-mid)]">
                    {new Date(b.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean
}) {
  return (
    <label className="block">
      <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
        {label} {required && <span className="text-[var(--vc-error)]">*</span>}
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1.5 text-xs text-[var(--vc-white-soft)] placeholder-[var(--vc-gray-mid)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
      />
    </label>
  )
}
