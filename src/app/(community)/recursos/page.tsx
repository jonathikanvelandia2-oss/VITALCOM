'use client'

import { useState, useMemo } from 'react'
import {
  BookOpen, FileText, Image as ImageIcon, Download,
  Search, Star, Eye, FileSpreadsheet, Palette,
  PlayCircle, FileDown, Loader2,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useResources, useTrackDownload } from '@/hooks/useResources'

// ── Biblioteca de Recursos VITALCOMMERS ──────────────────
// Conectada 100% al modelo Resource en BD. Sin datos mock.

type ResourceFormat = 'file' | 'link' | 'video'

const CATEGORIES = ['Todos', 'Guías', 'Plantillas', 'Videos', 'Creativos', 'Documentos'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_ICONS: Record<Exclude<Category, 'Todos'>, typeof FileText> = {
  Guías: BookOpen,
  Plantillas: FileSpreadsheet,
  Videos: PlayCircle,
  Creativos: Palette,
  Documentos: FileText,
}

const FORMAT_CONFIG: Record<ResourceFormat, { icon: typeof FileText; label: string; color: string }> = {
  file:  { icon: FileDown,   label: 'Archivo', color: 'var(--vc-error)' },
  link:  { icon: ImageIcon,  label: 'Recurso', color: 'var(--vc-info)' },
  video: { icon: PlayCircle, label: 'Video',   color: 'var(--vc-warning)' },
}

type ApiResource = {
  id: string
  title: string
  description: string | null
  category: string
  type: ResourceFormat
  url: string
  thumbnail: string | null
  downloads: number
  createdAt: string
}

export default function RecursosPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('Todos')
  const { data, isLoading } = useResources()
  const trackDownload = useTrackDownload()

  const resources = (data?.resources ?? []) as ApiResource[]

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (category !== 'Todos' && r.category !== category) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      )
    })
  }, [resources, search, category])

  const totalDownloads = resources.reduce((sum, r) => sum + (r.downloads ?? 0), 0)

  function handleOpen(r: ApiResource) {
    trackDownload.mutate(r.id)
    window.open(r.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <CommunityTopbar
        title="Biblioteca de Recursos"
        subtitle={`${resources.length} recursos · ${totalDownloads.toLocaleString('es-CO')} descargas`}
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats por categoría */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {CATEGORIES.filter((c) => c !== 'Todos').map((cat) => {
            const count = resources.filter((r) => r.category === cat).length
            const Icon = CATEGORY_ICONS[cat as Exclude<Category, 'Todos'>] ?? FileText
            const active = category === cat
            return (
              <button
                key={cat}
                onClick={() => setCategory(active ? 'Todos' : cat)}
                className="vc-card flex items-center gap-3 text-left transition-all"
                style={{
                  padding: '0.75rem',
                  borderColor: active ? 'rgba(198,255,60,0.5)' : undefined,
                  boxShadow: active ? '0 0 16px var(--vc-glow-lime)' : 'none',
                }}
              >
                <Icon
                  size={18}
                  style={{ color: active ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }}
                />
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}
                  >
                    {count}
                  </p>
                  <p
                    className="text-[8px] uppercase tracking-wider"
                    style={{ color: 'var(--vc-gray-mid)' }}
                  >
                    {cat}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--vc-gray-mid)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar guías, plantillas, videos..."
            className="w-full rounded-lg py-2.5 pl-10 pr-3 text-xs outline-none"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px solid var(--vc-gray-dark)',
              color: 'var(--vc-white-soft)',
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--vc-white-dim)' }} />
            <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
              {resources.length === 0 ? 'Aún no hay recursos publicados' : 'Sin resultados para tu búsqueda'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
              {filtered.length} recurso{filtered.length !== 1 ? 's' : ''}
              {category !== 'Todos' ? ` en ${category}` : ''}
            </p>
            <div className="space-y-3">
              {filtered.map((r) => (
                <ResourceRow key={r.id} resource={r} onOpen={() => handleOpen(r)} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function ResourceRow({ resource, onOpen }: { resource: ApiResource; onOpen: () => void }) {
  const fmt = FORMAT_CONFIG[resource.type]
  const FmtIcon = fmt.icon

  return (
    <div className="vc-card flex items-center gap-4">
      {resource.thumbnail ? (
        <img
          src={resource.thumbnail}
          alt={resource.title}
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
          style={{ border: `1px solid ${fmt.color}30` }}
        />
      ) : (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${fmt.color}15`, border: `1px solid ${fmt.color}30` }}
        >
          <FmtIcon size={22} style={{ color: fmt.color }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <h4
            className="truncate text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            {resource.title}
          </h4>
        </div>
        {resource.description && (
          <p className="line-clamp-1 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
            {resource.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
            style={{ background: `${fmt.color}15`, color: fmt.color }}
          >
            {resource.category}
          </span>
          {resource.downloads > 0 && (
            <span
              className="flex items-center gap-0.5 text-[9px]"
              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
            >
              <Download size={8} /> {resource.downloads}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onOpen}
        className="vc-btn-primary flex shrink-0 items-center gap-1.5 text-[10px]"
        style={{ padding: '0.4rem 0.85rem' }}
      >
        {resource.type === 'video' ? (
          <>
            <PlayCircle size={12} /> Ver
          </>
        ) : (
          <>
            <Download size={12} /> Abrir
          </>
        )}
      </button>
    </div>
  )
}
