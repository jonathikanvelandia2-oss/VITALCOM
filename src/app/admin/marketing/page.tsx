'use client'

import { Megaphone, Users, TrendingUp, Target, Loader2, ShoppingBag, MessageCircle, Store, Heart } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAdminMarketing } from '@/hooks/useAdminStats'
import { useState } from 'react'

// Marketing = adquisición + engagement + conversión por canal.
// Fuente de datos: User (signups), Order (conversión por source), Post/Comment (engagement),
// ShopifyStore (dropshippers activados).
// Campañas pagadas (Meta/TikTok Ads) serán V7+ cuando conectemos esos APIs.

const SOURCE_LABELS: Record<string, string> = {
  DIRECT: 'Venta directa',
  COMMUNITY: 'Comunidad',
  DROPSHIPPER: 'Dropshipper',
  ZENDU: 'Zendu',
}

function formatCOP(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$ ${(v / 1_000_000).toFixed(1)} M`
  if (Math.abs(v) >= 1_000) return `$ ${(v / 1_000).toFixed(0)} K`
  return `$ ${Math.round(v).toLocaleString('es-CO')}`
}

export default function MarketingPage() {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useAdminMarketing(days)
  const periodLabel = days === 7 ? '7 días' : days === 30 ? '30 días' : '90 días'

  return (
    <>
      <AdminTopbar title="Marketing" subtitle={`Adquisición + engagement · Últimos ${periodLabel}`} />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
              style={{
                background: days === d ? 'rgba(198,255,60,0.15)' : 'var(--vc-black-mid)',
                color: days === d ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                border: `1px solid ${days === d ? 'rgba(198,255,60,0.4)' : 'var(--vc-gray-dark)'}`,
                fontFamily: 'var(--font-heading)',
              }}>
              {d}d
            </button>
          ))}
        </div>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MktKpi
                icon={Target} color="var(--vc-lime-main)"
                value={String(data.kpis.newUsers)}
                label={`Nuevos registros (${periodLabel})`}
                subtitle={`${data.kpis.newUsersUp ? '+' : ''}${data.kpis.newUsersDelta}% vs. anterior`}
              />
              <MktKpi
                icon={Store} color="var(--vc-info)"
                value={String(data.kpis.verifiedStores)}
                label="Nuevas tiendas Shopify"
                subtitle={`${data.kpis.totalStores} tiendas totales`}
              />
              <MktKpi
                icon={Users} color="var(--vc-warning)"
                value={data.kpis.totalCommunity.toLocaleString('es-CO')}
                label="Comunidad activa"
                subtitle={`${data.kpis.newDropshippers} dropshippers nuevos`}
              />
              <MktKpi
                icon={Heart} color="#f97316"
                value={String(data.kpis.engagementRatio)}
                label="Engagement ratio"
                subtitle={`${data.kpis.postsCount} posts · ${data.kpis.commentsCount} comentarios`}
              />
            </div>

            {/* Signups por día */}
            <div className="vc-card" style={{ minHeight: 240 }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Nuevos registros por día
                </h2>
                <div className="flex gap-3 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--vc-lime-main)' }}>● Comunidad</span>
                  <span style={{ color: 'var(--vc-info)' }}>● Dropshippers</span>
                </div>
              </div>
              <div className="flex h-40 items-end gap-1">
                {data.signupsByDay.map((d: any, i: number) => {
                  const max = Math.max(...data.signupsByDay.map((x: any) => x.community + x.dropshipper), 1)
                  const total = d.community + d.dropshipper
                  const h = total > 0 ? Math.max(4, (total / max) * 100) : 1
                  const communityShare = total > 0 ? (d.community / total) * h : 0
                  const dropshipperShare = total > 0 ? (d.dropshipper / total) * h : 0
                  return (
                    <div key={i} className="flex flex-1 flex-col justify-end">
                      <div className="w-full rounded-t-sm" style={{ height: `${dropshipperShare}%`, background: 'var(--vc-info)', opacity: 0.85 }}
                        title={`${d.date}: ${d.dropshipper} dropshippers`} />
                      <div className="w-full" style={{ height: `${communityShare}%`, background: 'var(--vc-lime-main)', opacity: 0.85 }}
                        title={`${d.date}: ${d.community} comunidad`} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Conversión por canal */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="vc-card">
                <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Conversión por canal
                </h2>
                {data.conversionBySource.length === 0 ? (
                  <p className="py-6 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin pedidos en el periodo</p>
                ) : (
                  <div className="space-y-4">
                    {data.conversionBySource.map((s: any) => (
                      <div key={s.source} className="rounded-lg p-4"
                        style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>
                            {SOURCE_LABELS[s.source] ?? s.source}
                          </span>
                          <span className="font-mono text-xs font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                            {formatCOP(s.revenue)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px]"
                          style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                          <span>{s.orders} pedidos · Ticket {formatCOP(s.avgTicket)}</span>
                          <span style={{ color: s.deltaVsPrev >= 0 ? 'var(--vc-lime-main)' : 'var(--vc-error)' }}>
                            {s.deltaVsPrev >= 0 ? '+' : ''}{s.deltaVsPrev}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="vc-card">
                <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  Posts con más engagement
                </h2>
                {data.topPosts.length === 0 ? (
                  <p className="py-6 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>Sin posts en el periodo</p>
                ) : (
                  <div className="space-y-3">
                    {data.topPosts.map((p: any) => (
                      <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg p-3"
                        style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{p.title}</p>
                          <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                            @{p.author}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
                          <span className="flex items-center gap-1" style={{ color: 'var(--vc-lime-main)' }}>
                            <Heart size={10} /> {p.likes}
                          </span>
                          <span className="flex items-center gap-1" style={{ color: 'var(--vc-info)' }}>
                            <MessageCircle size={10} /> {p.comments}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Campañas pagadas — placeholder V7 */}
            <div className="vc-card p-5" style={{ background: 'linear-gradient(135deg, var(--vc-black-mid), var(--vc-black-soft))' }}>
              <div className="flex items-start gap-3">
                <Megaphone size={18} style={{ color: 'var(--vc-warning)' }} />
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                    Campañas pagadas
                  </h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                    Meta Ads, TikTok Ads y Google Ads llegan en V7. Por ahora todas las métricas de arriba son 100% orgánicas.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function MktKpi({ icon: Icon, color, value, label, subtitle }: {
  icon: typeof ShoppingBag; color: string; value: string; label: string; subtitle: string
}) {
  return (
    <div className="vc-card flex items-center gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--vc-black-soft)' }}>
        <Icon size={20} color={color} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold truncate" style={{ color, fontFamily: 'var(--font-heading)' }}>{value}</p>
        <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{label}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--vc-white-dim)' }}>{subtitle}</p>
      </div>
    </div>
  )
}
