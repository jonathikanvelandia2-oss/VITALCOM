import { Megaphone, Users, TrendingUp, Target, Play, Pause } from 'lucide-react'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

// Campanas, contenido y metricas de marketing
const KPIS = [
  { label: 'Leads mes', value: '234', icon: Target, color: 'var(--vc-lime-main)' },
  { label: 'Campanas activas', value: '4', icon: Megaphone, color: 'var(--vc-info)' },
  { label: 'ROI promedio', value: '3.2x', icon: TrendingUp, color: 'var(--vc-warning)' },
]

const CAMPAIGNS = [
  { name: 'Lanzamiento Collagen Pro', status: 'activa', budget: '$ 2.400.000', channel: 'Facebook Ads' },
  { name: 'Reel Viral Bienestar', status: 'activa', budget: '$ 800.000', channel: 'Instagram' },
  { name: 'Drop Fitness TikTok', status: 'pausada', budget: '$ 1.200.000', channel: 'TikTok' },
  { name: 'Search Suplementos', status: 'activa', budget: '$ 1.600.000', channel: 'Google' },
]

export default function MarketingPage() {
  return (
    <>
      <AdminTopbar title="Marketing" subtitle="Campanas, contenido y comunidad" />
      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {KPIS.map((k) => (
            <div key={k.label} className="vc-card flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--vc-black-soft)' }}>
                <k.icon size={20} color={k.color} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: 'var(--font-heading)' }}>{k.value}</p>
                <p className="text-[11px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Campanas activas */}
        <div className="vc-card p-5">
          <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Campanas activas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CAMPAIGNS.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg p-4" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--vc-white-soft)' }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{c.channel} &middot; {c.budget}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{
                  color: c.status === 'activa' ? 'var(--vc-lime-main)' : 'var(--vc-warning)',
                  background: 'var(--vc-black-mid)',
                  border: `1px solid ${c.status === 'activa' ? 'var(--vc-lime-main)' : 'var(--vc-warning)'}`,
                }}>
                  {c.status === 'activa' ? <Play size={8} /> : <Pause size={8} />}
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Comunidad stats */}
        <div className="vc-card p-5">
          <h2 className="mb-3 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>Comunidad</h2>
          <div className="flex flex-wrap gap-6">
            <div><p className="text-lg font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>1.547</p><p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>Miembros</p></div>
            <div><p className="text-lg font-bold" style={{ color: 'var(--vc-info)', fontFamily: 'var(--font-heading)' }}>347</p><p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>Tiendas</p></div>
            <div><p className="text-lg font-bold" style={{ color: 'var(--vc-warning)', fontFamily: 'var(--font-heading)' }}>89</p><p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>Posts esta semana</p></div>
          </div>
        </div>
      </div>
    </>
  )
}
