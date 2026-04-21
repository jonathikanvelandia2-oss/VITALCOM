'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Workflow as WorkflowIcon, Power, PowerOff, Loader2, CheckCircle2, XCircle,
  ArrowRight, TestTube, Trash2, Sparkles, ChevronRight, Phone,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useWaWorkflows, useUpdateWaWorkflow, useDeleteWaWorkflow,
  useWhatsappAccounts, useInstallPrebuilt,
  type WaTriggerType,
} from '@/hooks/useWaWorkflows'

const TRIGGER_LABEL: Record<WaTriggerType, string> = {
  ORDER_CREATED: 'Pedido creado',
  MESSAGE_RECEIVED: 'Mensaje recibido',
  NO_RESPONSE: 'Sin respuesta',
  SCHEDULE: 'Programado',
  WEBHOOK: 'Webhook externo',
  MANUAL: 'Manual',
}

const TRIGGER_COLOR: Record<WaTriggerType, string> = {
  ORDER_CREATED: '#C6FF3C',
  MESSAGE_RECEIVED: '#3CC6FF',
  NO_RESPONSE: '#FFB800',
  SCHEDULE: '#B388FF',
  WEBHOOK: '#FF6BCB',
  MANUAL: '#8B9BA8',
}

export default function AdminWorkflowsPage() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const accountsQ = useWhatsappAccounts()
  const workflowsQ = useWaWorkflows(selectedAccount ?? undefined)
  const updateM = useUpdateWaWorkflow()
  const deleteM = useDeleteWaWorkflow()
  const installM = useInstallPrebuilt()

  const accounts = accountsQ.data?.items ?? []
  const workflows = workflowsQ.data?.items ?? []

  const toggleActive = async (id: string, current: boolean) => {
    await updateM.mutateAsync({ id, data: { isActive: !current } })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este workflow? No se podrá recuperar.')) return
    await deleteM.mutateAsync(id)
  }

  const handleInstall = async () => {
    if (!selectedAccount) return alert('Selecciona una cuenta WhatsApp primero')
    await installM.mutateAsync({ accountId: selectedAccount })
  }

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title="Workflows WhatsApp" subtitle="Motor de automatización conversacional" />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Accounts selector */}
        <div className="mb-5 rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Cuentas WhatsApp
              </div>
              <div className="text-sm text-[var(--vc-white-soft)]">
                {accounts.length === 0
                  ? 'Conecta tu primera cuenta para activar automatizaciones'
                  : `${accounts.length} cuenta${accounts.length > 1 ? 's' : ''} conectada${accounts.length > 1 ? 's' : ''}`}
              </div>
            </div>
            <Link
              href="/admin/whatsapp"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--vc-lime-main)]/40 bg-[var(--vc-lime-main)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--vc-lime-main)] hover:bg-[var(--vc-lime-main)]/20"
            >
              Gestionar cuentas
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {accounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedAccount(null)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                  selectedAccount === null
                    ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/20 text-[var(--vc-lime-main)]'
                    : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] text-[var(--vc-white-dim)]'
                }`}
              >
                Todas
              </button>
              {accounts.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAccount(a.id)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                    selectedAccount === a.id
                      ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/20 text-[var(--vc-lime-main)]'
                      : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] text-[var(--vc-white-dim)]'
                  }`}
                >
                  <Phone className="h-3 w-3" />
                  {a.name} · {a.displayPhone}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[var(--vc-white-dim)]">
            {workflows.length} workflows {selectedAccount ? 'en esta cuenta' : 'totales'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              disabled={!selectedAccount || installM.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--vc-info)]/40 bg-[var(--vc-info)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--vc-info)] transition hover:bg-[var(--vc-info)]/20 disabled:cursor-not-allowed disabled:opacity-40"
              title={!selectedAccount ? 'Selecciona una cuenta primero' : 'Instalar los 6 workflows pre-construidos'}
            >
              {installM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Instalar 6 pre-built
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {workflowsQ.isLoading && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              Cargando workflows…
            </div>
          )}

          {!workflowsQ.isLoading && workflows.length === 0 && (
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center">
              <WorkflowIcon className="mx-auto mb-2 h-10 w-10 text-[var(--vc-gray-mid)]" />
              <div className="mb-2 text-sm font-semibold text-[var(--vc-white-soft)]">
                Sin workflows {selectedAccount ? 'en esta cuenta' : ''}
              </div>
              <div className="text-xs text-[var(--vc-white-dim)]">
                {accounts.length === 0
                  ? 'Conecta una cuenta WhatsApp para empezar'
                  : 'Instala los 6 pre-construidos o crea uno desde cero'}
              </div>
            </div>
          )}

          {workflows.map(wf => {
            const successRate = wf.timesExecuted > 0
              ? (wf.successCount / wf.timesExecuted) * 100
              : 0
            return (
              <div
                key={wf.id}
                className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3 transition hover:border-[var(--vc-lime-main)]/30"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${TRIGGER_COLOR[wf.triggerType]}20`,
                          color: TRIGGER_COLOR[wf.triggerType],
                        }}
                      >
                        {TRIGGER_LABEL[wf.triggerType]}
                      </span>
                      {wf.useAiAdaptation && (
                        <span className="rounded border border-[var(--vc-lime-main)]/40 bg-[var(--vc-lime-main)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--vc-lime-main)]">
                          IA adaptativa
                        </span>
                      )}
                      {!wf.isActive && (
                        <span className="rounded bg-[var(--vc-gray-dark)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--vc-white-dim)]">
                          Pausado
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--vc-white-soft)]">
                      {wf.name}
                    </div>
                    <div className="text-[10px] text-[var(--vc-white-dim)]">
                      {wf.account?.name} · {wf.purpose} · {wf.stepsCount} pasos
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(wf.id, wf.isActive)}
                      disabled={updateM.isPending}
                      className="rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-1.5 text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/40 hover:text-[var(--vc-lime-main)]"
                      title={wf.isActive ? 'Pausar' : 'Activar'}
                    >
                      {wf.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                    </button>
                    <Link
                      href={`/admin/workflows/${wf.id}`}
                      className="flex items-center gap-1 rounded-md border border-[var(--vc-lime-main)]/40 bg-[var(--vc-lime-main)]/10 px-2 py-1.5 text-[11px] font-semibold text-[var(--vc-lime-main)] hover:bg-[var(--vc-lime-main)]/20"
                    >
                      Editar
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => handleDelete(wf.id)}
                      disabled={deleteM.isPending}
                      className="rounded-md border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/5 p-1.5 text-[var(--vc-error)] hover:bg-[var(--vc-error)]/10"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 border-t border-[var(--vc-gray-dark)] pt-2">
                  <StatItem label="Ejecuciones" value={wf.timesExecuted.toString()} />
                  <StatItem label="Éxito" value={`${successRate.toFixed(0)}%`} color={successRate > 70 ? '#C6FF3C' : '#FFB800'} />
                  <StatItem
                    label="Éxito/Fallo"
                    value={`${wf.successCount}/${wf.failCount}`}
                    Icon={wf.successCount > wf.failCount ? CheckCircle2 : XCircle}
                    iconColor={wf.successCount > wf.failCount ? '#C6FF3C' : '#FF4757'}
                  />
                  <StatItem label="Confianza" value={`${(wf.confidenceScore * 100).toFixed(0)}%`} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer info mock mode */}
        <div className="mt-6 rounded-lg border border-[var(--vc-info)]/20 bg-[var(--vc-info)]/5 p-3 text-xs text-[var(--vc-white-dim)]">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--vc-info)]">
            <TestTube className="h-3 w-3" />
            MODO MOCK ACTIVO
          </div>
          Los envíos WhatsApp se loguean en consola y persisten en BD pero no llegan a clientes reales.
          Cuando las credenciales Meta Cloud API estén configuradas, el sistema operará en modo producción.
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value, color, Icon, iconColor }: {
  label: string
  value: string
  color?: string
  Icon?: typeof CheckCircle2
  iconColor?: string
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">
        {label}
      </div>
      <div className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" style={{ color: iconColor }} />}
        <div className="text-sm font-bold" style={{ color: color ?? 'var(--vc-white-soft)' }}>
          {value}
        </div>
      </div>
    </div>
  )
}
