'use client'

import { Trophy, Crown, Medal, Loader2 } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useRanking } from '@/hooks/useCommunity'
import { formatLevel } from '@/lib/gamification/points'

const POS_STYLES: Record<number, { bg: string; fg: string; icon: any }> = {
  1: { bg: 'rgba(255, 215, 0, 0.18)', fg: '#FFD700', icon: Crown },
  2: { bg: 'rgba(192, 192, 192, 0.18)', fg: '#C0C0C0', icon: Medal },
  3: { bg: 'rgba(205, 127, 50, 0.18)', fg: '#CD7F32', icon: Medal },
}

export default function RankingPage() {
  const { data, isLoading } = useRanking({ limit: 50 })

  const ranking = data?.ranking ?? []
  const myPosition = data?.myPosition ?? 0

  return (
    <>
      <CommunityTopbar
        title="Ranking"
        subtitle={`Top miembros Vitalcom · Tu posición: #${myPosition || '—'}`}
      />
      <div className="flex-1 space-y-6 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : ranking.length === 0 ? (
          <div className="vc-card py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
              Aún no hay miembros en el ranking. ¡Participa en la comunidad para aparecer!
            </p>
          </div>
        ) : (
          <>
            {/* Podio top 3 */}
            {ranking.length >= 3 && (
              <div className="grid gap-4 md:grid-cols-3">
                {ranking.slice(0, 3).map((r: any) => {
                  const s = POS_STYLES[r.position]
                  const Icon = s.icon
                  const initials = (r.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <div key={r.id} className="vc-card relative overflow-hidden text-center"
                      style={{
                        borderColor: r.position === 1 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(198, 255, 60, 0.2)',
                        transform: r.position === 1 ? 'translateY(-8px)' : 'none',
                        boxShadow: r.position === 1 ? '0 0 40px rgba(255, 215, 0, 0.25)' : undefined,
                      }}>
                      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full"
                        style={{ background: s.bg, border: `1px solid ${s.fg}` }}>
                        <Icon size={26} color={s.fg} />
                      </div>
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-lg font-black"
                        style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-display)' }}>
                        {initials}
                      </div>
                      <p className="text-base font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                        {r.name ?? 'Sin nombre'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                        {r.country ?? '—'} · {formatLevel(r.level)}
                      </p>
                      <p className="vc-text-gradient mt-2 text-2xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
                        {r.points.toLocaleString('es-CO')} pts
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tabla resto */}
            {ranking.length > 3 && (
              <div className="vc-card">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                  <Trophy size={18} color="var(--vc-lime-main)" /> Top {ranking.length} Vitalcom
                </h2>
                <div className="space-y-2">
                  {ranking.slice(3).map((r: any) => {
                    const initials = (r.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                    return (
                      <div key={r.id} className="flex items-center gap-4 rounded-lg p-3"
                        style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                        <span className="w-8 text-center text-lg font-black"
                          style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>
                          #{r.position}
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                          style={{ background: 'var(--vc-gradient-primary)', color: 'var(--vc-black)', fontFamily: 'var(--font-heading)' }}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                            {r.name ?? 'Sin nombre'}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                            {r.country ?? '—'} · {formatLevel(r.level)}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                          {r.points.toLocaleString('es-CO')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
