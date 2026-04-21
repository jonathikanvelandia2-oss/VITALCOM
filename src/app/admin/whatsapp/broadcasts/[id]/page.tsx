'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Users, CheckCircle2, XCircle, Loader2, Clock, Play,
  Megaphone, GitMerge,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useBroadcast, useExecuteBroadcast } from '@/hooks/useWaTemplates'

export default function BroadcastDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const dataQ = useBroadcast(id)
  const executeM = useExecuteBroadcast()

  const broadcast = dataQ.data?.broadcast
  const statusCounts = dataQ.data?.statusCounts ?? {}
  const variants = dataQ.data?.variants ?? []

  const handleExecute = async () => {
    await executeM.mutateAsync(id)
  }

  if (dataQ.isLoading || !broadcast) {
    return (
      <div className="min-h-screen bg-[var(--vc-black)]">
        <AdminTopbar title="Broadcast" />
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
        </div>
      </div>
    )
  }

  const total = broadcast.totalRecipients || 1
  const sent = statusCounts.SENT ?? 0
  const delivered = statusCounts.DELIVERED ?? 0
  const read = statusCounts.READ ?? 0
  const failed = statusCounts.FAILED ?? 0
  const pending = statusCounts.PENDING ?? 0

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar title={broadcast.name} subtitle="Broadcast detail" />

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/admin/whatsapp/broadcasts"
            className="flex items-center gap-1.5 rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-2 py-1 text-xs text-[var(--vc-white-dim)] hover:border-[var(--vc-lime-main)]/30"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver
          </Link>
          {(broadcast.status === 'DRAFT' || broadcast.status === 'SCHEDULED') && (
            <button
              onClick={handleExecute}
              disabled={executeM.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--vc-lime-main)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--vc-black)] hover:bg-[var(--vc-lime-electric)] disabled:opacity-40"
            >
              {executeM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Ejecutar ahora
            </button>
          )}
        </div>

        {/* Summary card */}
        <div className="mb-5 rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--vc-lime-main)]/10">
              <Megaphone className="h-5 w-5 text-[var(--vc-lime-main)]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--vc-white-soft)]">{broadcast.name}</div>
              <div className="text-[11px] text-[var(--vc-white-dim)]">
                Plantilla <code>{broadcast.templateName}</code> · {broadcast.status}
                {broadcast.variantGroup && ` · A/B grupo "${broadcast.variantGroup}"`}
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-5 gap-2 border-t border-[var(--vc-gray-dark)] pt-3 text-center">
            <MetricBig Icon={Users} label="Recipients" value={broadcast.totalRecipients} />
            <MetricBig Icon={Clock} label="Pending" value={pending} color="#8B9BA8" />
            <MetricBig Icon={CheckCircle2} label="Sent" value={sent} color="#C6FF3C" />
            <MetricBig Icon={CheckCircle2} label="Read" value={read} color="#3CC6FF" />
            <MetricBig Icon={XCircle} label="Failed" value={failed} color="#FF4757" />
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--vc-white-dim)]">
              <span>Progreso</span>
              <span>{((sent + failed) / total * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--vc-black-soft)]">
              <div
                className="h-full bg-[var(--vc-lime-main)] transition-all"
                style={{ width: `${(sent + failed) / total * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* A/B Variant Stats */}
        {variants.length > 0 && (
          <div className="mb-5 rounded-xl border border-[var(--vc-info)]/30 bg-[var(--vc-info)]/5 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-info)]">
              <GitMerge className="h-3 w-3" />
              Stats por variante A/B
            </div>
            <div className="overflow-x-auto rounded-lg border border-[var(--vc-gray-dark)]">
              <table className="w-full text-[11px]">
                <thead className="bg-[var(--vc-black-soft)] text-[9px] uppercase text-[var(--vc-white-dim)]">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Variante</th>
                    <th className="px-2 py-1.5">Pending</th>
                    <th className="px-2 py-1.5">Sent</th>
                    <th className="px-2 py-1.5">Delivered</th>
                    <th className="px-2 py-1.5">Read</th>
                    <th className="px-2 py-1.5">Failed</th>
                    <th className="px-2 py-1.5">Read rate</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(v => {
                    const total = Object.values(v.counts).reduce((a, b) => a + b, 0)
                    const readRate = total > 0 ? ((v.counts.READ ?? 0) / total) * 100 : 0
                    return (
                      <tr key={v.key} className="border-t border-[var(--vc-gray-dark)]/40">
                        <td className="px-2 py-1.5 font-bold text-[var(--vc-lime-main)]">{v.key}</td>
                        <td className="px-2 py-1.5 text-center text-[var(--vc-white-dim)]">{v.counts.PENDING ?? 0}</td>
                        <td className="px-2 py-1.5 text-center text-[var(--vc-white-soft)]">{v.counts.SENT ?? 0}</td>
                        <td className="px-2 py-1.5 text-center text-[var(--vc-white-soft)]">{v.counts.DELIVERED ?? 0}</td>
                        <td className="px-2 py-1.5 text-center text-[var(--vc-white-soft)]">{v.counts.READ ?? 0}</td>
                        <td className="px-2 py-1.5 text-center text-[var(--vc-error)]">{v.counts.FAILED ?? 0}</td>
                        <td className="px-2 py-1.5 text-center font-bold" style={{ color: readRate > 40 ? '#C6FF3C' : '#FFB800' }}>
                          {readRate.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
            Timeline
          </div>
          <div className="space-y-1 text-xs">
            <TimelineRow label="Creado" at={broadcast.createdAt} />
            {broadcast.scheduledFor && <TimelineRow label="Agendado para" at={broadcast.scheduledFor} />}
            {broadcast.startedAt && <TimelineRow label="Iniciado" at={broadcast.startedAt} />}
            {broadcast.completedAt && <TimelineRow label="Completado" at={broadcast.completedAt} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricBig({ Icon, label, value, color }: {
  Icon: typeof Users
  label: string
  value: number
  color?: string
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-[var(--vc-gray-mid)]">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </div>
      <div className="text-lg font-bold" style={{ color: color ?? 'var(--vc-white-soft)' }}>
        {value}
      </div>
    </div>
  )
}

function TimelineRow({ label, at }: { label: string; at: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--vc-gray-dark)]/40 py-1.5">
      <span className="text-[var(--vc-white-dim)]">{label}</span>
      <span className="font-mono text-[var(--vc-white-soft)]">
        {new Date(at).toLocaleString('es-CO')}
      </span>
    </div>
  )
}
