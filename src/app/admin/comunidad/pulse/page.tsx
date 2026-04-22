'use client'

import Link from 'next/link'
import {
  Heart, TrendingUp, TrendingDown, AlertTriangle, Users,
  Activity, Loader2, ExternalLink,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useCommunityPulse, type SegmentDistributionRow, type MoverRow, type AtRiskRow } from '@/hooks/useCommunityPulse'

// Community Pulse — CEO vista agregada de la comunidad VITALCOMMERS

const SEGMENT_META: Record<string, { label: string; color: string }> = {
  NEW:     { label: 'Nuevos',      color: '#3CC6FF' },
  ACTIVE:  { label: 'Activos',     color: '#C6FF3C' },
  AT_RISK: { label: 'En riesgo',   color: '#FFB800' },
  CHURNED: { label: 'Inactivos',   color: '#FF4757' },
}

function formatMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return String(Math.round(v))
}

export default function CommunityPulsePage() {
  const { data, isLoading, isError } = useCommunityPulse()

  return (
    <>
      <AdminTopbar
        title="Community Pulse"
        subtitle="Vista CEO · Salud agregada de los VITALCOMMERS esta semana"
      />
      <div className="flex-1 space-y-6 p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-[var(--vc-error)]/30 bg-[var(--vc-black-mid)] p-6 text-center">
            <p className="text-sm text-[var(--vc-white-dim)]">
              No se pudo cargar el pulse. Reintenta en unos segundos.
            </p>
          </div>
        )}

        {data && (
          <>
            {/* KPIs superiores */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="VITALCOMMERS activos"
                value={data.totalActive.toString()}
                icon={<Users size={16} />}
                hint="con Health Score"
              />
              <KpiCard
                label="Insights esta semana"
                value={`${data.totalInsightsThisWeek}`}
                icon={<Activity size={16} />}
                hint={`${data.coverage.coverage}% cobertura`}
                accent={data.coverage.label === 'excelente' ? 'green' : data.coverage.label === 'alto' ? 'green' : data.coverage.label === 'medio' ? 'yellow' : 'red'}
              />
              <KpiCard
                label="Revenue comunidad"
                value={formatMoney(data.totalRevenueThisWeek)}
                icon={<TrendingUp size={16} />}
                hint="suma todos los VITALCOMMERS"
              />
              <KpiCard
                label="At-risk a intervenir"
                value={`${data.atRisk.length}`}
                icon={<AlertTriangle size={16} />}
                hint="top prioridad"
                accent={data.atRisk.length > 5 ? 'yellow' : 'green'}
              />
            </div>

            {/* Distribución por segment */}
            <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6">
              <h2
                className="mb-4 text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}
              >
                Distribución por salud
              </h2>
              <SegmentBar distribution={data.segmentDistribution} />
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {data.segmentDistribution.map(s => (
                  <SegmentStat key={s.segment} row={s} />
                ))}
              </div>
            </div>

            {/* Top movers */}
            <div className="grid gap-6 lg:grid-cols-2">
              <MoversList title="Top subiendo" items={data.topUp} direction="up" />
              <MoversList title="Top cayendo" items={data.topDown} direction="down" />
            </div>

            {/* At-risk para intervención */}
            <div className="rounded-xl border border-[var(--vc-warning)]/25 bg-[var(--vc-black-mid)] p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: 'var(--vc-warning)' }} />
                <h2
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--vc-warning)', fontFamily: 'var(--font-mono)' }}
                >
                  A intervenir (ordenado por prioridad)
                </h2>
              </div>
              {data.atRisk.length === 0 ? (
                <p className="text-xs text-[var(--vc-gray-mid)]">
                  Nadie en riesgo esta semana — todo bajo control.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.atRisk.map(u => (
                    <AtRiskRow key={u.userId} user={u} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function KpiCard({
  label, value, icon, hint, accent,
}: {
  label: string; value: string; icon: React.ReactNode; hint?: string
  accent?: 'green' | 'yellow' | 'red'
}) {
  const borderColor =
    accent === 'green'  ? 'rgba(198,255,60,0.35)' :
    accent === 'yellow' ? 'rgba(255,184,0,0.35)' :
    accent === 'red'    ? 'rgba(255,71,87,0.35)' :
    'var(--vc-gray-dark)'

  return (
    <div
      className="rounded-xl border bg-[var(--vc-black-mid)] p-4"
      style={{ borderColor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--vc-black-soft)]" style={{ color: 'var(--vc-lime-main)' }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-wider text-[var(--vc-gray-mid)]">
        {label}
      </div>
      <div
        className="mt-0.5 text-2xl font-black"
        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}
      >
        {value}
      </div>
      {hint && <div className="text-[10px] text-[var(--vc-white-dim)]">{hint}</div>}
    </div>
  )
}

function SegmentBar({ distribution }: { distribution: SegmentDistributionRow[] }) {
  const total = distribution.reduce((sum, s) => sum + s.count, 0)
  if (total === 0) {
    return <div className="text-xs text-[var(--vc-gray-mid)]">Sin datos aún.</div>
  }
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-[var(--vc-black-soft)]">
      {distribution.map(s => (
        <div
          key={s.segment}
          title={`${SEGMENT_META[s.segment]?.label ?? s.segment} · ${s.percentage}%`}
          style={{
            width: `${s.percentage}%`,
            background: SEGMENT_META[s.segment]?.color ?? 'var(--vc-gray-mid)',
          }}
        />
      ))}
    </div>
  )
}

function SegmentStat({ row }: { row: SegmentDistributionRow }) {
  const meta = SEGMENT_META[row.segment] ?? { label: row.segment, color: 'var(--vc-gray-mid)' }
  return (
    <div className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: meta.color }}
        />
        <span className="text-[10px] uppercase tracking-wider text-[var(--vc-white-dim)]">
          {meta.label}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}>
          {row.count}
        </span>
        <span className="text-xs text-[var(--vc-gray-mid)]">{row.percentage}%</span>
      </div>
    </div>
  )
}

function MoversList({
  title, items, direction,
}: {
  title: string; items: MoverRow[]; direction: 'up' | 'down'
}) {
  const Icon = direction === 'up' ? TrendingUp : TrendingDown
  const color = direction === 'up' ? 'var(--vc-lime-main)' : 'var(--vc-error)'

  return (
    <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <h3
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color, fontFamily: 'var(--font-mono)' }}
        >
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--vc-gray-mid)]">
          Sin movimientos significativos.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map(m => (
            <div
              key={m.userId}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[var(--vc-white-soft)]">
                  {m.userName}
                </div>
                <div className="text-[10px] text-[var(--vc-gray-mid)]">
                  {SEGMENT_META[m.segment ?? '']?.label ?? 'Sin segmento'} · {formatMoney(m.revenue)}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold" style={{ color, fontFamily: 'var(--font-mono)' }}>
                  {m.revenueDeltaPct > 0 ? '+' : ''}{m.revenueDeltaPct.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AtRiskRow({ user }: { user: AtRiskRow }) {
  const segColor =
    user.segment === 'CHURNED' ? 'var(--vc-error)' :
    user.segment === 'AT_RISK' ? 'var(--vc-warning)' :
    'var(--vc-gray-mid)'
  const weightLabel =
    user.weight >= 8 ? 'URGENTE' :
    user.weight >= 5 ? 'ALTA' :
    user.weight >= 3 ? 'MEDIA' : 'BAJA'

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Heart size={11} style={{ color: segColor }} />
          <span className="truncate text-xs font-bold text-[var(--vc-white-soft)]">
            {user.userName}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: `${segColor}20`, color: segColor }}
          >
            {weightLabel}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] text-[var(--vc-white-dim)]">
          {user.reason} · score {user.healthScore} · {formatMoney(user.revenue)}
        </div>
      </div>
      <Link
        href={`/admin/comunidad/${user.userId}`}
        className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--vc-white-dim)] transition hover:border-[var(--vc-lime-main)]/40 hover:text-[var(--vc-lime-main)]"
      >
        Ver
        <ExternalLink size={10} />
      </Link>
    </div>
  )
}
