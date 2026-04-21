'use client'

import { useMemo, useState } from 'react'
import {
  Bell, BellOff, Plus, Trash2, Loader2, Zap, MessageCircle,
  CheckCircle2, Clock, AlertTriangle, Play,
} from 'lucide-react'
import {
  useAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert, useTestAlert,
  ALERT_TYPE_META, type AlertType, type AlertChannel, type ProactiveAlert,
} from '@/hooks/useAlerts'

const TYPE_COLOR: Record<AlertType, string> = {
  STOCK_LOW:        '#FFB800',
  ORDER_DISPATCHED: '#3CC6FF',
  ORDER_DELIVERED:  '#C6FF3C',
  DAILY_SUMMARY:    '#9C27B0',
  ROAS_DROP:        '#FF4757',
}

const CHANNEL_LABEL: Record<AlertChannel, string> = {
  IN_APP:   'In-app',
  WHATSAPP: 'WhatsApp',
  BOTH:     'Ambos',
}

export default function AlertasPage() {
  const alertsQ = useAlerts()
  const createM = useCreateAlert()
  const updateM = useUpdateAlert()
  const deleteM = useDeleteAlert()
  const testM = useTestAlert()

  const alerts = useMemo(() => alertsQ.data?.items ?? [], [alertsQ.data])
  const existingTypes = useMemo(() => new Set(alerts.map(a => a.type)), [alerts])
  const missingTypes = useMemo(
    () => (Object.keys(ALERT_TYPE_META) as AlertType[]).filter(t => !existingTypes.has(t)),
    [existingTypes],
  )

  const [testResult, setTestResult] = useState<{ alertId: string; fired: boolean; title?: string; body?: string } | null>(null)

  const handleCreate = async (type: AlertType) => {
    const meta = ALERT_TYPE_META[type]
    await createM.mutateAsync({
      type,
      channel: 'IN_APP',
      enabled: true,
      config: meta.defaultConfig,
      cooldownMinutes: meta.defaultCooldownMinutes,
    })
  }

  const handleToggle = async (a: ProactiveAlert) => {
    await updateM.mutateAsync({ id: a.id, data: { enabled: !a.enabled } })
  }

  const handleChannel = async (a: ProactiveAlert, channel: AlertChannel) => {
    await updateM.mutateAsync({ id: a.id, data: { channel } })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta alerta?')) return
    await deleteM.mutateAsync(id)
  }

  const handleTest = async (id: string) => {
    const r = await testM.mutateAsync(id)
    setTestResult({
      alertId: id,
      fired: r.fired,
      title: r.occurrence?.title,
      body: r.occurrence?.body,
    })
  }

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
            >
              Alertas proactivas
            </h1>
            <p className="mt-1 text-sm text-[var(--vc-white-dim)]">
              Recibe avisos automáticos cuando pasa algo importante en tu tienda.
              Configura por qué quieres ser notificado y cómo.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/5 px-3 py-2 text-center">
            <div className="text-2xl font-black text-[var(--vc-lime-main)]">{alerts.filter(a => a.enabled).length}</div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">activas</div>
          </div>
        </div>

        {/* Test result banner */}
        {testResult && (
          <div
            className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${
              testResult.fired
                ? 'border-[var(--vc-lime-main)]/40 bg-[var(--vc-lime-main)]/10 text-[var(--vc-lime-main)]'
                : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] text-[var(--vc-white-dim)]'
            }`}
          >
            <div className="flex-1">
              {testResult.fired ? (
                <>
                  <strong>Se dispararía:</strong> {testResult.title}
                  {testResult.body && <div className="mt-1 text-[var(--vc-white-soft)]">{testResult.body}</div>}
                </>
              ) : (
                <>
                  <strong>No hay condiciones para disparar esta alerta ahora mismo.</strong>
                  <span className="ml-1 text-[var(--vc-gray-mid)]">Todo está en orden, no hay nada que avisar.</span>
                </>
              )}
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading */}
        {alertsQ.isLoading && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 text-center text-xs text-[var(--vc-white-dim)]">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Cargando tus alertas…
          </div>
        )}

        {/* Active alerts */}
        {!alertsQ.isLoading && alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
              Configuradas
            </div>
            {alerts.map(a => {
              const meta = ALERT_TYPE_META[a.type]
              const color = TYPE_COLOR[a.type]
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3 transition ${
                    a.enabled
                      ? 'border-[var(--vc-lime-main)]/25 bg-[var(--vc-black-mid)]'
                      : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-[var(--vc-white-soft)]">{meta.label}</span>
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            {a.type.replace(/_/g, ' ')}
                          </span>
                          {a.lastTriggeredAt && (
                            <span className="flex items-center gap-1 rounded bg-[var(--vc-black-soft)] px-1.5 py-0.5 text-[9px] text-[var(--vc-gray-mid)]">
                              <Clock className="h-2.5 w-2.5" />
                              último {new Date(a.lastTriggeredAt).toLocaleDateString('es-CO')}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[var(--vc-white-dim)]">{meta.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--vc-gray-mid)]">
                          <span>Cooldown: {a.cooldownMinutes >= 60 ? `${Math.round(a.cooldownMinutes / 60)}h` : `${a.cooldownMinutes}min`}</span>
                          <span>·</span>
                          <span>
                            Config:{' '}
                            <code className="font-mono text-[var(--vc-white-dim)]">
                              {Object.entries(a.config ?? {})
                                .map(([k, v]) => `${k}=${v}`)
                                .join(' ') || 'default'}
                            </code>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleTest(a.id)}
                        title="Probar evaluación ahora"
                        className="rounded-md border border-[var(--vc-info)]/30 bg-[var(--vc-info)]/5 p-1.5 text-[var(--vc-info)] hover:bg-[var(--vc-info)]/10"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggle(a)}
                        title={a.enabled ? 'Desactivar' : 'Activar'}
                        className="rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-1.5 text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/40"
                      >
                        {a.enabled ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="rounded-md border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/5 p-1.5 text-[var(--vc-error)] hover:bg-[var(--vc-error)]/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Channel selector */}
                  <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--vc-gray-dark)]/40 pt-2">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">Canal:</span>
                    {(['IN_APP', 'WHATSAPP', 'BOTH'] as AlertChannel[]).map(ch => {
                      const active = a.channel === ch
                      const Icon = ch === 'WHATSAPP' ? MessageCircle : ch === 'BOTH' ? Zap : Bell
                      return (
                        <button
                          key={ch}
                          onClick={() => handleChannel(a, ch)}
                          className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold transition ${
                            active
                              ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/15 text-[var(--vc-lime-main)]'
                              : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/30'
                          }`}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {CHANNEL_LABEL[ch]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Missing types — add */}
        {!alertsQ.isLoading && missingTypes.length > 0 && (
          <div className="rounded-xl border border-dashed border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]/50 p-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
              Disponibles
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {missingTypes.map(type => {
                const meta = ALERT_TYPE_META[type]
                const color = TYPE_COLOR[type]
                return (
                  <button
                    key={type}
                    onClick={() => handleCreate(type)}
                    disabled={createM.isPending}
                    className="group flex items-start gap-2 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-3 text-left transition hover:border-[var(--vc-lime-main)]/40"
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--vc-white-soft)]">
                        {meta.label}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[var(--vc-white-dim)]">{meta.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!alertsQ.isLoading && alerts.length === 0 && missingTypes.length === 0 && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[var(--vc-lime-main)]" />
            <div className="text-sm font-bold text-[var(--vc-white-soft)]">Todas las alertas configuradas</div>
            <div className="mt-1 text-xs text-[var(--vc-white-dim)]">
              Puedes pausar o editar cada una arriba.
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]/50 p-3 text-[11px] text-[var(--vc-white-dim)]">
          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-[var(--vc-gray-mid)]" />
          <div>
            Las alertas se evalúan cada hora. Para recibir por WhatsApp, registra tu teléfono en tu perfil
            y conecta una cuenta WhatsApp Business. Mientras tanto, las alertas in-app aparecen en la campanita.
          </div>
        </div>
      </div>
    </div>
  )
}
