'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  FileText, Plus, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle,
  Trash2, Save, GitMerge, BarChart3,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useWaTemplates, useCreateWaTemplate, useUpdateWaTemplate, useDeleteWaTemplate,
  useAbStats,
  type WaTemplateCategory, type WaTemplateStatus, type WaTemplate,
} from '@/hooks/useWaTemplates'
import { useWhatsappAccounts } from '@/hooks/useWaWorkflows'

const STATUS_META: Record<WaTemplateStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  DRAFT:     { label: 'Draft',     color: '#8B9BA8', Icon: Clock },
  SUBMITTED: { label: 'Sometido',  color: '#3CC6FF', Icon: Clock },
  APPROVED:  { label: 'Aprobado',  color: '#C6FF3C', Icon: CheckCircle2 },
  REJECTED:  { label: 'Rechazado', color: '#FF4757', Icon: XCircle },
  DISABLED:  { label: 'Pausado',   color: '#FFB800', Icon: AlertTriangle },
}

const CATEGORY_COLOR: Record<WaTemplateCategory, string> = {
  UTILITY:        '#3CC6FF',
  MARKETING:      '#FF6BCB',
  AUTHENTICATION: '#FFB800',
}

export default function AdminTemplatesPage() {
  const accountsQ = useWhatsappAccounts()
  const accounts = accountsQ.data?.items ?? []
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [abGroup, setAbGroup] = useState<string | null>(null)

  // Auto-selection del primer account
  const firstAccountId = accounts[0]?.id
  useEffect(() => {
    if (!selectedAccount && firstAccountId) {
      setSelectedAccount(firstAccountId)
    }
  }, [firstAccountId, selectedAccount])

  const templatesQ = useWaTemplates(selectedAccount)
  const createM = useCreateWaTemplate()
  const updateM = useUpdateWaTemplate()
  const deleteM = useDeleteWaTemplate()
  const abStatsQ = useAbStats(selectedAccount, abGroup)

  const templates = useMemo(() => templatesQ.data?.items ?? [], [templatesQ.data])
  const variantGroups = useMemo(() => {
    const groups = new Map<string, number>()
    for (const t of templates) {
      if (t.variantGroup) groups.set(t.variantGroup, (groups.get(t.variantGroup) ?? 0) + 1)
    }
    return [...groups.entries()].filter(([, n]) => n > 1)
  }, [templates])

  const [form, setForm] = useState({
    metaName: '',
    category: 'UTILITY' as WaTemplateCategory,
    language: 'es_CO',
    purpose: '',
    bodyText: '',
    footerText: '',
    variantGroup: '',
    weight: 1,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return
    await createM.mutateAsync({
      accountId: selectedAccount,
      metaName: form.metaName,
      category: form.category,
      language: form.language,
      purpose: form.purpose,
      bodyText: form.bodyText,
      footerText: form.footerText || undefined,
      variantGroup: form.variantGroup || undefined,
      weight: form.weight,
    })
    setShowForm(false)
    setForm({ metaName: '', category: 'UTILITY', language: 'es_CO', purpose: '', bodyText: '', footerText: '', variantGroup: '', weight: 1 })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return
    await deleteM.mutateAsync(id)
  }

  const toggleStatus = async (t: WaTemplate) => {
    const next = t.status === 'APPROVED' ? 'DISABLED' : 'APPROVED'
    await updateM.mutateAsync({ id: t.id, data: { status: next } })
  }

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title="Plantillas WhatsApp" subtitle="Meta templates + A/B testing" />

      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        {/* Account selector */}
        {accounts.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
              Cuenta:
            </span>
            {accounts.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAccount(a.id)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
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
            {templates.length} plantilla{templates.length !== 1 ? 's' : ''}
            {variantGroups.length > 0 && ` · ${variantGroups.length} grupo${variantGroups.length > 1 ? 's' : ''} A/B`}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!selectedAccount}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] hover:bg-[var(--vc-lime-electric)] disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
            {showForm ? 'Cancelar' : 'Nueva'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="mb-5 rounded-xl border border-[var(--vc-lime-main)]/30 bg-[var(--vc-black-mid)] p-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-lime-main)]">
              Nueva plantilla Meta
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Meta name" value={form.metaName} onChange={v => setForm({ ...form, metaName: v })} placeholder="confirmacion_v2" required />
              <Field label="Propósito" value={form.purpose} onChange={v => setForm({ ...form, purpose: v })} placeholder="order_confirmation" required />
              <label className="block">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">Categoría *</div>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as WaTemplateCategory })}
                  className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1.5 text-xs text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
                >
                  <option>UTILITY</option>
                  <option>MARKETING</option>
                  <option>AUTHENTICATION</option>
                </select>
              </label>
              <Field label="Idioma" value={form.language} onChange={v => setForm({ ...form, language: v })} placeholder="es_CO" required />
              <Field label="Grupo A/B (opcional)" value={form.variantGroup} onChange={v => setForm({ ...form, variantGroup: v })} placeholder="confirmacion_co_2026q2" />
              <Field label="Peso A/B" value={String(form.weight)} onChange={v => setForm({ ...form, weight: Number(v) || 1 })} placeholder="1" />
            </div>
            <div className="mt-3">
              <label className="block">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">Body text *</div>
                <textarea
                  value={form.bodyText}
                  onChange={e => setForm({ ...form, bodyText: e.target.value })}
                  rows={4}
                  required
                  placeholder="Hola {{1}}, tu pedido de {{2}} está listo para confirmar..."
                  className="w-full resize-none rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1.5 text-xs text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-3">
              <Field label="Footer (opcional)" value={form.footerText} onChange={v => setForm({ ...form, footerText: v })} placeholder="Responde SI para confirmar" />
            </div>
            <div className="mt-3">
              <button
                type="submit"
                disabled={createM.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] hover:bg-[var(--vc-lime-electric)] disabled:opacity-40"
              >
                {createM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Crear plantilla
              </button>
            </div>
          </form>
        )}

        {/* A/B groups summary */}
        {variantGroups.length > 0 && (
          <div className="mb-4 rounded-xl border border-[var(--vc-info)]/30 bg-[var(--vc-info)]/5 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-info)]">
              <GitMerge className="h-3 w-3" />
              Grupos A/B activos
            </div>
            <div className="flex flex-wrap gap-2">
              {variantGroups.map(([group, n]) => (
                <button
                  key={group}
                  onClick={() => setAbGroup(abGroup === group ? null : group)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                    abGroup === group
                      ? 'border-[var(--vc-info)] bg-[var(--vc-info)]/20 text-[var(--vc-info)]'
                      : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] text-[var(--vc-white-dim)]'
                  }`}
                >
                  <code>{group}</code> · {n} variantes
                </button>
              ))}
            </div>
            {abStatsQ.data && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--vc-gray-dark)]">
                <table className="w-full text-[11px]">
                  <thead className="bg-[var(--vc-black-soft)] text-[9px] uppercase text-[var(--vc-white-dim)]">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Variante</th>
                      <th className="px-2 py-1.5">Peso</th>
                      <th className="px-2 py-1.5">Sent</th>
                      <th className="px-2 py-1.5">Opened</th>
                      <th className="px-2 py-1.5">Clicked</th>
                      <th className="px-2 py-1.5">Blocked</th>
                      <th className="px-2 py-1.5">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abStatsQ.data.stats.map(s => {
                      const ctr = s.sent > 0 ? (s.clicked / s.sent) * 100 : 0
                      return (
                        <tr key={s.templateId} className="border-t border-[var(--vc-gray-dark)]/40">
                          <td className="px-2 py-1.5 font-mono text-[var(--vc-white-soft)]">{s.metaName}</td>
                          <td className="px-2 py-1.5 text-center text-[var(--vc-white-dim)]">{s.weight}</td>
                          <td className="px-2 py-1.5 text-center text-[var(--vc-white-soft)]">{s.sent}</td>
                          <td className="px-2 py-1.5 text-center text-[var(--vc-white-soft)]">{s.opened}</td>
                          <td className="px-2 py-1.5 text-center text-[var(--vc-white-soft)]">{s.clicked}</td>
                          <td className="px-2 py-1.5 text-center text-[var(--vc-warning)]">{s.blocked}</td>
                          <td className="px-2 py-1.5 text-center font-bold" style={{ color: ctr > 5 ? '#C6FF3C' : '#FFB800' }}>
                            {ctr.toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Templates list */}
        <div className="space-y-2">
          {templatesQ.isLoading && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              Cargando…
            </div>
          )}
          {!templatesQ.isLoading && templates.length === 0 && selectedAccount && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center">
              <FileText className="mx-auto mb-2 h-10 w-10 text-[var(--vc-gray-mid)]" />
              <div className="text-sm text-[var(--vc-white-soft)]">Sin plantillas aún</div>
              <div className="text-xs text-[var(--vc-white-dim)]">Crea tu primera plantilla Meta</div>
            </div>
          )}

          {templates.map(t => {
            const meta = STATUS_META[t.status]
            return (
              <div key={t.id} className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ backgroundColor: `${CATEGORY_COLOR[t.category]}20`, color: CATEGORY_COLOR[t.category] }}
                      >
                        {t.category}
                      </span>
                      <span
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                      >
                        <meta.Icon className="h-2.5 w-2.5" />
                        {meta.label}
                      </span>
                      {t.variantGroup && (
                        <span className="flex items-center gap-1 rounded border border-[var(--vc-info)]/40 bg-[var(--vc-info)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--vc-info)]">
                          <GitMerge className="h-2.5 w-2.5" />
                          A/B · {t.variantGroup} · peso {t.weight}
                        </span>
                      )}
                      <span className="rounded bg-[var(--vc-black-soft)] px-1.5 py-0.5 text-[9px] font-mono text-[var(--vc-white-dim)]">
                        {t.language}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--vc-white-soft)]">
                      <code>{t.metaName}</code>
                      <span className="text-[10px] font-normal text-[var(--vc-gray-mid)]">· {t.purpose}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 rounded bg-[var(--vc-black-soft)]/50 p-2 font-mono text-[11px] text-[var(--vc-white-dim)]">
                      {t.bodyText}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleStatus(t)}
                      className="rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-1.5 text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/40"
                      title={t.status === 'APPROVED' ? 'Pausar' : 'Aprobar'}
                    >
                      {t.status === 'APPROVED' ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="rounded-md border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/5 p-1.5 text-[var(--vc-error)] hover:bg-[var(--vc-error)]/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 border-t border-[var(--vc-gray-dark)] pt-2 text-center">
                  <Metric label="Sent" value={t.timesSent} />
                  <Metric label="Opened" value={t.timesOpened} />
                  <Metric label="Clicked" value={t.timesClicked} color="#C6FF3C" />
                  <Metric label="Blocked" value={t.timesBlocked} color="#FF4757" />
                </div>
              </div>
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

function Metric({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">{label}</div>
      <div className="text-sm font-bold" style={{ color: color ?? 'var(--vc-white-soft)' }}>{value}</div>
    </div>
  )
}
