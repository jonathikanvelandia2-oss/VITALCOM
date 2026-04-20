'use client'

import { FileText, Download, BookOpen, MessageSquare, Loader2, Heart } from 'lucide-react'
import Link from 'next/link'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminContent } from '@/hooks/useAdminContent'

// ── Admin de contenido ──────────────────────────────────
// Agrega Resource (biblioteca), Course (academia) y Post (feed).

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export default function ContenidoPage() {
  const { data, isLoading } = useAdminContent()

  if (isLoading) {
    return (
      <>
        <AdminTopbar title="Contenido" subtitle="Biblioteca, cursos y feed" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </>
    )
  }

  const k = data?.kpis
  const topResources = data?.topResources ?? []
  const latestCourses = data?.latestCourses ?? []
  const latestPosts = data?.latestPosts ?? []

  return (
    <>
      <AdminTopbar title="Contenido" subtitle="Biblioteca, cursos y feed de comunidad" />
      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={FileText}
            value={`${k?.resourcesPublished ?? 0}`}
            sub={`de ${k?.resourcesTotal ?? 0} totales`}
            label="Recursos publicados"
            color="var(--vc-lime-main)"
          />
          <KpiCard
            icon={Download}
            value={(k?.resourcesDownloads ?? 0).toLocaleString('es-CO')}
            sub="acumuladas"
            label="Descargas"
            color="var(--vc-info)"
          />
          <KpiCard
            icon={BookOpen}
            value={`${k?.coursesPublished ?? 0}`}
            sub={`de ${k?.coursesTotal ?? 0} creados`}
            label="Cursos activos"
            color="var(--vc-warning)"
          />
          <KpiCard
            icon={MessageSquare}
            value={`${k?.postsRecent ?? 0}`}
            sub={`${k?.postsTotal ?? 0} en total`}
            label="Posts últimos 30d"
            color="var(--vc-lime-main)"
          />
        </div>

        {/* Grid de 2 columnas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top recursos */}
          <section className="vc-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="flex items-center gap-2 text-sm font-bold"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
              >
                <FileText size={14} color="var(--vc-lime-main)" /> Top recursos descargados
              </h2>
            </div>
            {topResources.length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                Aún no hay recursos publicados
              </p>
            ) : (
              <div className="space-y-2">
                {topResources.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg p-3"
                    style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: 'rgba(198,255,60,0.15)',
                        color: 'var(--vc-lime-main)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      #{i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xs font-semibold"
                        style={{ color: 'var(--vc-white-soft)' }}
                      >
                        {r.title}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                      >
                        {r.category} · {r.type.toUpperCase()}
                      </p>
                    </div>
                    <span
                      className="flex shrink-0 items-center gap-1 text-[10px] font-bold"
                      style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                    >
                      <Download size={10} /> {r.downloads.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Últimos cursos */}
          <section className="vc-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="flex items-center gap-2 text-sm font-bold"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
              >
                <BookOpen size={14} color="var(--vc-lime-main)" /> Cursos de academia
              </h2>
              <Link
                href="/cursos"
                className="text-[10px] font-semibold hover:underline"
                style={{ color: 'var(--vc-lime-main)' }}
              >
                Ver todos →
              </Link>
            </div>
            {latestCourses.length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                Aún no hay cursos creados
              </p>
            ) : (
              <div className="space-y-2">
                {latestCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cursos/${c.slug}`}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:brightness-125"
                    style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
                  >
                    <div
                      className="h-10 w-10 shrink-0 rounded-lg"
                      style={{ background: c.cover ?? 'var(--vc-gradient-primary)' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xs font-semibold"
                        style={{ color: 'var(--vc-white-soft)' }}
                      >
                        {c.title}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                      >
                        {LEVEL_LABELS[c.level] ?? c.level} · {c.published ? 'Publicado' : 'Borrador'} · {formatDate(c.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Últimos posts del feed */}
        <section className="vc-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-sm font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              <MessageSquare size={14} color="var(--vc-lime-main)" /> Últimos posts del feed
            </h2>
            <Link
              href="/feed"
              className="text-[10px] font-semibold hover:underline"
              style={{ color: 'var(--vc-lime-main)' }}
            >
              Ver feed →
            </Link>
          </div>
          {latestPosts.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
              Aún no hay posts en el feed
            </p>
          ) : (
            <div className="space-y-2">
              {latestPosts.map((p) => (
                <div
                  key={p.id}
                  className="flex gap-3 rounded-lg p-3"
                  style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
                >
                  <div className="min-w-0 flex-1">
                    {p.title && (
                      <p className="text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                        {p.title}
                      </p>
                    )}
                    <p className="line-clamp-1 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                      {p.body}
                    </p>
                    <p
                      className="mt-1 text-[10px]"
                      style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                    >
                      {p.authorName} · {formatDate(p.createdAt)}
                      {p.category ? ` · ${p.category}` : ''}
                    </p>
                  </div>
                  <span
                    className="flex shrink-0 items-center gap-1 text-[10px]"
                    style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                  >
                    <Heart size={10} /> {p.likes}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function KpiCard({
  icon: Icon,
  value,
  sub,
  label,
  color,
}: {
  icon: any
  value: string
  sub: string
  label: string
  color: string
}) {
  return (
    <div className="vc-card flex items-center gap-4 p-5">
      <Icon size={22} style={{ color }} />
      <div className="min-w-0">
        <p className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>
          {value}
          <span className="ml-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
            {sub}
          </span>
        </p>
        <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
