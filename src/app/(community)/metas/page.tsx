'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Target, TrendingUp, TrendingDown, Trophy, Users, Zap, Loader2,
  CheckCircle2, Clock, Award, DollarSign, ShoppingCart, BarChart3,
  Flame, ArrowRight, Edit3,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useCurrentGoal, useSetGoal } from '@/hooks/useGoals'
import { useBenchmarks, type MetricBenchmark, type PercentileRank } from '@/hooks/useBenchmarks'

// ── V24 — Metas mensuales + Benchmarks comunidad ─────────
// El dropshipper define su meta, ve su progreso proyectado y
// se compara contra el agregado anónimo de la comunidad.
// Principio: 0 cobro, solo motivación + FOMO saludable.

const RANK_META: Record<
  PercentileRank,
  { label: string; color: string; bg: string; emoji: string }
> = {
  top_10:   { label: 'Top 10%', color: 'var(--vc-lime-main)', bg: 'rgba(198,255,60,0.15)', emoji: '🏆' },
  top_25:   { label: 'Top 25%', color: '#3CC6FF', bg: 'rgba(60,198,255,0.15)', emoji: '⭐' },
  top_50:   { label: 'Top 50%', color: '#FFB800', bg: 'rgba(255,184,0,0.15)', emoji: '📈' },
  below_50: { label: 'Debajo del 50%', color: 'var(--vc-gray-mid)', bg: 'rgba(128,128,128,0.12)', emoji: '🌱' },
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n === 0) return '$0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${Math.round(n)}%`
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function MetasPage() {
  const goalQ = useCurrentGoal()
  const benchQ = useBenchmarks()
  const setGoalMut = useSetGoal()

  const [editing, setEditing] = useState(false)
  const [targetRevenue, setTargetRevenue] = useState('')
  const [targetOrders, setTargetOrders] = useState('')
  const [stretchRevenue, setStretchRevenue] = useState('')

  const data = goalQ.data
  const bench = benchQ.data

  const achieved = data && data.goal && data.progressPct.revenue >= 100

  async function handleSave() {
    const parsed = parseInt(targetRevenue.replace(/\D/g, ''))
    if (!parsed || parsed < 100_000) {
      alert('La meta mínima es $100.000 COP')
      return
    }
    await setGoalMut.mutateAsync({
      targetRevenue: parsed,
      targetOrders: targetOrders ? parseInt(targetOrders) : undefined,
      stretchRevenue: stretchRevenue
        ? parseInt(stretchRevenue.replace(/\D/g, ''))
        : undefined,
    })
    setEditing(false)
  }

  function startEdit() {
    if (data?.goal) {
      setTargetRevenue(String(data.goal.targetRevenue))
      setTargetOrders(data.goal.targetOrders?.toString() ?? '')
      setStretchRevenue(data.goal.stretchRevenue?.toString() ?? '')
    }
    setEditing(true)
  }

  const now = new Date()
  const monthLabel = MONTH_NAMES[now.getMonth()]

  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunityTopbar
        title="Metas mensuales"
        subtitle="Define tu objetivo, mira tu progreso y compárate con la comunidad"
      />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(198,255,60,0.08) 0%, rgba(255,184,0,0.05) 100%)',
          borderBottom: '1px solid rgba(198,255,60,0.15)',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: 'var(--vc-gradient-primary)',
                boxShadow: '0 0 28px var(--vc-glow-lime)',
              }}
            >
              <Target size={20} style={{ color: 'var(--vc-black)' }} />
            </div>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                background: 'var(--vc-lime-main)',
                color: 'var(--vc-black)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              V24 · META + BENCHMARKS
            </span>
          </div>
          <h1
            className="text-3xl font-black"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            Tu meta de {monthLabel}
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--vc-white-dim)' }}>
            Apunta alto, mide tu ritmo y ve cómo te comparas con el resto de VITALCOMMERS.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {goalQ.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : !data?.goal && !editing ? (
          <NoGoalCard onSet={startEdit} />
        ) : editing ? (
          <EditGoalCard
            targetRevenue={targetRevenue}
            setTargetRevenue={setTargetRevenue}
            targetOrders={targetOrders}
            setTargetOrders={setTargetOrders}
            stretchRevenue={stretchRevenue}
            setStretchRevenue={setStretchRevenue}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={setGoalMut.isPending}
          />
        ) : (
          <GoalProgressCard data={data!} achieved={!!achieved} onEdit={startEdit} />
        )}

        {/* Benchmarks */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Users size={14} style={{ color: 'var(--vc-lime-main)' }} />
            <h2
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
            >
              Cómo te comparas con la comunidad
            </h2>
            <div
              className="ml-2 h-px flex-1"
              style={{
                background:
                  'linear-gradient(90deg, rgba(198,255,60,0.4) 0%, transparent 100%)',
              }}
            />
          </div>

          {benchQ.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={20}
                className="animate-spin"
                style={{ color: 'var(--vc-lime-main)' }}
              />
            </div>
          ) : bench ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <BenchmarkCard
                label="Revenue últimos 30d"
                metric={bench.revenue30d}
                fmt={fmtMoney}
                icon={DollarSign}
              />
              <BenchmarkCard
                label="Pedidos últimos 30d"
                metric={bench.orders30d}
                fmt={(n) => (n == null ? '—' : String(Math.round(n)))}
                icon={ShoppingCart}
              />
              <BenchmarkCard
                label="Margen neto %"
                metric={bench.marginPct30d}
                fmt={fmtPct}
                icon={BarChart3}
              />
              <BenchmarkCard
                label="ROAS"
                metric={bench.roas30d}
                fmt={(n) => (n == null ? '—' : `${n.toFixed(2)}x`)}
                icon={Zap}
              />
            </div>
          ) : null}
        </div>

        <div
          className="rounded-xl p-4 text-[12px]"
          style={{
            background: 'rgba(198,255,60,0.04)',
            border: '1px dashed rgba(198,255,60,0.2)',
            color: 'var(--vc-white-dim)',
          }}
        >
          🔒 <strong>Privacidad:</strong> los benchmarks son 100% anónimos. Nunca
          mostramos datos personales de otros VITALCOMMERS — solo agregados
          numéricos. Tu información también se agrega, nunca se expone.
        </div>
      </div>
    </div>
  )
}

function NoGoalCard({ onSet }: { onSet: () => void }) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl px-8 py-14 text-center"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px dashed rgba(198,255,60,0.3)',
      }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: 'var(--vc-gradient-primary)',
          boxShadow: '0 0 32px var(--vc-glow-lime)',
        }}
      >
        <Target size={28} style={{ color: 'var(--vc-black)' }} />
      </div>
      <h3
        className="mb-2 text-xl font-bold"
        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
      >
        Aún no tienes meta este mes
      </h3>
      <p className="mb-5 max-w-md text-[13px]" style={{ color: 'var(--vc-white-dim)' }}>
        Los dropshippers con meta venden 2.3x más que los que no.
        Define un objetivo ambicioso pero alcanzable para este mes —
        el Command Center priorizará tus acciones IA hacia esa meta.
      </p>
      <button
        onClick={onSet}
        className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold"
        style={{
          background: 'var(--vc-gradient-primary)',
          color: 'var(--vc-black)',
          fontFamily: 'var(--font-heading)',
          boxShadow: '0 0 24px var(--vc-glow-lime)',
          letterSpacing: '0.03em',
        }}
      >
        <Target size={16} /> DEFINIR META
      </button>
    </div>
  )
}

function EditGoalCard({
  targetRevenue, setTargetRevenue,
  targetOrders, setTargetOrders,
  stretchRevenue, setStretchRevenue,
  onSave, onCancel, saving,
}: {
  targetRevenue: string
  setTargetRevenue: (s: string) => void
  targetOrders: string
  setTargetOrders: (s: string) => void
  stretchRevenue: string
  setStretchRevenue: (s: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198,255,60,0.25)',
      }}
    >
      <h3
        className="mb-4 text-lg font-bold"
        style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
      >
        Tu meta de este mes
      </h3>
      <div className="space-y-4">
        <Field label="Revenue objetivo (COP) · mínimo $100.000" required>
          <input
            type="text"
            value={targetRevenue}
            onChange={(e) => setTargetRevenue(e.target.value.replace(/\D/g, ''))}
            placeholder="5000000"
            className="w-full rounded-lg bg-transparent px-3 py-2 text-[14px] outline-none"
            style={{
              color: 'var(--vc-white-soft)',
              border: '1px solid var(--vc-gray-dark)',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </Field>
        <Field label="Pedidos objetivo (opcional)">
          <input
            type="text"
            value={targetOrders}
            onChange={(e) => setTargetOrders(e.target.value.replace(/\D/g, ''))}
            placeholder="200"
            className="w-full rounded-lg bg-transparent px-3 py-2 text-[14px] outline-none"
            style={{
              color: 'var(--vc-white-soft)',
              border: '1px solid var(--vc-gray-dark)',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </Field>
        <Field label="Meta estirada (stretch, opcional)">
          <input
            type="text"
            value={stretchRevenue}
            onChange={(e) => setStretchRevenue(e.target.value.replace(/\D/g, ''))}
            placeholder="8000000"
            className="w-full rounded-lg bg-transparent px-3 py-2 text-[14px] outline-none"
            style={{
              color: 'var(--vc-white-soft)',
              border: '1px solid var(--vc-gray-dark)',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </Field>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-[12px] font-bold disabled:opacity-50"
          style={{
            background: 'var(--vc-gradient-primary)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 0 16px var(--vc-glow-lime)',
          }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
          GUARDAR META
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-[12px] font-semibold"
          style={{
            background: 'transparent',
            color: 'var(--vc-gray-mid)',
            border: '1px solid var(--vc-gray-dark)',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="mb-1 block text-[11px] font-semibold"
        style={{ color: 'var(--vc-white-dim)' }}
      >
        {label} {required && <span style={{ color: '#FF4757' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function GoalProgressCard({
  data,
  achieved,
  onEdit,
}: {
  data: NonNullable<ReturnType<typeof useCurrentGoal>['data']>
  achieved: boolean
  onEdit: () => void
}) {
  const goal = data.goal!
  const pct = Math.min(100, data.progressPct.revenue)

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: achieved
          ? 'linear-gradient(135deg, rgba(198,255,60,0.15) 0%, rgba(198,255,60,0.05) 100%)'
          : 'var(--vc-black-mid)',
        border: achieved
          ? '1px solid var(--vc-lime-main)'
          : '1px solid rgba(198,255,60,0.2)',
        boxShadow: achieved ? '0 0 32px var(--vc-glow-lime)' : 'none',
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
          >
            Tu meta · {goal.month}/{goal.year}
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="text-3xl font-black"
              style={{
                color: 'var(--vc-white-soft)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {fmtMoney(goal.targetRevenue)}
            </span>
            {goal.stretchRevenue && (
              <span
                className="text-sm"
                style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
              >
                · stretch {fmtMoney(goal.stretchRevenue)}
              </span>
            )}
          </div>
          {goal.targetOrders && (
            <p
              className="mt-0.5 text-[12px]"
              style={{ color: 'var(--vc-white-dim)' }}
            >
              {goal.targetOrders} pedidos · {fmtPct(goal.targetMargin)} margen target
            </p>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
          style={{
            background: 'transparent',
            color: 'var(--vc-lime-main)',
            border: '1px solid rgba(198,255,60,0.3)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          <Edit3 size={11} /> Editar
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
          {fmtMoney(data.current.revenue)} / {fmtMoney(goal.targetRevenue)}
        </span>
        <span
          className="font-bold"
          style={{
            color: achieved ? 'var(--vc-lime-main)' : data.isOnTrack ? 'var(--vc-lime-main)' : '#FFB800',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="relative h-3 overflow-hidden rounded-full"
        style={{ background: 'var(--vc-gray-dark)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: 'var(--vc-gradient-primary)',
            boxShadow: '0 0 16px var(--vc-glow-lime)',
          }}
        />
      </div>

      {/* Achievement celebration */}
      {achieved && (
        <div
          className="mt-4 flex items-center gap-2 rounded-lg p-3 text-[13px]"
          style={{
            background: 'rgba(198,255,60,0.15)',
            border: '1px solid var(--vc-lime-main)',
            color: 'var(--vc-lime-main)',
          }}
        >
          <Trophy size={16} />
          <strong>¡Meta alcanzada este mes!</strong> Eres top de la comunidad 🏆
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBox
          label="Días transcurridos"
          value={`${data.daysElapsed.toFixed(1)} / ${data.daysInMonth}`}
          icon={Clock}
          color="var(--vc-white-soft)"
        />
        <StatBox
          label="Proyección fin de mes"
          value={fmtMoney(data.projected.revenue)}
          icon={TrendingUp}
          color={data.projected.revenue >= goal.targetRevenue ? 'var(--vc-lime-main)' : '#FFB800'}
        />
        <StatBox
          label="Ritmo requerido/día"
          value={data.dailyRateToHit ? fmtMoney(data.dailyRateToHit) : '—'}
          icon={Flame}
          color={
            data.needsPerDayIncrease === null
              ? 'var(--vc-gray-mid)'
              : data.needsPerDayIncrease <= 0
                ? 'var(--vc-lime-main)'
                : '#FFB800'
          }
        />
        <StatBox
          label="Pedidos actuales"
          value={String(data.current.orders)}
          icon={ShoppingCart}
          color="#3CC6FF"
        />
      </div>

      {/* Insight textual */}
      {data.needsPerDayIncrease !== null && !achieved && (
        <div
          className="mt-4 flex items-start gap-2 rounded-lg p-3 text-[12px]"
          style={{
            background:
              data.needsPerDayIncrease <= 0
                ? 'rgba(198,255,60,0.08)'
                : 'rgba(255,184,0,0.08)',
            border: `1px solid ${data.needsPerDayIncrease <= 0 ? 'rgba(198,255,60,0.3)' : 'rgba(255,184,0,0.3)'}`,
            color: 'var(--vc-white-soft)',
          }}
        >
          {data.needsPerDayIncrease <= 0 ? (
            <>
              <CheckCircle2 size={14} style={{ color: 'var(--vc-lime-main)', marginTop: 2, flexShrink: 0 }} />
              <span>
                Estás <strong>al ritmo de cumplir tu meta</strong>. A este paso, terminarás el mes con {fmtMoney(data.projected.revenue)}. Mantén el enfoque.
              </span>
            </>
          ) : (
            <>
              <Zap size={14} style={{ color: '#FFB800', marginTop: 2, flexShrink: 0 }} />
              <span>
                Necesitas subir el ritmo <strong>{fmtMoney(data.needsPerDayIncrease)} más por día</strong> para alcanzar la meta. Revisa el{' '}
                <Link href="/comando" style={{ color: 'var(--vc-lime-main)', textDecoration: 'underline' }}>
                  Command Center
                </Link>{' '}
                — tienes acciones IA esperando.
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({
  label, value, icon: Icon, color,
}: {
  label: string; value: string; icon: typeof Clock; color: string
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={11} style={{ color }} />
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-[15px] font-black"
        style={{ color, fontFamily: 'var(--font-heading)' }}
      >
        {value}
      </p>
    </div>
  )
}

function BenchmarkCard({
  label, metric, fmt, icon: Icon,
}: {
  label: string
  metric: MetricBenchmark
  fmt: (n: number | null) => string
  icon: typeof Users
}) {
  const rank = metric.percentileRank
  const rankMeta = rank ? RANK_META[rank] : null

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: `1px solid ${rankMeta?.color ?? 'rgba(198,255,60,0.15)'}30`,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: rankMeta?.color ?? 'var(--vc-lime-main)' }} />
          <span
            className="text-[11px] font-semibold"
            style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}
          >
            {label}
          </span>
        </div>
        {rankMeta && (
          <span
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold"
            style={{ background: rankMeta.bg, color: rankMeta.color, fontFamily: 'var(--font-mono)' }}
          >
            {rankMeta.emoji} {rankMeta.label}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-baseline gap-2">
        <span
          className="text-2xl font-black"
          style={{
            color: rankMeta?.color ?? 'var(--vc-white-soft)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {fmt(metric.userValue)}
        </span>
        {metric.userValue !== null && metric.percentileIndex !== null && (
          <span
            className="text-[11px]"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
          >
            · P{metric.percentileIndex}
          </span>
        )}
      </div>

      <div className="space-y-1 text-[11px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        <div className="flex justify-between">
          <span>Mediana comunidad</span>
          <span style={{ color: 'var(--vc-white-dim)' }}>{fmt(metric.communityMedian)}</span>
        </div>
        <div className="flex justify-between">
          <span>Top 10%</span>
          <span style={{ color: 'var(--vc-lime-main)' }}>{fmt(metric.communityTop10)}</span>
        </div>
        <div className="flex justify-between">
          <span>Muestra</span>
          <span>{metric.sampleSize} dropshippers</span>
        </div>
      </div>
    </div>
  )
}
