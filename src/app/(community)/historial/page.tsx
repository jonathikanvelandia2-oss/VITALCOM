'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  History, Brain, Store, Wand2, Loader2, Undo2, CheckCircle2,
  XCircle, TrendingUp, ShieldCheck, PiggyBank, BarChart3, ArrowRight,
  Clock, AlertCircle,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useActionHistory, useRevertAction,
  type HistorySource, type HistoryItem,
} from '@/hooks/useActionHistory'

// ── V25 — Historial de acciones IA con Revert 1-clic ────
// El dropshipper ve toda acción IA aplicada con su impacto estimado.
// Puede revertir campañas pausadas, precios cambiados, bestsellers
// marcados y productos desactivados. El AppliedAction mantiene
// trazabilidad completa (revertedAt + sideEffect).

const SOURCE_META: Record<HistorySource, { label: string; icon: typeof Brain; color: string; bg: string }> = {
  MEDIA_BUYER:     { label: 'MediaBuyer',      icon: Brain,  color: '#A855F7',              bg: 'rgba(168,85,247,0.12)' },
  STORE_OPTIMIZER: { label: 'Tienda',          icon: Store,  color: 'var(--vc-lime-main)',  bg: 'rgba(198,255,60,0.12)' },
  CREATIVE_MAKER:  { label: 'Creativo',        icon: Wand2,  color: '#3CC6FF',              bg: 'rgba(60,198,255,0.12)' },
}

const KIND_ICON: Record<string, typeof PiggyBank> = {
  savings: PiggyBank,
  revenue: TrendingUp,
  margin: BarChart3,
  retention: ShieldCheck,
}

function fmtMoney(n: number | null): string {
  if (n === null || n === 0) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}k`
  return `${n < 0 ? '-' : ''}$${Math.round(abs).toLocaleString('es-CO')}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function daysAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days}d`
  return `hace ${Math.floor(days / 30)} meses`
}

export default function HistorialPage() {
  const [sourceFilter, setSourceFilter] = useState<HistorySource | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'applied' | 'reverted'>('all')
  const [confirmRevert, setConfirmRevert] = useState<string | null>(null)

  const historyQ = useActionHistory({
    source: sourceFilter,
    status: statusFilter,
    days: 90,
  })
  const revertMut = useRevertAction()

  const data = historyQ.data

  async function handleRevert(id: string) {
    try {
      const result = await revertMut.mutateAsync(id)
      setConfirmRevert(null)
      alert(
        result.result.reversible
          ? `✓ Acción revertida — ${result.result.sideEffect}`
          : '✓ Marcada como anulada (sin side-effect server a revertir).',
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al revertir')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      <CommunityTopbar
        title="Historial Acciones"
        subtitle="Cada recomendación IA que aplicaste — con opción de revertir"
      />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(60,198,255,0.08) 0%, rgba(168,85,247,0.06) 100%)',
          borderBottom: '1px solid rgba(198,255,60,0.15)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-2 flex items-center gap-2">
            <History size={18} style={{ color: 'var(--vc-lime-main)' }} />
            <span
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
            >
              V25 · Trazabilidad IA
            </span>
          </div>
          <h1
            className="mb-2 text-3xl md:text-4xl font-black leading-tight"
            style={{
              background: 'var(--vc-gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'var(--font-display)',
            }}
          >
            HISTORIAL DE ACCIONES
          </h1>
          <p className="max-w-2xl text-sm" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-body)' }}>
            Todo lo que la IA hizo por ti — y todo lo que puedes deshacer si algo no funcionó.
          </p>

          {data && (
            <div className="mt-5 grid grid-cols-3 gap-3 max-w-xl">
              <StatCard label="Total aplicadas" value={data.summary.total} color="var(--vc-lime-main)" />
              <StatCard label="Activas" value={data.summary.active} color="#3CC6FF" />
              <StatCard label="Revertidas" value={data.summary.reverted} color="#FFB800" />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-[0.15em] mr-2"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
          >
            Filtros:
          </span>
          <FilterChip
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            label="Todas"
          />
          <FilterChip
            active={statusFilter === 'applied'}
            onClick={() => setStatusFilter('applied')}
            label="Activas"
          />
          <FilterChip
            active={statusFilter === 'reverted'}
            onClick={() => setStatusFilter('reverted')}
            label="Revertidas"
          />
          <span
            className="ml-3 text-[10px]"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
          >
            ·
          </span>
          <FilterChip
            active={sourceFilter === null}
            onClick={() => setSourceFilter(null)}
            label="Todas fuentes"
          />
          {(Object.keys(SOURCE_META) as HistorySource[]).map((s) => (
            <FilterChip
              key={s}
              active={sourceFilter === s}
              onClick={() => setSourceFilter(s)}
              label={SOURCE_META[s].label}
              icon={SOURCE_META[s].icon}
              color={SOURCE_META[s].color}
            />
          ))}
        </div>

        {/* Timeline */}
        {historyQ.isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        )}

        {!historyQ.isLoading && data && data.items.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px dashed var(--vc-gray-dark)',
            }}
          >
            <History size={32} className="mx-auto mb-2" style={{ color: 'var(--vc-gray-mid)' }} />
            <p
              className="mb-2 text-sm"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-body)' }}
            >
              Aún no has aplicado ninguna acción IA.
            </p>
            <Link
              href="/comando"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold"
              style={{
                background: 'var(--vc-lime-main)',
                color: 'var(--vc-black)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              IR AL COMMAND CENTER <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {!historyQ.isLoading && data && data.items.length > 0 && (
          <div className="space-y-3">
            {data.items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onRevert={() => setConfirmRevert(item.id)}
                isReverting={revertMut.isPending && confirmRevert === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmación revert */}
      {confirmRevert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmRevert(null)}
        >
          <div
            className="max-w-md rounded-2xl p-6"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px solid rgba(255,71,87,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle size={28} className="mb-3" style={{ color: '#FF4757' }} />
            <h3
              className="mb-2 text-lg font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              ¿Revertir esta acción?
            </h3>
            <p
              className="mb-4 text-sm"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-body)' }}
            >
              Se deshará el side-effect que aplicó la IA (reactivar campaña, restaurar precio, etc.).
              El registro quedará marcado como revertido para trazabilidad.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRevert(null)}
                className="flex-1 rounded-lg px-4 py-2 text-xs font-bold"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--vc-gray-dark)',
                  color: 'var(--vc-white-dim)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRevert(confirmRevert)}
                disabled={revertMut.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold"
                style={{
                  background: '#FF4757',
                  color: 'var(--vc-white)',
                  fontFamily: 'var(--font-heading)',
                  opacity: revertMut.isPending ? 0.6 : 1,
                }}
              >
                {revertMut.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Undo2 size={12} />
                )}
                SÍ, REVERTIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'var(--vc-black-mid)',
        border: `1px solid ${color}30`,
      }}
    >
      <p
        className="text-[9px] uppercase tracking-[0.15em]"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-black"
        style={{ color, fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
    </div>
  )
}

function FilterChip({
  active, onClick, label, icon: Icon, color,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: typeof Brain
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
      style={{
        background: active ? 'rgba(198,255,60,0.15)' : 'var(--vc-black-soft)',
        border: active ? '1px solid var(--vc-lime-main)' : '1px solid var(--vc-gray-dark)',
        color: active ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {Icon && <Icon size={11} style={{ color: color ?? undefined }} />}
      {label}
    </button>
  )
}

function HistoryCard({
  item, onRevert, isReverting,
}: {
  item: HistoryItem
  onRevert: () => void
  isReverting: boolean
}) {
  const meta = SOURCE_META[item.source]
  const Icon = meta.icon
  const KindIcon = KIND_ICON[item.estimatedImpactKind ?? ''] ?? TrendingUp
  const isReverted = item.revertedAt !== null

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: 'var(--vc-black-mid)',
        border: isReverted ? '1px solid rgba(255,184,0,0.25)' : `1px solid ${meta.bg.replace('0.12', '0.25')}`,
        opacity: isReverted ? 0.7 : 1,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: meta.bg, color: meta.color }}
        >
          <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="text-[9px] uppercase rounded px-1.5 py-0.5 font-bold"
              style={{ background: meta.bg, color: meta.color, fontFamily: 'var(--font-mono)' }}
            >
              {meta.label}
            </span>
            <span
              className="text-[9px] uppercase"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              {item.actionType}
            </span>
            {isReverted ? (
              <span
                className="inline-flex items-center gap-1 text-[9px] uppercase rounded px-1.5 py-0.5 font-bold"
                style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800', fontFamily: 'var(--font-mono)' }}
              >
                <XCircle size={9} /> REVERTIDA
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[9px] uppercase rounded px-1.5 py-0.5 font-bold"
                style={{ background: 'rgba(198,255,60,0.12)', color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
              >
                <CheckCircle2 size={9} /> ACTIVA
              </span>
            )}
          </div>

          <p
            className="mb-1 text-sm font-semibold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            {item.title}
          </p>

          {(item.product || item.campaign) && (
            <p
              className="mb-1 text-[11px]"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-body)' }}
            >
              {item.product && <>Producto: <span className="font-semibold">{item.product.name}</span></>}
              {item.campaign && <>Campaña: <span className="font-semibold">{item.campaign.name}</span></>}
            </p>
          )}

          {item.estimatedRationale && (
            <p
              className="mt-1 text-[11px] line-clamp-2"
              style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-body)' }}
            >
              {item.estimatedRationale}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--vc-gray-mid)' }}>
              <Clock size={10} className="inline mr-1" />
              Aplicada {daysAgo(item.appliedAt)} · {fmtDate(item.appliedAt)}
            </span>
            {isReverted && item.revertedAt && (
              <span style={{ color: '#FFB800' }}>
                Revertida {daysAgo(item.revertedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="mb-1">
            <KindIcon size={12} className="inline mr-1" style={{ color: 'var(--vc-lime-main)' }} />
            <span
              className="text-[10px] uppercase"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              {item.estimatedImpactKind ?? '—'}
            </span>
          </div>
          <p
            className="text-lg font-black"
            style={{
              color: isReverted ? 'var(--vc-gray-mid)' : 'var(--vc-lime-main)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {fmtMoney(item.estimatedImpactUsd)}
          </p>
          {item.realizedImpactUsd !== null && (
            <p
              className="text-[10px]"
              style={{ color: '#3CC6FF', fontFamily: 'var(--font-mono)' }}
            >
              real: {fmtMoney(item.realizedImpactUsd)}
            </p>
          )}
          {!isReverted && item.reversible && (
            <button
              onClick={onRevert}
              disabled={isReverting}
              className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all hover:scale-105"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,71,87,0.3)',
                color: '#FF4757',
                fontFamily: 'var(--font-heading)',
                opacity: isReverting ? 0.5 : 1,
              }}
            >
              {isReverting ? <Loader2 size={10} className="animate-spin" /> : <Undo2 size={10} />}
              REVERTIR
            </button>
          )}
          {!isReverted && !item.reversible && (
            <span
              className="mt-2 inline-block text-[9px] italic"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              no revertible
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
