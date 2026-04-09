import { Trophy, Calendar, Heart, MessageCircle, Award, Edit3 } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// Perfil del miembro de comunidad — datos, nivel, logros, actividad
const ACHIEVEMENTS = [
  { name: 'Primer post', icon: '✍️', unlocked: true },
  { name: '10 ventas cerradas', icon: '🎯', unlocked: true },
  { name: 'Curso completado', icon: '🎓', unlocked: true },
  { name: '100 likes recibidos', icon: '❤️', unlocked: true },
  { name: 'Top 50 Colombia', icon: '🇨🇴', unlocked: true },
  { name: 'Mentor de la semana', icon: '🌟', unlocked: false },
  { name: '50 ventas', icon: '🚀', unlocked: false },
  { name: 'Nivel Bosque', icon: '🌳', unlocked: false },
]

export default function PerfilPage() {
  return (
    <>
      <CommunityTopbar
        title="Mi perfil"
        subtitle="Tu progreso en la comunidad Vitalcom"
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Hero del perfil */}
        <div className="vc-card relative overflow-hidden">
          <div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30"
            style={{ background: 'var(--vc-gradient-primary)', filter: 'blur(80px)' }}
          />
          <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-2xl font-black"
              style={{
                background: 'var(--vc-gradient-primary)',
                color: 'var(--vc-black)',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 0 40px var(--vc-glow-strong)',
              }}
            >
              MR
            </div>
            <div className="flex-1">
              <h2
                className="text-2xl font-black"
                style={{
                  color: 'var(--vc-white-soft)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                María Restrepo
              </h2>
              <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
                Dropshipper · Bogotá, Colombia · Miembro desde enero 2026
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    background: 'rgba(198, 255, 60, 0.15)',
                    color: 'var(--vc-lime-main)',
                    border: '1px solid rgba(198, 255, 60, 0.4)',
                  }}
                >
                  Nivel 4 · Tallo 🌱
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: 'var(--vc-black-soft)',
                    color: 'var(--vc-white-dim)',
                    border: '1px solid var(--vc-gray-dark)',
                  }}
                >
                  2.240 puntos
                </span>
              </div>
            </div>
            <button
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-dim)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <Edit3 size={14} /> Editar perfil
            </button>
          </div>

          {/* Progreso al siguiente nivel */}
          <div className="relative mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span style={{ color: 'var(--vc-white-dim)' }}>
                Próximo nivel: <strong style={{ color: 'var(--vc-lime-main)' }}>Rama 🌿</strong>
              </span>
              <span
                className="font-mono"
                style={{ color: 'var(--vc-white-dim)' }}
              >
                2.240 / 3.500
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: 'var(--vc-black-soft)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: '64%',
                  background: 'var(--vc-gradient-primary)',
                  boxShadow: '0 0 12px var(--vc-glow-lime)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={<Heart size={18} />} value="384" label="Likes recibidos" />
          <Stat icon={<MessageCircle size={18} />} value="127" label="Posts y comentarios" />
          <Stat icon={<Award size={18} />} value="3" label="Cursos completados" />
          <Stat icon={<Trophy size={18} />} value="#42" label="Ranking Colombia" />
        </div>

        {/* Logros */}
        <div className="vc-card">
          <h2
            className="mb-5 text-base font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Logros desbloqueados
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {ACHIEVEMENTS.map((a) => (
              <div
                key={a.name}
                className="flex flex-col items-center rounded-xl p-4 text-center"
                style={{
                  background: a.unlocked ? 'rgba(198, 255, 60, 0.08)' : 'var(--vc-black-soft)',
                  border: a.unlocked
                    ? '1px solid rgba(198, 255, 60, 0.3)'
                    : '1px solid var(--vc-gray-dark)',
                  opacity: a.unlocked ? 1 : 0.4,
                  boxShadow: a.unlocked ? '0 0 12px var(--vc-glow-lime)' : 'none',
                }}
              >
                <span className="mb-2 text-3xl">{a.icon}</span>
                <p
                  className="text-[11px] font-semibold"
                  style={{
                    color: a.unlocked ? 'var(--vc-white-soft)' : 'var(--vc-gray-mid)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {a.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="vc-card flex items-center gap-4">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          background: 'rgba(198, 255, 60, 0.12)',
          color: 'var(--vc-lime-main)',
          border: '1px solid rgba(198, 255, 60, 0.3)',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-2xl font-black"
          style={{
            color: 'var(--vc-white-soft)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {value}
        </p>
        <p
          className="text-[10px] uppercase tracking-wider"
          style={{
            color: 'var(--vc-gray-mid)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
