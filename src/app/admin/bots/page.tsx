'use client'

import { useState } from 'react'
import {
  Bot, Package, AlertTriangle, Brain, UserX, Rocket, Play, Loader2,
  CheckCircle2, XCircle, Clock, Zap, RefreshCw,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useAdminBots, useRunBot,
  type BotName, type BotRun, type BotRunStatus,
} from '@/hooks/useAdminBots'

const BOT_META: Record<
  BotName,
  { label: string; icon: typeof Bot; color: string; bg: string; desc: string; schedule: string }
> = {
  ONBOARDING_BOT: {
    label: 'OnboardingBot', icon: Rocket,
    color: '#3CC6FF', bg: 'rgba(60,198,255,0.12)',
    desc: 'Guía los primeros 7 días del nuevo usuario',
    schedule: 'Diario · 14:00 UTC',
  },
  STOCK_BOT: {
    label: 'StockBot', icon: Package,
    color: '#FFB800', bg: 'rgba(255,184,0,0.12)',
    desc: 'Alerta stock bajo a dropshippers que venden el producto',
    schedule: 'Diario · 15:00 UTC',
  },
  RESTOCK_BOT: {
    label: 'RestockBot', icon: AlertTriangle,
    color: '#FF4757', bg: 'rgba(255,71,87,0.12)',
    desc: 'Notifica admins cuando cobertura <14 días',
    schedule: 'L/Mi/V · 16:00 UTC',
  },
  ADS_BOT: {
    label: 'AdsBot', icon: Brain,
    color: '#A855F7', bg: 'rgba(168,85,247,0.12)',
    desc: 'Dispara MediaBuyer para todos los usuarios con ads activas',
    schedule: 'Diario · 13:00 UTC',
  },
  INACTIVITY_BOT: {
    label: 'InactivityBot', icon: UserX,
    color: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.12)',
    desc: 'Reactiva dropshippers con 7+ días sin actividad',
    schedule: 'L/Mi/V · 17:00 UTC',
  },
}

const STATUS_META: Record<BotRunStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  SUCCESS: { label: 'OK', color: 'var(--vc-lime-main)', icon: CheckCircle2 },
  FAILED:  { label: 'FAIL', color: '#FF4757', icon: XCircle },
  PARTIAL: { label: 'PARCIAL', color: '#FFB800', icon: AlertTriangle },
  RUNNING: { label: 'CORRIENDO', color: '#3CC6FF', icon: Loader2 },
}

export default function AdminBotsPage() {
  const [days, setDays] = useState<7 | 30>(7)
  const { data, refetch } = useAdminBots(days)
  const runBot = useRunBot()

  async function handleRun(bot: BotName) {
    if (!confirm(`¿Disparar ${bot} manualmente? (respeta dedup de 24h)`)) return
    const res = await runBot.mutateAsync(bot)
    alert(`✅ ${res.status}\n\n${res.summary}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <AdminTopbar title="Bots Autónomos" subtitle="V23 · Ejecuciones background + triggers manuales" />

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Tarjetas de bots */}
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(BOT_META) as BotName[]).map((bot) => {
            const meta = BOT_META[bot]
            const Icon = meta.icon
            const stats = data?.byBot.filter((b) => b.bot === bot) ?? []
            const totalRuns = stats.reduce((s, x) => s + x._count, 0)
            const successRuns = stats.find((x) => x.status === 'SUCCESS')?._count ?? 0
            const notifsCreated = stats.reduce((s, x) => s + (x._sum.notifsCreated ?? 0), 0)

            return (
              <div
                key={bot}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--vc-black-mid)',
                  border: `1px solid ${meta.color}30`,
                }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: meta.bg }}
                    >
                      <Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <h3
                        className="text-[13px] font-bold"
                        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                      >
                        {meta.label}
                      </h3>
                      <p
                        className="text-[10px]"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                      >
                        {meta.schedule}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mb-3 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                  {meta.desc}
                </p>
                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Corridas" value={totalRuns} color="var(--vc-white-soft)" />
                  <Stat label="OK" value={successRuns} color="var(--vc-lime-main)" />
                  <Stat label="Notifs" value={notifsCreated} color={meta.color} />
                </div>
                <button
                  onClick={() => handleRun(bot)}
                  disabled={runBot.isPending && runBot.variables === bot}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-all disabled:opacity-50"
                  style={{
                    background: meta.bg,
                    color: meta.color,
                    border: `1px solid ${meta.color}40`,
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {runBot.isPending && runBot.variables === bot ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Play size={12} />
                  )}
                  EJECUTAR AHORA
                </button>
              </div>
            )
          })}
        </div>

        {/* Controles */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
          >
            Últimas corridas
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg p-1"
              style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className="rounded-md px-3 py-1 text-[11px] font-semibold"
                  style={{
                    background: days === d ? 'var(--vc-lime-main)' : 'transparent',
                    color: days === d ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
              style={{
                background: 'transparent',
                color: 'var(--vc-lime-main)',
                border: '1px solid rgba(198,255,60,0.3)',
              }}
            >
              <RefreshCw size={12} /> Refrescar
            </button>
          </div>
        </div>

        {/* Timeline corridas */}
        {!data || data.runs.length === 0 ? (
          <div
            className="rounded-xl py-10 text-center text-sm"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px dashed var(--vc-gray-dark)',
              color: 'var(--vc-white-dim)',
            }}
          >
            Aún no hay corridas registradas. Dispara un bot manualmente o espera al próximo cron.
          </div>
        ) : (
          <div className="space-y-2">
            {data.runs.map((run) => <BotRunRow key={run.id} run={run} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md py-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div
        className="text-[14px] font-black"
        style={{ color, fontFamily: 'var(--font-heading)' }}
      >
        {value}
      </div>
      <div
        className="text-[9px] uppercase"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </div>
    </div>
  )
}

function BotRunRow({ run }: { run: BotRun }) {
  const bot = BOT_META[run.bot]
  const status = STATUS_META[run.status]
  const BotIcon = bot.icon
  const StatusIcon = status.icon

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px]"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
        style={{ background: bot.bg }}
      >
        <BotIcon size={13} style={{ color: bot.color }} />
      </div>
      <div className="w-28 shrink-0">
        <p
          className="truncate text-[11px] font-bold"
          style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
        >
          {bot.label}
        </p>
        <p
          className="text-[9px]"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
        >
          {new Date(run.startedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          {' · '}{new Date(run.startedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="truncate text-[11px]"
          style={{ color: 'var(--vc-white-dim)' }}
        >
          {run.summary ?? '—'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1">
          <Clock size={10} style={{ color: 'var(--vc-gray-mid)' }} />
          <span
            className="text-[10px]"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
          >
            {run.durationMs != null ? `${run.durationMs}ms` : '—'}
          </span>
        </div>
        <span
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold"
          style={{
            background: `${status.color}20`,
            color: status.color,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <StatusIcon size={9} className={run.status === 'RUNNING' ? 'animate-spin' : ''} />
          {status.label}
        </span>
      </div>
    </div>
  )
}
