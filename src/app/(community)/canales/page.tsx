'use client'

// V38 — Canales Vitalcom (community-facing).
// La comunidad ve los canales oficiales agrupados: grupos · áreas · anuncios.
// Cada CTA abre wa.me o invite con el mensaje pre-llenado + registra click.

import { MessageCircle, Users, Megaphone, Loader2, ExternalLink, Hash, ChevronRight } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useChannels, useLogChannelClick, type ChannelPublic, type ChannelGroupPublic } from '@/hooks/useChannels'

const GROUP_ICON = {
  groups: Users,
  staff: Hash,
  announcements: Megaphone,
} as const

const AREA_LABEL: Record<string, string> = {
  DIRECCION: 'Dirección',
  MARKETING: 'Marketing',
  COMERCIAL: 'Comercial',
  ADMINISTRATIVA: 'Administración',
  LOGISTICA: 'Logística',
  CONTABILIDAD: 'Contabilidad',
}

export default function CanalesPage() {
  const q = useChannels()
  const groups = q.data?.groups ?? []

  return (
    <>
      <CommunityTopbar
        title="Canales Vitalcom"
        subtitle={q.isLoading ? 'Cargando…' : `${q.data?.total ?? 0} canales disponibles · directo a WhatsApp`}
      />
      <div className="flex-1 space-y-8 p-4 md:p-6">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{
            background: 'var(--vc-gradient-hero)',
            border: '1px solid rgba(198, 255, 60, 0.25)',
            boxShadow: '0 0 40px rgba(198, 255, 60, 0.08)',
          }}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: 'var(--vc-gradient-glow)' }}
          />
          <div className="relative flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: 'var(--vc-lime-main)',
                color: 'var(--vc-black)',
                boxShadow: '0 0 24px var(--vc-glow-lime)',
              }}
            >
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h1
                className="text-2xl font-black md:text-3xl"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
              >
                Conéctate con Vitalcom por WhatsApp
              </h1>
              <p className="mt-1 text-sm text-[var(--vc-white-dim)]">
                Tu área de soporte, grupos de comunidad y anuncios oficiales — todo en un lugar. Sin apps, sin login: clicas y abre WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {q.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--vc-lime-main)]" />
          </div>
        )}

        {q.error && (
          <div className="rounded-lg border border-[var(--vc-error)]/30 bg-[var(--vc-error)]/5 p-4 text-xs text-[var(--vc-error)]">
            {(q.error as Error).message}
          </div>
        )}

        {!q.isLoading && groups.length === 0 && (
          <EmptyState />
        )}

        {groups.map((g) => (
          <ChannelGroupSection key={g.key} group={g} />
        ))}
      </div>
    </>
  )
}

function ChannelGroupSection({ group }: { group: ChannelGroupPublic }) {
  const Icon = GROUP_ICON[group.key]

  return (
    <section>
      <div className="mb-4 flex items-start gap-3 border-b border-[var(--vc-gray-dark)] pb-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(198,255,60,0.1)',
            color: 'var(--vc-lime-main)',
            border: '1px solid rgba(198,255,60,0.3)',
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2
            className="text-lg font-black leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
          >
            {group.label}
          </h2>
          <p className="text-[11px] text-[var(--vc-white-dim)]">{group.description}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {group.channels.map((c) => (
          <ChannelCard key={c.id} channel={c} groupKey={group.key} />
        ))}
      </div>
    </section>
  )
}

function ChannelCard({ channel, groupKey }: { channel: ChannelPublic; groupKey: string }) {
  const log = useLogChannelClick(channel.id)
  const disabled = !channel.resolvedUrl

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    // Fire-and-forget — no bloqueamos el click
    log.mutate()
  }

  return (
    <a
      href={channel.resolvedUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-disabled={disabled}
      className="group relative flex flex-col gap-3 rounded-xl p-4 transition"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid rgba(198, 255, 60, 0.15)',
        boxShadow: disabled ? 'none' : undefined,
        pointerEvents: disabled ? 'none' : undefined,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-2xl"
          style={{
            background: 'rgba(198,255,60,0.1)',
            border: '1px solid rgba(198,255,60,0.3)',
          }}
        >
          {channel.icon || defaultIconForType(channel.type)}
        </div>
        {channel.area && (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: 'var(--vc-black-soft)',
              color: 'var(--vc-lime-main)',
            }}
          >
            {AREA_LABEL[channel.area] ?? channel.area}
          </span>
        )}
      </div>

      <div>
        <h3
          className="text-sm font-black"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--vc-white-soft)' }}
        >
          {channel.label}
        </h3>
        {channel.description && (
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--vc-white-dim)]">
            {channel.description}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-lime-main)]">
          {typeLabelForChannel(channel.type, groupKey)}
        </span>
        <span
          className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--vc-white-dim)] group-hover:text-[var(--vc-lime-main)]"
        >
          Abrir <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  )
}

function defaultIconForType(type: ChannelPublic['type']): string {
  switch (type) {
    case 'STAFF_DM': return '💬'
    case 'COMMUNITY_GROUP': return '👥'
    case 'BROADCAST_LIST': return '📣'
    case 'ANNOUNCEMENTS': return '📢'
  }
}

function typeLabelForChannel(type: ChannelPublic['type'], groupKey: string): string {
  if (groupKey === 'staff') return type === 'STAFF_DM' ? 'Chat 1 a 1' : 'Suscribirme'
  if (type === 'ANNOUNCEMENTS') return 'Ver canal'
  if (type === 'COMMUNITY_GROUP') return 'Unirme al grupo'
  return 'Abrir'
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl p-10 text-center"
      style={{
        background: 'var(--vc-black-mid)',
        border: '1px solid var(--vc-gray-dark)',
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: 'rgba(198,255,60,0.1)',
          border: '1px solid rgba(198,255,60,0.3)',
        }}
      >
        <MessageCircle className="h-6 w-6 text-[var(--vc-lime-main)]" />
      </div>
      <h3 className="text-lg font-black text-[var(--vc-white-soft)]" style={{ fontFamily: 'var(--font-heading)' }}>
        Aún no hay canales publicados
      </h3>
      <p className="max-w-md text-xs text-[var(--vc-white-dim)]">
        Vitalcom está configurando sus canales oficiales de WhatsApp. Pronto podrás conectarte directo con las áreas y grupos de la comunidad.
      </p>
    </div>
  )
}
