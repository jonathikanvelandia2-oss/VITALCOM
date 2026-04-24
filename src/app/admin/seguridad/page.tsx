'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ShieldCheck, ShieldAlert, Activity, AlertTriangle, CheckCircle2,
  User as UserIcon, Lock, Package, ShoppingBag, Phone, FileText,
  DollarSign, Key, Info, Loader2, Search, Download,
} from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import {
  useAuditLogs,
  type AuditFilters,
  type AuditResource,
  type AuditSeverity,
  type AuditLogItem,
} from '@/hooks/useAuditLogs'

const RESOURCE_ICONS: Record<AuditResource, typeof ShieldCheck> = {
  AUTH: Lock,
  USER: UserIcon,
  ROLE: ShieldAlert,
  ORDER: ShoppingBag,
  PRODUCT: Package,
  STOCK: Package,
  INBOX: FileText,
  CHANNEL: Phone,
  FINANCE: DollarSign,
  EXPORT: Download,
  ADMIN_CONFIG: ShieldCheck,
  API_KEY: Key,
  OTHER: Info,
}

const RESOURCE_LABEL: Record<AuditResource, string> = {
  AUTH: 'Autenticación',
  USER: 'Usuario',
  ROLE: 'Rol',
  ORDER: 'Pedido',
  PRODUCT: 'Producto',
  STOCK: 'Stock',
  INBOX: 'Inbox',
  CHANNEL: 'Canal',
  FINANCE: 'Finanzas',
  EXPORT: 'Export',
  ADMIN_CONFIG: 'Config',
  API_KEY: 'API Key',
  OTHER: 'Otro',
}

const SEVERITY_STYLE: Record<AuditSeverity, { bg: string; border: string; fg: string; label: string }> = {
  INFO: {
    bg: 'rgba(60, 198, 255, 0.08)',
    border: 'rgba(60, 198, 255, 0.3)',
    fg: 'var(--vc-info)',
    label: 'Info',
  },
  NOTICE: {
    bg: 'rgba(198, 255, 60, 0.08)',
    border: 'rgba(198, 255, 60, 0.3)',
    fg: 'var(--vc-lime-main)',
    label: 'Aviso',
  },
  WARNING: {
    bg: 'rgba(255, 184, 0, 0.1)',
    border: 'rgba(255, 184, 0, 0.35)',
    fg: 'var(--vc-warning)',
    label: 'Alerta',
  },
  CRITICAL: {
    bg: 'rgba(255, 71, 87, 0.12)',
    border: 'rgba(255, 71, 87, 0.5)',
    fg: 'var(--vc-error)',
    label: 'Crítico',
  },
}

export default function AdminSeguridadPage() {
  const [filters, setFilters] = useState<AuditFilters>({ limit: 50 })
  const [searchInput, setSearchInput] = useState('')
  const { data, isLoading } = useAuditLogs(filters)

  const items = data?.items ?? []
  const stats = data?.stats
  const totalPages = data?.pagination.pages ?? 1
  const currentPage = data?.pagination.page ?? 1

  const severityOrder: AuditSeverity[] = ['CRITICAL', 'WARNING', 'NOTICE', 'INFO']

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <AdminTopbar
        title="Seguridad · Bitácora de auditoría"
        subtitle="Registro inmutable de operaciones sensibles — evidencia para compliance e integraciones externas"
      />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Hero / KPIs */}
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard
            icon={Activity}
            label="Eventos 24h"
            value={stats?.totalLast24h ?? 0}
            hint="últimas 24 horas"
            tone="info"
          />
          <KpiCard
            icon={ShieldAlert}
            label="Críticos 7d"
            value={stats?.criticalLast7d ?? 0}
            hint="acciones sensibles"
            tone={stats && stats.criticalLast7d > 0 ? 'critical' : 'info'}
          />
          <KpiCard
            icon={Lock}
            label="Logins fallidos 1h"
            value={stats?.failedLoginsLastHour ?? 0}
            hint="posibles intentos"
            tone={stats && stats.failedLoginsLastHour >= 5 ? 'warning' : 'info'}
          />
          <KpiCard
            icon={CheckCircle2}
            label="Integridad"
            value={isLoading ? '—' : 'OK'}
            hint="audit log activo"
            tone="success"
          />
        </section>

        {/* Breakdown por severidad últimos 7 días */}
        {stats && (
          <section className="mb-6 rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
              Últimos 7 días · por severidad
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {severityOrder.map((sev) => (
                <div
                  key={sev}
                  className="rounded-lg border p-3"
                  style={{
                    background: SEVERITY_STYLE[sev].bg,
                    borderColor: SEVERITY_STYLE[sev].border,
                  }}
                >
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: SEVERITY_STYLE[sev].fg }}
                  >
                    {SEVERITY_STYLE[sev].label}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {stats.bySeverityLast7d[sev] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Acciones rápidas */}
        <section className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href="/admin/seguridad/compliance"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--vc-lime-main)]/40 bg-[var(--vc-lime-main)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--vc-lime-main)] transition-colors hover:bg-[var(--vc-lime-main)]/20"
          >
            <ShieldCheck size={14} />
            Reporte de compliance
          </Link>
          <a
            href={buildExportUrl(filters)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-3 py-1.5 text-xs font-semibold text-[var(--vc-white-soft)] transition-colors hover:border-[var(--vc-lime-main)] hover:text-[var(--vc-lime-main)]"
          >
            <Download size={14} />
            Exportar CSV
          </a>
        </section>

        {/* Filtros */}
        <section className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={filters.resource ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                resource: e.target.value ? (e.target.value as AuditResource) : undefined,
                page: 1,
              }))
            }
            className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-3 py-1.5 text-xs text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)] focus:outline-none"
          >
            <option value="">Todos los recursos</option>
            {(Object.keys(RESOURCE_LABEL) as AuditResource[]).map((r) => (
              <option key={r} value={r}>
                {RESOURCE_LABEL[r]}
              </option>
            ))}
          </select>

          <select
            value={filters.severity ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                severity: e.target.value ? (e.target.value as AuditSeverity) : undefined,
                page: 1,
              }))
            }
            className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-3 py-1.5 text-xs text-[var(--vc-white-soft)] focus:border-[var(--vc-lime-main)] focus:outline-none"
          >
            <option value="">Todas las severidades</option>
            {severityOrder.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_STYLE[s].label}
              </option>
            ))}
          </select>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setFilters((f) => ({ ...f, search: searchInput.trim() || undefined, page: 1 }))
            }}
            className="flex flex-1 items-center gap-1 min-w-[200px] max-w-md rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-2.5 py-1.5 focus-within:border-[var(--vc-lime-main)]"
          >
            <Search size={14} className="text-[var(--vc-white-dim)]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por resumen o email…"
              className="flex-1 bg-transparent text-xs text-[var(--vc-white-soft)] placeholder-[var(--vc-white-dim)] focus:outline-none"
            />
          </form>

          {(filters.resource || filters.severity || filters.search) && (
            <button
              onClick={() => {
                setFilters({ limit: 50 })
                setSearchInput('')
              }}
              className="rounded-lg border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-3 py-1.5 text-[11px] font-semibold text-[var(--vc-white-dim)] transition-colors hover:border-[var(--vc-lime-main)] hover:text-[var(--vc-lime-main)]"
            >
              Limpiar
            </button>
          )}
        </section>

        {/* Timeline de eventos */}
        <section className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)]">
          {isLoading && items.length === 0 && (
            <div className="flex items-center justify-center p-12 text-sm text-[var(--vc-white-dim)]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-[var(--vc-lime-main)]" />
              Cargando bitácora…
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="p-12 text-center text-sm text-[var(--vc-white-dim)]">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-[var(--vc-lime-main)]" />
              Sin eventos con los filtros actuales.
              <div className="mt-1 text-xs">
                El audit log se alimenta automáticamente con logins, cambios de rol y operaciones críticas.
              </div>
            </div>
          )}

          <ul className="divide-y divide-[var(--vc-gray-dark)]">
            {items.map((item) => (
              <AuditRow key={item.id} item={item} />
            ))}
          </ul>
        </section>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-[var(--vc-white-dim)]">
            <span>
              Página {currentPage} de {totalPages} · {data?.pagination.total ?? 0} eventos
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, currentPage - 1) }))}
                className="rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-3 py-1 font-semibold disabled:opacity-40 hover:border-[var(--vc-lime-main)]"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: currentPage + 1 }))}
                className="rounded-md border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] px-3 py-1 font-semibold disabled:opacity-40 hover:border-[var(--vc-lime-main)]"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Activity
  label: string
  value: number | string
  hint: string
  tone: 'info' | 'warning' | 'critical' | 'success'
}) {
  const color =
    tone === 'critical' ? 'var(--vc-error)' :
    tone === 'warning' ? 'var(--vc-warning)' :
    tone === 'success' ? 'var(--vc-lime-main)' :
    'var(--vc-info)'
  return (
    <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vc-white-dim)]">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{value}</div>
          <div className="mt-0.5 text-[10px] text-[var(--vc-white-dim)]">{hint}</div>
        </div>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  )
}

function AuditRow({ item }: { item: AuditLogItem }) {
  const Icon = RESOURCE_ICONS[item.resource] ?? Info
  const severity = SEVERITY_STYLE[item.severity]
  const when = new Date(item.createdAt)
  const relative = useMemo(() => formatRelative(when), [when])

  const actorLabel =
    item.actor?.name || item.actor?.email || item.actorEmail || 'Sistema / anónimo'

  const resourceHref = getResourceHref(item)

  return (
    <li className="flex gap-3 p-4 transition-colors hover:bg-[var(--vc-black-soft)]">
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border"
        style={{
          background: severity.bg,
          borderColor: severity.border,
          color: severity.fg,
        }}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: severity.bg,
              color: severity.fg,
              border: `1px solid ${severity.border}`,
            }}
          >
            {severity.label}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--vc-white-dim)]">
            {RESOURCE_LABEL[item.resource]} · {item.action}
          </span>
          <span className="text-[10px] text-[var(--vc-white-dim)]">{relative}</span>
        </div>
        <p className="mt-1 text-sm text-[var(--vc-white-soft)]">{item.summary}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[var(--vc-white-dim)]">
          <span>
            <UserIcon size={10} className="mr-1 inline" />
            {actorLabel}
          </span>
          {item.ip && <span className="font-mono">{item.ip}</span>}
          {resourceHref && (
            <Link
              href={resourceHref}
              className="text-[var(--vc-lime-main)] hover:underline"
            >
              Ver recurso →
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}

function getResourceHref(item: AuditLogItem): string | null {
  if (!item.resourceId) return null
  switch (item.resource) {
    case 'ORDER':
      return `/admin/pedidos/${item.resourceId}`
    case 'USER':
    case 'ROLE':
      return `/admin/clientes/${item.resourceId}`
    default:
      return null
  }
}

function buildExportUrl(filters: AuditFilters): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && k !== 'page' && k !== 'limit') {
      params.set(k, String(v))
    }
  })
  const qs = params.toString()
  return qs ? `/api/admin/audit-logs/export?${qs}` : '/api/admin/audit-logs/export'
}

function formatRelative(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `hace ${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `hace ${min}m`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `hace ${hour}h`
  const day = Math.floor(hour / 24)
  if (day < 7) return `hace ${day}d`
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
