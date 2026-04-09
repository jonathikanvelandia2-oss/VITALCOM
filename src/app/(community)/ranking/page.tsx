import { Trophy, Crown, Medal } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// Leaderboard de comunidad — gamificación estilo Skool
const RANKING = [
  { pos: 1, name: 'Verónica Salas', city: 'Bucaramanga', level: 'Bosque 🌲', points: 28450 },
  { pos: 2, name: 'Andrés Gómez', city: 'Medellín', level: 'Árbol 🌳', points: 22180 },
  { pos: 3, name: 'Tienda Bienestar SAS', city: 'Bogotá', level: 'Árbol 🌳', points: 19840 },
  { pos: 4, name: 'Felipe Morales', city: 'Cali', level: 'Rama 🌿', points: 14250 },
  { pos: 5, name: 'Carolina Vélez', city: 'Bogotá', level: 'Rama 🌿', points: 12680 },
  { pos: 6, name: 'Sebastián Ortiz', city: 'Barranquilla', level: 'Rama 🌿', points: 11240 },
  { pos: 7, name: 'Daniela Cárdenas', city: 'Pereira', level: 'Rama 🌿', points: 9870 },
  { pos: 8, name: 'Mateo Jaramillo', city: 'Manizales', level: 'Tallo 🌱', points: 8420 },
  { pos: 9, name: 'Ana Lucía Torres', city: 'Bogotá', level: 'Tallo 🌱', points: 6900 },
  { pos: 10, name: 'Javier Rincón', city: 'Cúcuta', level: 'Tallo 🌱', points: 5240 },
]

const POS_STYLES: Record<number, { bg: string; fg: string; icon: any }> = {
  1: { bg: 'rgba(255, 215, 0, 0.18)', fg: '#FFD700', icon: Crown },
  2: { bg: 'rgba(192, 192, 192, 0.18)', fg: '#C0C0C0', icon: Medal },
  3: { bg: 'rgba(205, 127, 50, 0.18)', fg: '#CD7F32', icon: Medal },
}

export default function RankingPage() {
  return (
    <>
      <CommunityTopbar
        title="Ranking"
        subtitle="Top miembros Vitalcom · 🇨🇴 Colombia · Abril 2026"
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Podio top 3 */}
        <div className="grid gap-4 md:grid-cols-3">
          {RANKING.slice(0, 3).map((r) => {
            const s = POS_STYLES[r.pos]
            const Icon = s.icon
            return (
              <div
                key={r.pos}
                className="vc-card relative overflow-hidden text-center"
                style={{
                  borderColor:
                    r.pos === 1 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(198, 255, 60, 0.2)',
                  transform: r.pos === 1 ? 'translateY(-8px)' : 'none',
                  boxShadow: r.pos === 1 ? '0 0 40px rgba(255, 215, 0, 0.25)' : undefined,
                }}
              >
                <div
                  className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.fg}`,
                  }}
                >
                  <Icon size={26} color={s.fg} />
                </div>
                <div
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-lg font-black"
                  style={{
                    background: 'var(--vc-gradient-primary)',
                    color: 'var(--vc-black)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {r.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <p
                  className="text-base font-bold"
                  style={{
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {r.name}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                  {r.city} · {r.level}
                </p>
                <p
                  className="vc-text-gradient mt-2 text-2xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {r.points.toLocaleString('es-CO')} pts
                </p>
              </div>
            )
          })}
        </div>

        {/* Tabla resto */}
        <div className="vc-card">
          <h2
            className="mb-4 flex items-center gap-2 text-base font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <Trophy size={18} color="var(--vc-lime-main)" /> Top 10 Vitalcom Colombia
          </h2>
          <div className="space-y-2">
            {RANKING.slice(3).map((r) => (
              <div
                key={r.pos}
                className="flex items-center gap-4 rounded-lg p-3"
                style={{
                  background: 'var(--vc-black-soft)',
                  border: '1px solid var(--vc-gray-dark)',
                }}
              >
                <span
                  className="w-8 text-center text-lg font-black"
                  style={{
                    color: 'var(--vc-lime-main)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  #{r.pos}
                </span>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: 'var(--vc-gradient-primary)',
                    color: 'var(--vc-black)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {r.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: 'var(--vc-white-soft)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {r.name}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                    {r.city} · {r.level}
                  </p>
                </div>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: 'var(--vc-lime-main)' }}
                >
                  {r.points.toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
