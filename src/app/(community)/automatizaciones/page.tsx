'use client'

import { useState } from 'react'
import {
  Zap, Play, Clock, CheckCircle, BarChart3, ChevronDown, ChevronUp, Loader2, Trash2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useWorkflowTemplates,
  useWorkflowActivations,
  useActivateWorkflow,
  useToggleWorkflow,
  useDeactivateWorkflow,
  type WorkflowStep,
} from '@/hooks/useWorkflows'

// ── Automatizaciones VITALCOMMER ─────────────────────────
// Plantillas oficiales + flujos activados por el usuario.
// Conectado a WorkflowTemplate + UserWorkflowActivation.

function timeAgo(iso: string | null): string {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

export default function AutomatizacionesPage() {
  const templatesQ = useWorkflowTemplates()
  const activationsQ = useWorkflowActivations()
  const activate = useActivateWorkflow()
  const toggle = useToggleWorkflow()
  const deactivate = useDeactivateWorkflow()

  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  const templates = templatesQ.data?.items ?? []
  const activations = activationsQ.data?.items ?? []
  const activeTemplateIds = new Set(activations.map((a) => a.template.id))

  const isLoading = templatesQ.isLoading || activationsQ.isLoading

  return (
    <>
      <CommunityTopbar title="Automatizaciones" subtitle="Flujos automáticos para tu negocio de dropshipping" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Flujos activos */}
        <div className="vc-card">
          <h2 className="heading-sm mb-4 flex items-center gap-2">
            <Zap size={16} color="var(--vc-lime-main)" /> Mis flujos activos
          </h2>
          {activationsQ.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
            </div>
          ) : activations.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
              Aún no tienes flujos activos. Activa una plantilla abajo para empezar.
            </p>
          ) : (
            <div className="space-y-3">
              {activations.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
                >
                  <span className="text-2xl">{a.template.emoji ?? '⚙️'}</span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-bold"
                      style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                    >
                      {a.template.name}
                    </p>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-3 text-[10px]"
                      style={{ color: 'var(--vc-white-dim)' }}
                    >
                      <span className="flex items-center gap-1">
                        <Play size={10} /> {a.executions} ejecuciones
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle
                          size={10}
                          style={{ color: a.successRate >= 80 ? 'var(--vc-lime-main)' : 'var(--vc-warning)' }}
                        />
                        {a.successRate}% éxito
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(a.lastRunAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        toggle.mutate({ id: a.id, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })
                      }
                      disabled={toggle.isPending}
                      className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                      style={{
                        background: a.status === 'ACTIVE' ? 'rgba(198,255,60,0.1)' : 'rgba(255,184,0,0.1)',
                        border: `1px solid ${a.status === 'ACTIVE' ? 'rgba(198,255,60,0.3)' : 'rgba(255,184,0,0.3)'}`,
                        color: a.status === 'ACTIVE' ? 'var(--vc-lime-main)' : 'var(--vc-warning)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {a.status === 'ACTIVE' ? '● Activo' : '■ Pausado'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Desactivar este flujo?')) deactivate.mutate(a.id)
                      }}
                      disabled={deactivate.isPending}
                      aria-label="Desactivar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:brightness-125"
                      style={{ border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-gray-mid)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plantillas disponibles */}
        <div>
          <h2 className="heading-sm mb-4 flex items-center gap-2 px-1">
            <BarChart3 size={16} color="var(--vc-lime-main)" /> Plantillas disponibles
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
              No hay plantillas disponibles aún.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => {
                const isActive = activeTemplateIds.has(tpl.id)
                const isExpanded = expandedTemplate === tpl.id
                const steps: WorkflowStep[] = Array.isArray(tpl.steps) ? tpl.steps : []
                return (
                  <div key={tpl.id} className="vc-card flex flex-col">
                    <div className="mb-3 flex items-start justify-between">
                      <span className="text-3xl">{tpl.emoji ?? '⚙️'}</span>
                      {tpl.impact && (
                        <span
                          className="rounded-full px-2.5 py-1 text-[9px] font-bold"
                          style={{
                            background: 'rgba(198,255,60,0.08)',
                            color: 'var(--vc-lime-main)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {tpl.impact}
                        </span>
                      )}
                    </div>
                    <h3
                      className="mb-1 text-sm font-bold"
                      style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                    >
                      {tpl.name}
                    </h3>
                    <p className="mb-3 flex-1 text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                      {tpl.description}
                    </p>

                    {steps.length > 0 && (
                      <>
                        <button
                          onClick={() => setExpandedTemplate(isExpanded ? null : tpl.id)}
                          className="mb-3 flex items-center gap-1 text-[10px] font-semibold"
                          style={{ color: 'var(--vc-lime-deep)', fontFamily: 'var(--font-heading)' }}
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'Ocultar pasos' : `Ver ${steps.length} pasos`}
                        </button>
                        {isExpanded && (
                          <div className="mb-3 space-y-2">
                            {steps.map((step, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-[10px]"
                                style={{ color: 'var(--vc-white-dim)' }}
                              >
                                <span
                                  className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold"
                                  style={{
                                    background:
                                      step.type === 'auto'
                                        ? 'rgba(198,255,60,0.1)'
                                        : 'rgba(60,198,255,0.1)',
                                    color: step.type === 'auto' ? 'var(--vc-lime-main)' : 'var(--vc-info)',
                                  }}
                                >
                                  {step.type === 'auto' ? 'AUTO' : 'MANUAL'}
                                </span>
                                {step.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => activate.mutate(tpl.id)}
                      disabled={isActive || activate.isPending}
                      className="vc-btn-primary w-full py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isActive
                        ? '✓ Activado'
                        : activate.isPending && activate.variables === tpl.id
                          ? 'Activando...'
                          : 'Activar flujo'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
