'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Rocket, Plus, Loader2, Trash2, Pencil, Sparkles,
  CheckCircle2, Clock, Archive, AlertTriangle, X,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useProducts } from '@/hooks/useProducts'
import {
  useCampaignDrafts,
  useCreateCampaignDraft,
  useDeleteCampaignDraft,
  type DraftStatus,
  type CampaignDraft,
  type AdPlatform,
} from '@/hooks/useCampaignDrafts'

const STATUS_META: Record<DraftStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT:    { label: 'Borrador',   color: 'var(--vc-gray-mid)',   icon: Pencil },
  READY:    { label: 'Listo',      color: '#FFB800',              icon: CheckCircle2 },
  LAUNCHED: { label: 'En vivo',    color: 'var(--vc-lime-main)',  icon: Rocket },
  PAUSED:   { label: 'Pausado',    color: '#FF4757',              icon: AlertTriangle },
  ARCHIVED: { label: 'Archivado',  color: 'var(--vc-gray-dark)',  icon: Archive },
}

const PLATFORM_COLORS: Record<AdPlatform, string> = {
  META: '#1877F2',
  TIKTOK: '#FF0050',
  GOOGLE: '#4285F4',
  OTHER: 'var(--vc-gray-mid)',
}

export default function LanzadorListPage() {
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState<DraftStatus | 'ALL'>('ALL')
  const router = useRouter()

  const draftsQ = useCampaignDrafts(filter === 'ALL' ? undefined : filter)
  const deleteMut = useDeleteCampaignDraft()

  const drafts = draftsQ.data?.items ?? []

  const kpis = {
    total: drafts.length,
    ready: drafts.filter((d) => d.status === 'READY').length,
    launched: drafts.filter((d) => d.status === 'LAUNCHED').length,
    dailyTotal: drafts
      .filter((d) => d.status === 'READY' || d.status === 'LAUNCHED')
      .reduce((s, d) => s + (d.dailyBudget ?? 0), 0),
  }

  return (
    <>
      <CommunityTopbar title="Lanzador de Campañas" subtitle="Crea y publica campañas en 5 pasos" />
      <div className="flex-1 space-y-6 p-4 md:p-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total" value={kpis.total} icon={Rocket} />
          <KpiCard label="Listos" value={kpis.ready} icon={CheckCircle2} accent />
          <KpiCard label="En vivo" value={kpis.launched} icon={Sparkles} accent />
          <KpiCard
            label="Gasto diario proyectado"
            value={`$${kpis.dailyTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
            icon={Clock}
          />
        </div>

        {/* Filtros + botón crear */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'DRAFT', 'READY', 'LAUNCHED', 'ARCHIVED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold"
                style={{
                  background: filter === f ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                  color: filter === f ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                  border: filter === f ? '1px solid rgba(198,255,60,0.3)' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {f === 'ALL' ? 'Todas' : STATUS_META[f as DraftStatus].label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase"
            style={{
              background: 'var(--vc-lime-main)',
              color: 'var(--vc-black)',
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 0 16px var(--vc-glow-lime)',
            }}
          >
            <Plus size={14} /> Nueva campaña
          </button>
        </div>

        {/* Listado */}
        {draftsQ.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin" size={24} color="var(--vc-lime-main)" />
          </div>
        ) : drafts.length === 0 ? (
          <EmptyState onCreate={() => setShowNew(true)} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {drafts.map((d) => (
              <DraftCard
                key={d.id}
                draft={d}
                onOpen={() => router.push(`/lanzador/${d.id}`)}
                onDelete={() => {
                  if (confirm(`¿Eliminar campaña "${d.name}"?`)) deleteMut.mutate(d.id)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewDraftModal onClose={() => setShowNew(false)} />}
    </>
  )
}

function KpiCard({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: typeof Rocket; accent?: boolean }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: accent ? '1px solid rgba(198,255,60,0.25)' : '1px solid var(--vc-gray-dark)',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} color={accent ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)'} />
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold" style={{ color: accent ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
    </div>
  )
}

function DraftCard({ draft, onOpen, onDelete }: { draft: CampaignDraft; onOpen: () => void; onDelete: () => void }) {
  const meta = STATUS_META[draft.status]
  const StatusIcon = meta.icon
  const stepPct = (draft.step / 5) * 100

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid var(--vc-gray-dark)',
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: `${PLATFORM_COLORS[draft.platform]}25`, color: PLATFORM_COLORS[draft.platform] }}
            >
              {draft.platform}
            </span>
            <span
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: `${meta.color}25`, color: meta.color }}
            >
              <StatusIcon size={10} /> {meta.label}
            </span>
          </div>
          <h3 className="truncate text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            {draft.name}
          </h3>
          {draft.product && (
            <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
              {draft.product.name}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="rounded p-1.5 transition-colors"
          style={{ color: 'var(--vc-gray-mid)' }}
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Progreso wizard */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          <span>PASO {draft.step}/5</span>
          <span>{Math.round(stepPct)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--vc-gray-dark)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${stepPct}%`, background: 'var(--vc-gradient-primary)' }}
          />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p style={{ color: 'var(--vc-gray-mid)' }}>País</p>
          <p style={{ color: 'var(--vc-white-dim)' }}>{draft.targetCountry ?? '—'}</p>
        </div>
        <div>
          <p style={{ color: 'var(--vc-gray-mid)' }}>Presupuesto/día</p>
          <p style={{ color: 'var(--vc-white-dim)' }}>
            {draft.dailyBudget ? `$${draft.dailyBudget.toLocaleString('es-CO')}` : '—'}
          </p>
        </div>
      </div>

      <button
        onClick={onOpen}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase"
        style={{
          background: 'var(--vc-black-soft)',
          border: '1px solid rgba(198,255,60,0.3)',
          color: 'var(--vc-lime-main)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {draft.status === 'DRAFT' ? 'Continuar' : 'Ver detalles'}
      </button>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="rounded-xl p-10 text-center"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px dashed rgba(198,255,60,0.25)',
      }}
    >
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'rgba(198,255,60,0.1)' }}
      >
        <Rocket size={32} color="var(--vc-lime-main)" />
      </div>
      <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
        Aún no tienes campañas
      </h3>
      <p className="mx-auto mb-6 max-w-md text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
        El wizard te guía en 5 pasos para crear campañas que se adapten a tu producto Vitalcom, audiencia y presupuesto.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold uppercase"
        style={{
          background: 'var(--vc-lime-main)',
          color: 'var(--vc-black)',
          fontFamily: 'var(--font-heading)',
          boxShadow: '0 0 20px var(--vc-glow-lime)',
        }}
      >
        <Plus size={16} /> Crear primera campaña
      </button>
    </div>
  )
}

function NewDraftModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [productId, setProductId] = useState<string>('')
  const [platform, setPlatform] = useState<AdPlatform>('META')

  const productsQ = useProducts({ limit: 50 } as any)
  const createMut = useCreateCampaignDraft()

  const products = productsQ.data?.products ?? []

  async function handleCreate() {
    if (!name.trim()) return
    const draft = await createMut.mutateAsync({
      name: name.trim(),
      productId: productId || undefined,
      platform,
    })
    router.push(`/lanzador/${draft.id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            Nueva campaña
          </h2>
          <button onClick={onClose} style={{ color: 'var(--vc-gray-mid)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <FormField label="Nombre interno">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Colágeno CO - Mujeres 25-45"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-soft)',
              }}
            />
          </FormField>

          <FormField label="Plataforma">
            <div className="grid grid-cols-3 gap-2">
              {(['META', 'TIKTOK', 'GOOGLE'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className="rounded-lg px-3 py-2 text-xs font-bold uppercase"
                  style={{
                    background: platform === p ? `${PLATFORM_COLORS[p]}25` : 'var(--vc-black-soft)',
                    color: platform === p ? PLATFORM_COLORS[p] : 'var(--vc-white-dim)',
                    border: platform === p ? `1px solid ${PLATFORM_COLORS[p]}` : '1px solid var(--vc-gray-dark)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Producto (opcional — se puede elegir luego)">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-soft)',
              }}
            >
              <option value="">— Sin producto aún —</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || createMut.isPending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold uppercase disabled:opacity-50"
            style={{
              background: 'var(--vc-lime-main)',
              color: 'var(--vc-black)',
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 0 16px var(--vc-glow-lime)',
            }}
          >
            {createMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
            Crear y configurar
          </button>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}
