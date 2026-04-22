'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ImageIcon, Video, FileText, CheckCircle2, XCircle, Star, Archive,
  RefreshCw, Loader2, AlertCircle, Clock, Filter,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useAdminAssets, useUpdateAsset, useArchiveAsset,
  useDriveSyncStatus, useTriggerDriveSync,
  ASSET_TYPE_LABEL, ASSET_STATUS_META,
  type AssetStatus, type ProductAsset,
} from '@/hooks/useStudio'

const QUALITY_COLOR: Record<string, string> = {
  A_PREMIUM: '#C6FF3C',
  B_STANDARD: '#3CC6FF',
  C_ACCEPTABLE: '#FFB800',
  UNRATED: '#8B9BA8',
}

const STATUSES: AssetStatus[] = ['DRAFT', 'APPROVED', 'FEATURED', 'REJECTED', 'ARCHIVED']

export default function AdminAssetsPage() {
  const [filter, setFilter] = useState<AssetStatus | null>('DRAFT')
  const q = useAdminAssets(filter)
  const status = useDriveSyncStatus()
  const trigger = useTriggerDriveSync()
  const update = useUpdateAsset()
  const archive = useArchiveAsset()

  const items = useMemo(() => q.data?.items ?? [], [q.data])
  const counts = q.data?.counts

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title="Product Studio — assets" subtitle="Catálogo visual Vitalcom · sync Drive + aprobación" />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Drive sync bar */}
        <div className="mb-5 rounded-xl border border-[var(--vc-lime-main)]/20 bg-[var(--vc-black-mid)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--vc-lime-main)]/10 text-[var(--vc-lime-main)]">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--vc-white-soft)]">Drive Sync</span>
                  {status.data?.mockMode && (
                    <span className="rounded border border-[var(--vc-info)]/40 bg-[var(--vc-info)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--vc-info)]">
                      MOCK
                    </span>
                  )}
                </div>
                {status.data?.latest ? (
                  <div className="mt-0.5 text-[11px] text-[var(--vc-white-dim)]">
                    Último: {new Date(status.data.latest.startedAt).toLocaleString('es-CO')} ·{' '}
                    <strong className="text-[var(--vc-lime-main)]">{status.data.latest.filesNew} nuevos</strong> ·{' '}
                    {status.data.latest.filesUpdated} actualizados · {status.data.latest.filesFailed} fallos
                  </div>
                ) : (
                  <div className="mt-0.5 text-[11px] text-[var(--vc-white-dim)]">
                    Sin runs aún — corre el primer sync.
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => trigger.mutate()}
              disabled={trigger.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] hover:bg-[var(--vc-lime-electric)] disabled:opacity-40"
            >
              {trigger.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sincronizar ahora
            </button>
          </div>
          {trigger.data && (
            <div className="mt-3 rounded-md border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/5 px-3 py-2 text-[11px] text-[var(--vc-lime-main)]">
              ✓ Sync completado: {trigger.data.scanned} scanned · {trigger.data.created} nuevos ·{' '}
              {trigger.data.updated} actualizados · {trigger.data.failed} fallos
            </div>
          )}
        </div>

        {/* Filtros por status */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[var(--vc-white-dim)]" />
          {STATUSES.map(s => {
            const meta = ASSET_STATUS_META[s]
            const active = filter === s
            const count = counts?.[s] ?? 0
            return (
              <button
                key={s}
                onClick={() => setFilter(active ? null : s)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                  active
                    ? 'border-[var(--vc-lime-main)] bg-[var(--vc-lime-main)]/15 text-[var(--vc-lime-main)]'
                    : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/30'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                {meta.label}
                <span className="rounded bg-[var(--vc-black)] px-1.5 text-[10px] font-bold">{count}</span>
              </button>
            )
          })}
          {filter && (
            <button
              onClick={() => setFilter(null)}
              className="text-[11px] text-[var(--vc-white-dim)] hover:text-[var(--vc-lime-main)]"
            >
              limpiar
            </button>
          )}
        </div>

        {/* Grid */}
        {q.isLoading && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-10 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
            <div className="text-xs text-[var(--vc-white-dim)]">Cargando assets…</div>
          </div>
        )}

        {!q.isLoading && items.length === 0 && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-10 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-[var(--vc-gray-mid)]" />
            <div className="text-sm text-[var(--vc-white-soft)]">Sin assets en este filtro</div>
            <div className="mt-1 text-xs text-[var(--vc-white-dim)]">
              Corre el sync arriba para traer contenido del Drive.
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onApprove={() => update.mutate({ id: asset.id, data: { status: 'APPROVED' } })}
              onFeature={() => update.mutate({ id: asset.id, data: { status: 'FEATURED' } })}
              onReject={() =>
                update.mutate({
                  id: asset.id,
                  data: { status: 'REJECTED', rejectionReason: 'Baja calidad' },
                })
              }
              onArchive={() => archive.mutate(asset.id)}
              pending={update.isPending || archive.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AssetCard({
  asset, onApprove, onFeature, onReject, onArchive, pending,
}: {
  asset: ProductAsset
  onApprove: () => void
  onFeature: () => void
  onReject: () => void
  onArchive: () => void
  pending: boolean
}) {
  const isVideo = asset.originalMime?.startsWith('video/')
  const isPdf = asset.originalMime === 'application/pdf'
  const statusMeta = ASSET_STATUS_META[asset.status]

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]">
      {/* Preview */}
      <div className="relative aspect-square bg-[var(--vc-black-soft)]">
        {asset.cloudinaryUrl && !isPdf && !isVideo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.cloudinaryUrl}
            alt={asset.altText ?? asset.title ?? ''}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        {isVideo && (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="h-12 w-12 text-[var(--vc-white-dim)]" />
          </div>
        )}
        {isPdf && (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-12 w-12 text-[var(--vc-white-dim)]" />
          </div>
        )}
        {!asset.cloudinaryUrl && !isVideo && !isPdf && (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-[var(--vc-gray-mid)]" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1">
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: `${statusMeta.color}E6`, color: '#0A0A0A' }}
          >
            {statusMeta.label}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: `${QUALITY_COLOR[asset.quality]}40`, color: QUALITY_COLOR[asset.quality] }}
          >
            {asset.quality.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-[var(--vc-white-soft)]">
              {asset.product?.name ?? 'Sin producto'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--vc-white-dim)]">
              <span className="rounded bg-[var(--vc-black-soft)] px-1.5 py-0.5 font-mono">
                {ASSET_TYPE_LABEL[asset.type]}
              </span>
              {asset.angle && (
                <span className="rounded bg-[var(--vc-info)]/10 px-1.5 py-0.5 text-[var(--vc-info)]">
                  {asset.angle}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1 border-t border-[var(--vc-gray-dark)]/40 pt-2 text-[10px] text-[var(--vc-gray-mid)]">
          <Clock className="h-2.5 w-2.5" />
          {new Date(asset.createdAt).toLocaleDateString('es-CO')}
          {asset.width && asset.height && (
            <span className="ml-auto">
              {asset.width}×{asset.height}
            </span>
          )}
        </div>

        {/* Actions */}
        {asset.status === 'DRAFT' && (
          <div className="mt-2 grid grid-cols-3 gap-1">
            <button
              onClick={onApprove}
              disabled={pending}
              className="flex items-center justify-center gap-0.5 rounded border border-[var(--vc-info)]/30 bg-[var(--vc-info)]/10 py-1 text-[10px] font-semibold text-[var(--vc-info)] hover:bg-[var(--vc-info)]/20 disabled:opacity-40"
              title="Aprobar"
            >
              <CheckCircle2 className="h-3 w-3" />
              OK
            </button>
            <button
              onClick={onFeature}
              disabled={pending}
              className="flex items-center justify-center gap-0.5 rounded border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/10 py-1 text-[10px] font-semibold text-[var(--vc-lime-main)] hover:bg-[var(--vc-lime-main)]/20 disabled:opacity-40"
              title="Destacar"
            >
              <Star className="h-3 w-3" />
              Top
            </button>
            <button
              onClick={onReject}
              disabled={pending}
              className="flex items-center justify-center gap-0.5 rounded border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/10 py-1 text-[10px] font-semibold text-[var(--vc-error)] hover:bg-[var(--vc-error)]/20 disabled:opacity-40"
              title="Rechazar"
            >
              <XCircle className="h-3 w-3" />
              No
            </button>
          </div>
        )}

        {asset.status !== 'DRAFT' && asset.status !== 'ARCHIVED' && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {asset.status === 'APPROVED' && (
              <button
                onClick={onFeature}
                disabled={pending}
                className="flex items-center justify-center gap-0.5 rounded border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/10 py-1 text-[10px] font-semibold text-[var(--vc-lime-main)]"
              >
                <Star className="h-3 w-3" />
                Destacar
              </button>
            )}
            <button
              onClick={onArchive}
              disabled={pending}
              className="col-span-full flex items-center justify-center gap-0.5 rounded border border-[var(--vc-gray-dark)] bg-[var(--vc-black-soft)] py-1 text-[10px] font-semibold text-[var(--vc-white-dim)] hover:border-[var(--vc-error)]/40"
            >
              <Archive className="h-3 w-3" />
              Archivar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
