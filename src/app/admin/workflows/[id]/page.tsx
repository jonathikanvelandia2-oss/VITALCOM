'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Save, TestTube, Code2, Eye, Settings2,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { WorkflowCanvas, WORKFLOW_STEP_META, type CanvasStep } from '@/components/admin/WorkflowCanvas'
import { useWaWorkflow, useUpdateWaWorkflow, useTestWaWorkflow } from '@/hooks/useWaWorkflows'

const STATUS_META: Record<string, { label: string; color: string }> = {
  RUNNING:   { label: 'Ejecutándose', color: '#FFB800' },
  COMPLETED: { label: 'Completada', color: '#C6FF3C' },
  FAILED:    { label: 'Falló', color: '#FF4757' },
  CANCELLED: { label: 'Cancelada', color: '#8B9BA8' },
}

type Tab = 'visual' | 'json'

export default function AdminWorkflowDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const workflowQ = useWaWorkflow(id)
  const updateM = useUpdateWaWorkflow()
  const testM = useTestWaWorkflow()

  const [tab, setTab] = useState<Tab>('visual')
  const [stepsJson, setStepsJson] = useState('')
  const [triggerJson, setTriggerJson] = useState('')
  const [testPhone, setTestPhone] = useState('+573001234567')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)

  const workflow = workflowQ.data

  useEffect(() => {
    if (workflow && !stepsJson) {
      setStepsJson(JSON.stringify(workflow.steps, null, 2))
      setTriggerJson(JSON.stringify(workflow.triggerConfig, null, 2))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow?.id])

  // Parseo defensivo para la vista visual
  let parsedSteps: CanvasStep[] = []
  let parseError: string | null = null
  try {
    const p = stepsJson ? JSON.parse(stepsJson) : []
    if (Array.isArray(p)) parsedSteps = p as CanvasStep[]
  } catch (err) {
    parseError = (err as Error).message
  }

  const selectedStep = selectedStepId
    ? parsedSteps.find(s => s.id === selectedStepId) ?? null
    : null

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

  // Callbacks del canvas: persiste posiciones en el JSON del step
  const handlePositionsChange = useCallback((positions: Record<string, { x: number; y: number }>) => {
    const updated = parsedSteps.map(s => ({
      ...s,
      position: positions[s.id] ?? s.position,
    }))
    setStepsJson(JSON.stringify(updated, null, 2))
  }, [parsedSteps])

  const handleStepFieldChange = (field: 'id' | 'type' | 'nextOnSuccess' | 'nextOnFail', value: string) => {
    if (!selectedStep) return
    const updated = parsedSteps.map(s => {
      if (s.id !== selectedStep.id) return s
      return { ...s, [field]: value || undefined }
    })
    setStepsJson(JSON.stringify(updated, null, 2))
    if (field === 'id' && value) setSelectedStepId(value)
  }

  const handleConfigChange = (configJson: string) => {
    if (!selectedStep) return
    try {
      const parsedConfig = JSON.parse(configJson)
      const updated = parsedSteps.map(s => {
        if (s.id !== selectedStep.id) return s
        return { ...s, config: parsedConfig }
      })
      setStepsJson(JSON.stringify(updated, null, 2))
    } catch {
      // Silencioso — el usuario aún está tipeando
    }
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

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/admin/workflows"
            className="flex items-center gap-1.5 rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-2 py-1 text-xs text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/30"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver a la lista
          </Link>

          {/* Tab switcher */}
          <div className="flex rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-0.5">
            <button
              onClick={() => setTab('visual')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                tab === 'visual'
                  ? 'bg-[var(--vc-lime-main)] text-[var(--vc-black)]'
                  : 'text-[var(--vc-white-dim)] hover:text-[var(--vc-lime-main)]'
              }`}
            >
              <Eye className="h-3 w-3" />
              Visual
            </button>
            <button
              onClick={() => setTab('json')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                tab === 'json'
                  ? 'bg-[var(--vc-lime-main)] text-[var(--vc-black)]'
                  : 'text-[var(--vc-white-dim)] hover:text-[var(--vc-lime-main)]'
              }`}
            >
              <Code2 className="h-3 w-3" />
              JSON
            </button>
          </div>

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
          <div className="space-y-4">
            {tab === 'visual' ? (
              <>
                {parseError && (
                  <div className="rounded-lg border border-[var(--vc-warning)]/40 bg-[var(--vc-warning)]/10 p-2 text-xs text-[var(--vc-warning)]">
                    JSON con errores — corrige en pestaña JSON para ver el canvas
                  </div>
                )}
                <WorkflowCanvas
                  steps={parsedSteps}
                  selectedStepId={selectedStepId}
                  onStepSelect={setSelectedStepId}
                  onPositionsChange={handlePositionsChange}
                />
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--vc-white-dim)]">
                  <span>Arrastra nodos para reubicar · click para inspeccionar</span>
                  <span className="rounded bg-[var(--vc-black-mid)] px-2 py-0.5">
                    flecha verde = éxito
                  </span>
                  <span className="rounded bg-[var(--vc-black-mid)] px-2 py-0.5">
                    roja = fallo
                  </span>
                  <span className="rounded bg-[var(--vc-black-mid)] px-2 py-0.5">
                    azul = rama
                  </span>
                </div>
              </>
            ) : (
              <>
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
                      Array de {parsedSteps.length} pasos
                    </div>
                  </div>
                  <textarea
                    value={stepsJson}
                    onChange={e => setStepsJson(e.target.value)}
                    rows={28}
                    spellCheck={false}
                    className="w-full resize-none rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black)] p-2 font-mono text-[11px] text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
                  />
                  <div className="mt-1 text-[10px] text-[var(--vc-gray-mid)]">
                    Step types: send_template · send_text · send_interactive · send_media · wait · wait_for_reply ·
                    branch · tag · ai_decision · ai_respond · update_contact · create_order_link · call_webhook · escalate · end
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            {/* Step inspector — solo en modo visual con selección */}
            {tab === 'visual' && selectedStep && (
              <StepInspector
                step={selectedStep}
                allSteps={parsedSteps}
                onFieldChange={handleStepFieldChange}
                onConfigChange={handleConfigChange}
              />
            )}

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

function StepInspector({
  step, allSteps, onFieldChange, onConfigChange,
}: {
  step: CanvasStep
  allSteps: CanvasStep[]
  onFieldChange: (field: 'id' | 'type' | 'nextOnSuccess' | 'nextOnFail', value: string) => void
  onConfigChange: (configJson: string) => void
}) {
  const meta = WORKFLOW_STEP_META[step.type] ?? WORKFLOW_STEP_META.end
  const [configDraft, setConfigDraft] = useState(JSON.stringify(step.config, null, 2))
  const [idDraft, setIdDraft] = useState(step.id)

  useEffect(() => {
    setConfigDraft(JSON.stringify(step.config, null, 2))
    setIdDraft(step.id)
  }, [step.id, step.config])

  const otherStepIds = allSteps.filter(s => s.id !== step.id).map(s => s.id)
  const Icon = meta.Icon

  return (
    <div
      className="rounded-xl border bg-[var(--vc-black-mid)] p-3"
      style={{ borderColor: `${meta.color}55` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded"
          style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
            Inspector · {step.type}
          </div>
          <div className="truncate text-[11px] text-[var(--vc-white-soft)]">{meta.label}</div>
        </div>
        <Settings2 className="h-3 w-3 text-[var(--vc-gray-mid)]" />
      </div>

      <label className="mb-2 block">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
          ID del step
        </div>
        <input
          type="text"
          value={idDraft}
          onChange={e => setIdDraft(e.target.value)}
          onBlur={() => idDraft !== step.id && onFieldChange('id', idDraft)}
          className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1 font-mono text-[11px] text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
        />
      </label>

      <label className="mb-2 block">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
          Tipo
        </div>
        <select
          value={step.type}
          onChange={e => onFieldChange('type', e.target.value)}
          className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1 text-[11px] text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
        >
          {Object.keys(WORKFLOW_STEP_META).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="mb-2 block">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
          Siguiente (éxito)
        </div>
        <select
          value={step.nextOnSuccess ?? ''}
          onChange={e => onFieldChange('nextOnSuccess', e.target.value)}
          className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1 text-[11px] text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
        >
          <option value="">— ninguno —</option>
          {otherStepIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
      </label>

      <label className="mb-2 block">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
          Siguiente (fallo)
        </div>
        <select
          value={step.nextOnFail ?? ''}
          onChange={e => onFieldChange('nextOnFail', e.target.value)}
          className="w-full rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1 text-[11px] text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
        >
          <option value="">— ninguno —</option>
          {otherStepIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
      </label>

      <label className="block">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
          Config (JSON)
        </div>
        <textarea
          value={configDraft}
          onChange={e => {
            setConfigDraft(e.target.value)
            onConfigChange(e.target.value)
          }}
          rows={10}
          spellCheck={false}
          className="w-full resize-none rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black)] p-2 font-mono text-[10px] text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)]/50 focus:outline-none"
        />
      </label>
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
