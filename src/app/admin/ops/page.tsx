'use client'

import {
  Activity, Bot, Workflow as WorkflowIcon, ShieldAlert, Zap, Database,
  Phone, CheckCircle2, XCircle, Loader2, AlertTriangle, Cpu, MessageSquare,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useOpsHealth } from '@/hooks/useOpsHealth'

export default function AdminOpsPage() {
  const healthQ = useOpsHealth()
  const data = healthQ.data

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title="Salud del sistema" subtitle="Observabilidad y feature flags" />

      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        {healthQ.isLoading && !data && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-8 text-center text-sm text-[var(--vc-white-dim)]">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
            Cargando métricas…
          </div>
        )}

        {data && (
          <>
            {/* Feature flags */}
            <section className="mb-5">
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Feature flags
              </h2>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <FlagCard
                  label="WhatsApp MOCK"
                  enabled={data.featureFlags.whatsappMockMode}
                  helpEnabled="Envíos se loguean pero no llegan"
                  helpDisabled="Producción real via Meta Cloud API"
                  invert
                />
                <FlagCard
                  label="Anthropic (Claude)"
                  enabled={data.featureFlags.anthropicEnabled}
                  helpEnabled="Razonamiento con Claude Haiku 4.5"
                  helpDisabled="Solo OpenAI"
                />
                <FlagCard
                  label="Embeddings"
                  enabled={data.featureFlags.embeddingsEnabled}
                  helpEnabled="Cache semántico + memoria larga"
                  helpDisabled="Solo match exacto + keyword"
                />
              </div>
            </section>

            {/* KPIs principales */}
            <section className="mb-5">
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Métricas operativas
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <KpiCard
                  Icon={Bot}
                  label="Bots 24h"
                  value={`${data.bots24h.success}/${data.bots24h.total}`}
                  hint={`${data.bots24h.failed} fallidos`}
                  color={data.bots24h.failed === 0 ? '#C6FF3C' : '#FFB800'}
                />
                <KpiCard
                  Icon={WorkflowIcon}
                  label="Workflows"
                  value={`${data.workflows.runningNow} activos`}
                  hint={`${data.workflows.active} totales`}
                  color="#3CC6FF"
                />
                <KpiCard
                  Icon={ShieldAlert}
                  label="Escalaciones"
                  value={String(data.escalations.open)}
                  hint="abiertas + en curso"
                  color={data.escalations.open > 0 ? '#FF4757' : '#C6FF3C'}
                />
                <KpiCard
                  Icon={MessageSquare}
                  label="Chat 24h"
                  value={String(data.conversations24h)}
                  hint="threads activos"
                  color="#B388FF"
                />
              </div>
            </section>

            {/* Router health */}
            <section className="mb-5">
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                LLM Router
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <CircuitCard
                  label="OpenAI"
                  circuit={data.router.circuits.openai}
                />
                <CircuitCard
                  label="Anthropic"
                  circuit={data.router.circuits.anthropic}
                  disabled={!data.featureFlags.anthropicEnabled}
                />
              </div>
            </section>

            {/* Cache + memoria */}
            <section className="mb-5">
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                Cache y memoria
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <KpiCard
                  Icon={Database}
                  label="Entradas cache"
                  value={String(data.cache.entries)}
                  hint="activas"
                  color="#C6FF3C"
                />
                <KpiCard
                  Icon={Zap}
                  label="Hits cache"
                  value={String(data.cache.totalHits)}
                  hint={`~$${(data.cache.totalHits * 0.001).toFixed(2)} USD ahorrados`}
                  color="#C6FF3C"
                />
                <KpiCard
                  Icon={Cpu}
                  label="Memorias embeb."
                  value={String(data.cache.userMemoriesWithEmbedding)}
                  hint="usuarios con memoria larga"
                  color="#B388FF"
                />
              </div>
            </section>

            {/* WhatsApp */}
            <section className="mb-5">
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                WhatsApp Commerce
              </h2>
              <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--vc-lime-main)]/10">
                      <Phone className="h-5 w-5 text-[var(--vc-lime-main)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--vc-white-soft)]">
                        {data.whatsapp.activeAccounts} cuentas activas
                      </div>
                      <div className="text-[11px] text-[var(--vc-white-dim)]">
                        {Object.entries(data.whatsapp.webhookEvents24h).length === 0
                          ? 'Sin eventos webhook últimas 24h'
                          : Object.entries(data.whatsapp.webhookEvents24h).map(([source, n]) => `${source}: ${n}`).join(' · ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Timestamp */}
            <div className="text-center text-[10px] text-[var(--vc-gray-mid)]">
              Actualizado {new Date(data.timestamp).toLocaleString('es-CO')} · auto-refresh 30s
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FlagCard({ label, enabled, helpEnabled, helpDisabled, invert }: {
  label: string
  enabled: boolean
  helpEnabled: string
  helpDisabled: string
  invert?: boolean
}) {
  // `invert` para flags donde "enabled" significa estado malo (como MOCK en producción)
  const isHealthy = invert ? !enabled : enabled
  const color = isHealthy ? '#C6FF3C' : '#FFB800'
  const Icon = enabled ? CheckCircle2 : XCircle

  return (
    <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
            {label}
          </div>
          <div className="mt-0.5 text-sm font-semibold" style={{ color }}>
            {enabled ? 'ON' : 'OFF'}
          </div>
          <div className="text-[10px] text-[var(--vc-gray-mid)]">
            {enabled ? helpEnabled : helpDisabled}
          </div>
        </div>
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color }} />
      </div>
    </div>
  )
}

function KpiCard({ Icon, label, value, hint, color }: {
  Icon: typeof Activity
  label: string
  value: string
  hint?: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="h-3 w-3" style={{ color }} />
        <span className="text-[9px] uppercase tracking-wider text-[var(--vc-white-dim)]">
          {label}
        </span>
      </div>
      <div className="text-lg font-bold text-[var(--vc-white-soft)]">{value}</div>
      {hint && <div className="text-[9px] text-[var(--vc-gray-mid)]">{hint}</div>}
    </div>
  )
}

function CircuitCard({ label, circuit, disabled }: {
  label: string
  circuit: { failures: number; lastFailAt: number; open: boolean }
  disabled?: boolean
}) {
  const isOk = !circuit.open && circuit.failures < 3
  return (
    <div
      className={`rounded-xl border p-3 ${
        disabled
          ? 'border-[var(--vc-gray-dark)]/40 bg-[var(--vc-black-mid)]/40'
          : circuit.open
          ? 'border-[var(--vc-error)]/40 bg-[var(--vc-error)]/5'
          : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--vc-white-soft)]">{label}</div>
          <div className="text-[10px] text-[var(--vc-white-dim)]">
            {disabled
              ? 'No configurado · fallback a OpenAI'
              : circuit.open
              ? 'Circuit abierto · pausado 60s'
              : circuit.failures > 0
              ? `${circuit.failures} fallos recientes`
              : 'Operando normal'}
          </div>
        </div>
        {disabled
          ? <AlertTriangle className="h-4 w-4 text-[var(--vc-gray-mid)]" />
          : isOk
          ? <CheckCircle2 className="h-4 w-4 text-[var(--vc-lime-main)]" />
          : <XCircle className="h-4 w-4 text-[var(--vc-error)]" />}
      </div>
    </div>
  )
}
