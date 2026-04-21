'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, TrendingUp, TrendingDown, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminHealthScores, SEGMENT_META, type HealthSegment } from '@/hooks/useHealthScore'

const SEGMENTS: HealthSegment[] = ['ACTIVE', 'AT_RISK', 'CHURNED', 'NEW']

export default function AdminHealthPage() {
  const [segment, setSegment] = useState<HealthSegment | null>(null)
  const q = useAdminHealthScores(segment)

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title="Health score de la comunidad" subtitle="Monitorea VITALCOMMERS en riesgo" />

      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        {/* Counts — todos los segmentos */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SEGMENTS.map(s => {
            const meta = SEGMENT_META[s]
            const count = q.data?.counts?.[s] ?? 0
            const active = segment === s
            return (
              <button
                key={s}
                onClick={() => setSegment(active ? null : s)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/10'
                    : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] hover:border-[var(--vc-lime-main)]/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: meta.color }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
                    {meta.label}
                  </span>
                </div>
                <div
                  className="mt-1 text-2xl font-black"
                  style={{ color: meta.color, fontFamily: 'var(--font-display)' }}
                >
                  {count}
                </div>
              </button>
            )
          })}
        </div>

        {segment && (
          <div className="mb-3 flex items-center gap-2 text-[11px] text-[var(--vc-white-dim)]">
            Filtro: <strong>{SEGMENT_META[segment].label}</strong>
            <button
              onClick={() => setSegment(null)}
              className="text-[var(--vc-lime-main)] hover:underline"
            >
              Limpiar
            </button>
          </div>
        )}

        {/* Loading */}
        {q.isLoading && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-8 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
            <div className="text-xs text-[var(--vc-white-dim)]">Cargando scores…</div>
          </div>
        )}

        {/* Empty */}
        {!q.isLoading && (q.data?.items?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-8 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-[var(--vc-gray-mid)]" />
            <div className="text-sm text-[var(--vc-white-soft)]">Sin resultados en este segmento</div>
            <div className="mt-1 text-xs text-[var(--vc-white-dim)]">
              El cron diario recalcula todos los scores — revisa de nuevo mañana.
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {q.data?.items?.map(row => {
            const meta = SEGMENT_META[row.segment]
            const delta = row.scoreDelta ?? 0
            return (
              <div
                key={row.id}
                className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Score circle */}
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-bold"
                      style={{
                        background: `${meta.color}15`,
                        color: meta.color,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {row.score}
                    </div>

                    {/* User */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-[var(--vc-white-soft)]">
                          {row.user.name || row.user.email}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                          style={{ background: `${meta.color}20`, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        {delta !== 0 && (
                          <span
                            className="flex items-center gap-0.5 rounded bg-[var(--vc-black-soft)] px-1 py-0.5 text-[9px] font-bold"
                            style={{ color: delta > 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}
                          >
                            {delta > 0 ? (
                              <TrendingUp className="h-2 w-2" />
                            ) : (
                              <TrendingDown className="h-2 w-2" />
                            )}
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        )}
                        {row.user.country && (
                          <span className="rounded bg-[var(--vc-black-soft)] px-1.5 py-0.5 text-[9px] text-[var(--vc-white-dim)]">
                            {row.user.country}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[var(--vc-white-dim)]">
                        {row.user.email} · Último cálculo{' '}
                        {new Date(row.computedAt).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/clientes?userId=${row.userId}`}
                    className="flex flex-shrink-0 items-center gap-1 rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--vc-white-soft)] hover:border-[var(--vc-lime-main)]/40"
                  >
                    Ver
                    <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>

                {/* Breakdown compact */}
                <div className="mt-2 grid grid-cols-7 gap-1 border-t border-[var(--vc-gray-dark)]/40 pt-2">
                  {Object.entries(row.breakdown).map(([factor, v]) => (
                    <div key={factor} className="text-center">
                      <div className="text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">
                        {factor.slice(0, 6)}
                      </div>
                      <div
                        className="text-xs font-bold"
                        style={{ color: 'var(--vc-white-soft)' }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-lg border border-[var(--vc-info)]/30 bg-[var(--vc-info)]/5 p-3 text-[11px] text-[var(--vc-info)]">
          <Heart className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <div>
            <strong>Retención automática:</strong> cuando un miembro cae de ACTIVE → AT_RISK o
            AT_RISK → CHURNED, el sistema dispara una notificación de retención y marca{' '}
            <code>lastRetentionTriggerAt</code>. El cron corre a las 4am diariamente.
          </div>
        </div>
      </div>
    </div>
  )
}
