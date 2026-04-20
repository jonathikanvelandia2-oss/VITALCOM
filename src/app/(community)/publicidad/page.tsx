'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Rocket, Plus, TrendingUp, DollarSign, Target, Loader2, X, Trash2,
  Activity, MousePointer, Eye, ArrowRight, AlertCircle, PlusCircle,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import {
  useAdAccounts,
  useCreateAdAccount,
  useDeleteAdAccount,
  useAdSpend,
  useCreateAdSpend,
  useDeleteAdSpend,
  useAdsOverview,
  type AdPlatform,
  type AdAccount,
} from '@/hooks/useAds'

// ── Tracker de publicidad ────────────────────────────────
// V14 — Fundación V2 del plan. Funciona con entrada manual hoy
// y queda lista para OAuth (Meta/TikTok/Google) cuando lleguen
// credenciales. Cada gasto registrado alimenta el P&G.

const PLATFORM_META: Record<AdPlatform, { label: string; color: string; bg: string }> = {
  META:   { label: 'Meta Ads',   color: '#1877F2', bg: 'rgba(24,119,242,0.15)' },
  TIKTOK: { label: 'TikTok Ads', color: '#FF0050', bg: 'rgba(255,0,80,0.15)' },
  GOOGLE: { label: 'Google Ads', color: '#4285F4', bg: 'rgba(66,133,244,0.15)' },
  OTHER:  { label: 'Otro',       color: 'var(--vc-gray-mid)', bg: 'rgba(128,128,128,0.15)' },
}

function formatMoney(n: number, currency = 'COP'): string {
  if (currency === 'USD') return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export default function PublicidadPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showSpendForm, setShowSpendForm] = useState(false)

  const accountsQ = useAdAccounts()
  const overviewQ = useAdsOverview(period)
  const spendQ = useAdSpend()

  const accounts = accountsQ.data?.items ?? []
  const overview = overviewQ.data
  const spendEntries = spendQ.data?.items ?? []

  const loading = accountsQ.isLoading || overviewQ.isLoading

  return (
    <>
      <CommunityTopbar title="Publicidad" subtitle="Tracker de ads · Meta, TikTok, Google" />
      <div className="flex-1 space-y-6 p-4 md:p-6">

        {/* Selector de periodo + botones */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className="rounded-lg px-4 py-2 text-xs font-bold"
                style={{
                  background: period === d ? 'rgba(198,255,60,0.1)' : 'var(--vc-black-soft)',
                  color: period === d ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                  border: period === d ? '1px solid rgba(198,255,60,0.3)' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {d}d
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAccountForm(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold"
              style={{
                background: 'var(--vc-black-soft)',
                color: 'var(--vc-white-dim)',
                border: '1px solid var(--vc-gray-dark)',
              }}
            >
              <Plus size={14} /> Nueva cuenta
            </button>
            <button
              onClick={() => setShowSpendForm(true)}
              disabled={accounts.length === 0}
              className="vc-btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <PlusCircle size={14} /> Registrar gasto
            </button>
          </div>
        </div>

        {/* Estado vacío inicial */}
        {!loading && accounts.length === 0 && (
          <div
            className="vc-card p-8 text-center"
            style={{ borderColor: 'rgba(198, 255, 60, 0.25)' }}
          >
            <Rocket size={40} className="mx-auto mb-3" style={{ color: 'var(--vc-lime-main)' }} />
            <h3
              className="mb-2 text-base font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              Conecta tus plataformas de ads
            </h3>
            <p className="mx-auto mb-4 max-w-md text-xs" style={{ color: 'var(--vc-white-dim)' }}>
              Registra tus cuentas de Meta, TikTok o Google Ads manualmente hoy. Cada gasto que
              registres alimenta automáticamente tu P&G y calcula tu ROAS real cruzándolo con
              tus pedidos.
            </p>
            <button
              onClick={() => setShowAccountForm(true)}
              className="vc-btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus size={14} /> Agregar primera cuenta
            </button>
          </div>
        )}

        {/* KPIs + ROAS */}
        {overview && accounts.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard
                icon={DollarSign}
                label="Gasto total"
                value={formatMoney(overview.kpis.totalSpend)}
                color="var(--vc-warning)"
              />
              <KpiCard
                icon={TrendingUp}
                label="ROAS"
                value={overview.kpis.roas > 0 ? `${overview.kpis.roas.toFixed(2)}x` : '—'}
                sub={overview.kpis.roas >= 3 ? 'rentable' : overview.kpis.roas > 0 ? 'bajo' : 'sin ventas'}
                color={
                  overview.kpis.roas >= 3
                    ? 'var(--vc-lime-main)'
                    : overview.kpis.roas > 0
                      ? 'var(--vc-warning)'
                      : 'var(--vc-gray-mid)'
                }
              />
              <KpiCard
                icon={MousePointer}
                label="CPC promedio"
                value={overview.kpis.cpc > 0 ? formatMoney(overview.kpis.cpc) : '—'}
                sub={overview.kpis.totalClicks > 0 ? `${overview.kpis.totalClicks.toLocaleString()} clicks` : ''}
                color="var(--vc-info)"
              />
              <KpiCard
                icon={Target}
                label="CPA"
                value={overview.kpis.cpa > 0 ? formatMoney(overview.kpis.cpa) : '—'}
                sub={
                  overview.kpis.totalConversions > 0
                    ? `${overview.kpis.totalConversions} conv.`
                    : 'sin conv.'
                }
                color="var(--vc-lime-main)"
              />
            </div>

            {/* Revenue vs Spend */}
            <div className="vc-card p-5">
              <h2
                className="mb-4 flex items-center gap-2 text-sm font-bold"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
              >
                <Activity size={14} color="var(--vc-lime-main)" /> ROAS · últimos {period} días
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <RoasItem label="Ingresos (pedidos)" value={formatMoney(overview.kpis.totalRevenue)} color="var(--vc-lime-main)" />
                <RoasItem label="Gasto en ads" value={formatMoney(overview.kpis.totalSpend)} color="var(--vc-warning)" />
                <RoasItem
                  label="Ganancia bruta ads"
                  value={formatMoney(overview.kpis.totalRevenue - overview.kpis.totalSpend)}
                  color={
                    overview.kpis.totalRevenue - overview.kpis.totalSpend >= 0
                      ? 'var(--vc-lime-main)'
                      : 'var(--vc-error)'
                  }
                />
              </div>
              {overview.kpis.totalSpend > 0 && overview.kpis.roas < 3 && (
                <div
                  className="mt-4 flex items-start gap-2 rounded-lg p-3 text-[11px]"
                  style={{
                    background: 'rgba(255,184,0,0.1)',
                    border: '1px solid rgba(255,184,0,0.3)',
                    color: 'var(--vc-warning)',
                  }}
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    ROAS por debajo del umbral rentable (3x). Benchmarks LATAM: 3x mínimo, 5x+ ideal.
                    Revisa tus productos más rentables en{' '}
                    <Link href="/mi-pyg" className="font-bold underline">
                      Mi P&G
                    </Link>
                    .
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown por plataforma */}
            {overview.byPlatform.length > 0 && (
              <div className="vc-card p-5">
                <h2
                  className="mb-4 text-sm font-bold"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                >
                  Reparto por plataforma
                </h2>
                <div className="space-y-3">
                  {overview.byPlatform.map((p) => {
                    const meta = PLATFORM_META[p.platform]
                    return (
                      <div key={p.platform} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: meta.color, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                            {meta.label}
                          </span>
                          <span style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}>
                            {formatMoney(p.spend)} · {p.share.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)' }}>
                          <div
                            className="h-full transition-all"
                            style={{ width: `${p.share}%`, background: meta.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Cuentas conectadas */}
        {accounts.length > 0 && (
          <div>
            <h2 className="heading-sm mb-3 px-1">Mis cuentas ({accounts.length})</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((a) => (
                <AccountCard key={a.id} account={a} />
              ))}
            </div>
          </div>
        )}

        {/* Últimos gastos */}
        {spendEntries.length > 0 && (
          <div className="vc-card p-5">
            <h2
              className="mb-4 text-sm font-bold"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
            >
              Últimos gastos registrados
            </h2>
            <div className="space-y-2">
              {spendEntries.slice(0, 15).map((s) => (
                <SpendRow key={s.id} entry={s} />
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1 text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
              <ArrowRight size={10} /> Cada gasto aparece automáticamente en tu{' '}
              <Link href="/mi-pyg" className="font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                P&G
              </Link>{' '}
              categoría PUBLICIDAD.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        )}
      </div>

      {showAccountForm && <AccountFormModal onClose={() => setShowAccountForm(false)} />}
      {showSpendForm && (
        <SpendFormModal accounts={accounts} onClose={() => setShowSpendForm(false)} />
      )}
    </>
  )
}

// ── Componentes ────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="vc-card p-4">
      <Icon size={18} style={{ color }} className="mb-2" />
      <p className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </p>
      {sub && (
        <p className="mt-1 text-[9px]" style={{ color: 'var(--vc-white-dim)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function RoasItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
    >
      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)' }}>
        {label}
      </p>
      <p className="mt-1 text-lg font-bold" style={{ color, fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
    </div>
  )
}

function AccountCard({ account }: { account: AdAccount }) {
  const del = useDeleteAdAccount()
  const meta = PLATFORM_META[account.platform]
  const cr = account.totalClicks > 0 && account.totalConversions > 0
    ? ((account.totalConversions / account.totalClicks) * 100).toFixed(1)
    : null

  return (
    <div
      className="vc-card flex flex-col gap-3 p-4"
      style={{ borderColor: `${meta.color}30` }}
    >
      <div className="flex items-start justify-between">
        <span
          className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>
        {!account.connected && (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
            style={{
              background: 'var(--vc-black-soft)',
              color: 'var(--vc-warning)',
              border: '1px solid rgba(255,184,0,0.3)',
            }}
          >
            Manual
          </span>
        )}
      </div>
      <div>
        <p
          className="text-sm font-bold"
          style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
        >
          {account.accountName ?? account.accountId}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          ID: {account.accountId} · {account.currency}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
            {formatMoney(account.totalSpend, account.currency)}
          </p>
          <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>
            gasto total
          </p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--vc-info)', fontFamily: 'var(--font-heading)' }}>
            {account.totalClicks.toLocaleString()}
          </p>
          <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>
            clicks
          </p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--vc-warning)', fontFamily: 'var(--font-heading)' }}>
            {cr ? `${cr}%` : '—'}
          </p>
          <p className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>
            CR
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          if (confirm(`¿Desactivar cuenta ${meta.label}? Los gastos históricos se conservan.`))
            del.mutate(account.id)
        }}
        disabled={del.isPending}
        className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] disabled:opacity-50"
        style={{
          background: 'transparent',
          color: 'var(--vc-gray-mid)',
          border: '1px solid var(--vc-gray-dark)',
        }}
      >
        <Trash2 size={10} /> Desactivar
      </button>
    </div>
  )
}

function SpendRow({ entry }: { entry: any }) {
  const del = useDeleteAdSpend()
  const meta = PLATFORM_META[entry.account.platform as AdPlatform]
  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3"
      style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
    >
      <span
        className="shrink-0 rounded px-2 py-0.5 text-[9px] font-bold"
        style={{ background: meta.bg, color: meta.color }}
      >
        {meta.label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--vc-white-soft)' }}>
            {formatDate(entry.date)}
          </span>
          {entry.campaign && (
            <span className="truncate text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
              · {entry.campaign.name}
            </span>
          )}
        </div>
        {entry.notes && (
          <p className="truncate text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
            {entry.notes}
          </p>
        )}
      </div>
      <div className="flex gap-3 text-[10px]" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
        {entry.impressions != null && (
          <span className="flex items-center gap-1">
            <Eye size={9} /> {entry.impressions.toLocaleString()}
          </span>
        )}
        {entry.clicks != null && (
          <span className="flex items-center gap-1">
            <MousePointer size={9} /> {entry.clicks}
          </span>
        )}
        {entry.conversions != null && (
          <span className="flex items-center gap-1">
            <Target size={9} /> {entry.conversions}
          </span>
        )}
      </div>
      <p
        className="w-24 shrink-0 text-right text-xs font-bold"
        style={{ color: 'var(--vc-warning)', fontFamily: 'var(--font-mono)' }}
      >
        {formatMoney(entry.spend, entry.account.currency)}
      </p>
      <button
        onClick={() => {
          if (confirm('¿Eliminar este gasto? Se removerá también del P&G.')) del.mutate(entry.id)
        }}
        disabled={del.isPending}
        aria-label="Eliminar"
        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:brightness-125 disabled:opacity-50"
        style={{ color: 'var(--vc-gray-mid)', border: '1px solid var(--vc-gray-dark)' }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ── Modal: nueva cuenta ────────────────────────────────
function AccountFormModal({ onClose }: { onClose: () => void }) {
  const create = useCreateAdAccount()
  const [form, setForm] = useState<{
    platform: AdPlatform
    accountId: string
    accountName: string
    currency: string
  }>({
    platform: 'META',
    accountId: '',
    accountName: '',
    currency: 'COP',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create.mutate(
      {
        platform: form.platform,
        accountId: form.accountId,
        accountName: form.accountName || undefined,
        currency: form.currency,
      },
      { onSuccess: onClose },
    )
  }

  const inputStyle = {
    background: 'var(--vc-black-soft)',
    border: '1px solid var(--vc-gray-dark)',
    color: 'var(--vc-white-soft)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="vc-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: 'rgba(198,255,60,0.3)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            Nueva cuenta publicitaria
          </h3>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} color="var(--vc-gray-mid)" />
          </button>
        </div>
        <p className="mb-4 text-[11px]" style={{ color: 'var(--vc-gray-mid)' }}>
          Registra tu cuenta de Meta, TikTok o Google Ads. OAuth automático llegará pronto —
          mientras tanto ingresa gastos manualmente.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Plataforma</Label>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as AdPlatform })}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              <option value="META">Meta Ads (Facebook / Instagram)</option>
              <option value="TIKTOK">TikTok Ads</option>
              <option value="GOOGLE">Google Ads</option>
              <option value="OTHER">Otro (influencer, prensa, etc.)</option>
            </select>
          </div>
          <div>
            <Label>ID de cuenta o etiqueta</Label>
            <input
              required
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              placeholder="Ej: 1234567890 o act_123"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <Label>Nombre descriptivo (opcional)</Label>
            <input
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              placeholder="Ej: Cuenta principal CO"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <Label>Moneda</Label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              <option value="COP">COP — Peso colombiano</option>
              <option value="USD">USD — Dólar</option>
              <option value="CLP">CLP — Peso chileno</option>
              <option value="GTQ">GTQ — Quetzal</option>
            </select>
          </div>
          {create.isError && (
            <p className="text-xs" style={{ color: 'var(--vc-error)' }}>
              {(create.error as Error).message}
            </p>
          )}
          <button
            type="submit"
            disabled={create.isPending}
            className="vc-btn-primary flex w-full items-center justify-center gap-2 py-2 disabled:opacity-50"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Crear cuenta
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Modal: registrar gasto ─────────────────────────────
function SpendFormModal({
  accounts,
  onClose,
}: {
  accounts: AdAccount[]
  onClose: () => void
}) {
  const create = useCreateAdSpend()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    accountId: accounts[0]?.id ?? '',
    date: today,
    spend: '',
    impressions: '',
    clicks: '',
    conversions: '',
    notes: '',
  })

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === form.accountId),
    [accounts, form.accountId],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const spend = parseFloat(form.spend)
    if (!spend || spend < 0) return
    create.mutate(
      {
        accountId: form.accountId,
        date: new Date(form.date).toISOString(),
        spend,
        impressions: form.impressions ? parseInt(form.impressions) : undefined,
        clicks: form.clicks ? parseInt(form.clicks) : undefined,
        conversions: form.conversions ? parseInt(form.conversions) : undefined,
        notes: form.notes || undefined,
      },
      { onSuccess: onClose },
    )
  }

  const inputStyle = {
    background: 'var(--vc-black-soft)',
    border: '1px solid var(--vc-gray-dark)',
    color: 'var(--vc-white-soft)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="vc-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: 'rgba(198,255,60,0.3)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-sm font-bold"
            style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
          >
            Registrar gasto de ads
          </h3>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} color="var(--vc-gray-mid)" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Cuenta</Label>
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {PLATFORM_META[a.platform].label} · {a.accountName ?? a.accountId}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Gasto ({selectedAccount?.currency ?? 'COP'})</Label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.spend}
                onChange={(e) => setForm({ ...form, spend: e.target.value })}
                placeholder="85000"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Impresiones</Label>
              <input
                type="number"
                min={0}
                value={form.impressions}
                onChange={(e) => setForm({ ...form, impressions: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Clicks</Label>
              <input
                type="number"
                min={0}
                value={form.clicks}
                onChange={(e) => setForm({ ...form, clicks: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Conversiones</Label>
              <input
                type="number"
                min={0}
                value={form.conversions}
                onChange={(e) => setForm({ ...form, conversions: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ej: Campaña colágeno hidrolizado CO"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div
            className="rounded-lg p-3 text-[10px]"
            style={{
              background: 'rgba(198,255,60,0.05)',
              border: '1px solid rgba(198,255,60,0.2)',
              color: 'var(--vc-white-dim)',
            }}
          >
            Este gasto se registrará automáticamente en tu P&G como egreso de categoría PUBLICIDAD.
          </div>
          {create.isError && (
            <p className="text-xs" style={{ color: 'var(--vc-error)' }}>
              {(create.error as Error).message}
            </p>
          )}
          <button
            type="submit"
            disabled={create.isPending}
            className="vc-btn-primary flex w-full items-center justify-center gap-2 py-2 disabled:opacity-50"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
            Registrar gasto
          </button>
        </form>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider"
      style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-heading)' }}
    >
      {children}
    </label>
  )
}
