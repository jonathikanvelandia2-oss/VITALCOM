'use client'

import { use, useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Save, TestTube, CheckCircle2, XCircle, Clock,
  ChevronRight, Workflow as WorkflowIcon,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useWaWorkflow, useUpdateWaWorkflow, useTestWaWorkflow } from '@/hooks/useWaWorkflows'

const STATUS_META: Record<string, { label: string; color: string }> = {
  RUNNING:   { label: 'Ejecutándose', color: '#FFB800' },
  COMPLETED: { label: 'Completada', color: '#C6FF3C' },
  FAILED:    { label: 'Falló', color: '#FF4757' },
  CANCELLED: { label: 'Cancelada', color: '#8B9BA8' },
}

export default function AdminWorkflowDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const workflowQ = useWaWorkflow(id)
  const updateM = useUpdateWaWorkflow()
  const testM = useTestWaWorkflow()

  const [stepsJson, setStepsJson] = useState('')
  const [triggerJson, setTriggerJson] = useState('')
  const [testPhone, setTestPhone] = useState('+573001234567')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const workflow = workflowQ.data

  // Cargar JSON inicial una vez que tenemos data
  const initialSteps = useMemo(() => workflow?.steps ? JSON.stringify(workflow.steps, null, 2) : '', [workflow?.id])
  const initialTrigger = useMemo(() => workflow?.triggerConfig ? JSON.stringify(workflow.triggerConfig, null, 2) : '', [workflow?.id])

  useEffect(() => {
    if (workflow && !stepsJson) {
      setStepsJson(initialSteps)
      setTriggerJson(initialTrigger)
    }
  }, [workflow, initialSteps, initialTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setJsonError(null)
    try {
      const steps = JSON.parse(stepsJson)
      const triggerConfig = JSON.parse(triggerJson)
      if (!Array.isArray(steps) || steps.length === 0) {
        setJsonError('Los steps deben ser un array con al menos 1 elemento')
        return
      }
      await updateM.mutateAsync({
        id,
        data: { steps: steps as never, triggerConfig: triggerConfig as never },
      })
    } catch (err) {
      setJsonError('JSON inválido: ' + (err as Error).message)
    }
  }

  const handleTest = async () => {
    const result = await testM.mutateAsync({ id, phoneE164: testPhone })
    alert(`Test iniciado. Execution ID: ${result.executionId}`)
  }

  if (workflowQ.isLoading || !workflow) {
    return (
      <div className="min-h-screen bg-[var(--vc-black)]">
        <AdminTopbar title="Workflow" />
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title={workflow.name} subtitle={workflow.purpose} />

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/admin/workflows"
            className="flex items-center gap-1.5 rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-2 py-1 text-xs text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/30"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver a la lista
          </Link>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-[var(--vc-white-dim)]">
              <input
                type="checkbox"
                checked={workflow.isActive}
                onChange={(e) => updateM.mutate({ id, data: { isActive: e.target.checked } })}
                className="h-3 w-3 accent-[var(--vc-lime-main)]"
              />
              Activo
            </label>
            <button
              onClick={handleSave}
              disabled={updateM.isPending || !stepsJson}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] transition hover:bg-[var(--vc-lime-electric)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {updateM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Guardar
            </button>
          </div>
        </div>

        {jsonError && (
          <div className="mb-3 rounded-lg border border-[var(--vc-error)]/40 bg-[var(--vc-error)]/10 p-2 text-xs text-[var(--vc-error)]">
            {jsonError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr,320px]">
          {/* Editor JSON */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                  Trigger config
                </div>
                <div className="text-[10px] text-[var(--vc-gray-mid)]">
                  {workflow.triggerType}
                </div>
              </div>
              <textarea
                value={triggerJson}
                onChange={e => setTriggerJson(e.target.value)}
                rows={6}
                spellCheck={false}
                className="w-full resize-none rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black)] p-2 font-mono text-[11px] text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                  Steps (JSON)
                </div>
                <div className="text-[10px] text-[var(--vc-gray-mid)]">
                  Array de {(workflow.steps ?? []).length} pasos
                </div>
              </div>
              <textarea
                value={stepsJson}
                onChange={e => setStepsJson(e.target.value)}
                rows={32}
                spellCheck={false}
                className="w-full resize-none rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black)] p-2 font-mono text-[11px] text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
              />
              <div className="mt-1 text-[10px] text-[var(--vc-gray-mid)]">
                Step types: send_template · send_text · send_interactive · send_media · wait · wait_for_reply ·
                branch · tag · ai_decision · ai_respond · update_contact · create_order_link · call_webhook · escalate · end
              </div>
            </div>
          </div>

          {/* Sidebar: test + historial + meta */}
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Probar flujo
              </div>
              <input
                type="text"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="+573001234567"
                className="mb-2 w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1.5 text-xs text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
              />
              <button
                onClick={handleTest}
                disabled={testM.isPending || !workflow.account}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--vc-info)]/40 bg-[var(--vc-info)]/10 py-2 text-xs font-bold text-[var(--vc-info)] hover:bg-[var(--vc-info)]/20 disabled:opacity-40"
              >
                {testM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                Ejecutar ahora (mock)
              </button>
              <div className="mt-1 text-[9px] text-[var(--vc-gray-mid)]">
                El contacto se crea/reutiliza. Mensajes van a consola en modo mock.
              </div>
            </div>

            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Métricas
              </div>
              <MetricRow label="Ejecuciones totales" value={workflow.timesExecuted.toString()} />
              <MetricRow label="Éxitos" value={workflow.successCount.toString()} color="#C6FF3C" />
              <MetricRow label="Fallos" value={workflow.failCount.toString()} color="#FF4757" />
              <MetricRow label="Confianza" value={`${(workflow.confidenceScore * 100).toFixed(0)}%`} />
              {workflow.avgDurationMin != null && (
                <MetricRow label="Duración promedio" value={`${workflow.avgDurationMin.toFixed(1)} min`} />
              )}
            </div>

            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Últimas ejecuciones
              </div>
              {workflow.executions.length === 0 && (
                <div className="text-[11px] text-[var(--vc-gray-mid)]">Sin ejecuciones aún</div>
              )}
              {workflow.executions.map(e => {
                const meta = STATUS_META[e.status] ?? { label: e.status, color: '#8B9BA8' }
                return (
                  <div key={e.id} className="flex items-center gap-2 border-t border-[var(--vc-gray-dark)]/40 py-1.5 text-[10px]">
                    <span
                      className="rounded px-1.5 py-0.5 font-semibold"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="flex-1 truncate text-[var(--vc-white-dim)]">
                      {e.currentStepId ?? '—'}
                    </span>
                    <span className="text-[var(--vc-gray-mid)]">
                      {new Date(e.startedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11px]">
      <span className="text-[var(--vc-white-dim)]">{label}</span>
      <span className="font-bold" style={{ color: color ?? 'var(--vc-white-soft)' }}>{value}</span>
    </div>
  )
}
