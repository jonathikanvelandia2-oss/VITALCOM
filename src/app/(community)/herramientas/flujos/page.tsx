'use client'

import Link from 'next/link'
import { MessageSquare, ShoppingCart, RefreshCw, HeartHandshake, Loader2, Zap, ArrowRight } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useWorkflowTemplates, useActivateWorkflow, useWorkflowActivations } from '@/hooks/useWorkflows'

// ── Herramientas · Flujos ────────────────────────────────
// Vista educativa de las plantillas de automatización.
// El builder real vive en /automatizaciones — esta página
// presenta las plantillas en formato de catálogo con iconos.

const ICON_BY_SLUG: Record<string, typeof MessageSquare> = {
  'welcome-lead': MessageSquare,
  'cart-recovery': ShoppingCart,
  'post-sale': RefreshCw,
  'confirm-order': HeartHandshake,
  'reactivate': RefreshCw,
  'weekly-report': RefreshCw,
}

export default function FlujosPage() {
  const templatesQ = useWorkflowTemplates()
  const activationsQ = useWorkflowActivations()
  const activate = useActivateWorkflow()

  const templates = templatesQ.data?.items ?? []
  const activations = activationsQ.data?.items ?? []
  const activeIds = new Set(activations.map((a) => a.template.id))
  const loading = templatesQ.isLoading || activationsQ.isLoading

  return (
    <>
      <CommunityTopbar
        title="Flujos"
        subtitle="Automatiza tu comunicación con clientes — plantillas listas"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            Empieza con una plantilla oficial. Al activarla, aparece en{' '}
            <Link href="/automatizaciones" className="font-bold hover:underline" style={{ color: 'var(--vc-lime-main)' }}>
              Automatizaciones
            </Link>{' '}
            donde puedes pausar, retomar o borrar.
          </p>
          <Link
            href="/automatizaciones"
            className="vc-btn-primary flex items-center gap-2 text-xs"
          >
            <Zap size={14} /> Ver panel completo
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : templates.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            No hay plantillas disponibles aún
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {templates.map((t) => {
              const Icon = ICON_BY_SLUG[t.slug ?? ''] ?? MessageSquare
              const isActive = activeIds.has(t.id)
              return (
                <article key={t.id} className="vc-card group flex gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: 'rgba(198, 255, 60, 0.12)',
                      border: '1px solid rgba(198, 255, 60, 0.3)',
                    }}
                  >
                    {t.emoji ? (
                      <span className="text-2xl">{t.emoji}</span>
                    ) : (
                      <Icon size={22} color="var(--vc-lime-main)" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3
                        className="text-base font-bold"
                        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                      >
                        {t.name}
                      </h3>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                        style={{
                          background: 'var(--vc-black-soft)',
                          color: 'var(--vc-lime-main)',
                          border: '1px solid rgba(198, 255, 60, 0.3)',
                        }}
                      >
                        {t.category}
                      </span>
                      {t.impact && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                          style={{
                            background: 'rgba(198,255,60,0.08)',
                            color: 'var(--vc-lime-main)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {t.impact}
                        </span>
                      )}
                    </div>
                    <p
                      className="mb-3 text-xs leading-relaxed"
                      style={{ color: 'var(--vc-white-dim)' }}
                    >
                      {t.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px]"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                      >
                        {t.uses.toLocaleString('es-CO')} activaciones totales
                      </span>
                      {isActive ? (
                        <Link
                          href="/automatizaciones"
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:underline"
                          style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}
                        >
                          Ya activo <ArrowRight size={12} />
                        </Link>
                      ) : (
                        <button
                          onClick={() => activate.mutate(t.id)}
                          disabled={activate.isPending}
                          className="text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                          style={{
                            color: 'var(--vc-lime-main)',
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {activate.isPending && activate.variables === t.id ? 'Activando...' : 'Usar →'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div
          className="vc-card p-6 text-center"
          style={{ borderColor: 'rgba(198, 255, 60, 0.25)' }}
        >
          <Zap size={28} className="mx-auto mb-3" style={{ color: 'var(--vc-lime-main)' }} />
          <h3
            className="mb-1 text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            ¿Necesitas flujos personalizados?
          </h3>
          <p className="mb-4 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
            Pronto podrás armar tus propios flujos desde cero. Mientras tanto, las plantillas
            oficiales cubren los 6 casos más comunes de dropshipping en bienestar.
          </p>
          <Link
            href="/automatizaciones"
            className="inline-flex items-center gap-2 text-xs font-semibold hover:underline"
            style={{ color: 'var(--vc-lime-main)' }}
          >
            Ir a mi panel de Automatizaciones <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </>
  )
}
