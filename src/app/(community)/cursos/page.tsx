import { GraduationCap, Clock, Award, PlayCircle } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// Plataforma de cursos para la comunidad Vitalcom
const COURSES = [
  {
    title: 'Dropshipping de bienestar desde cero',
    level: 'Principiante',
    duration: '3 h 20 min',
    lessons: 18,
    progress: 65,
    cover: 'linear-gradient(135deg, #a8ff00 0%, #7fb800 100%)',
  },
  {
    title: 'Marketing digital para productos naturales',
    level: 'Intermedio',
    duration: '5 h 10 min',
    lessons: 24,
    progress: 32,
    cover: 'linear-gradient(135deg, #c6ff3c 0%, #4a6b00 100%)',
  },
  {
    title: 'Cierra ventas por WhatsApp como un PRO',
    level: 'Intermedio',
    duration: '2 h 45 min',
    lessons: 12,
    progress: 0,
    cover: 'linear-gradient(135deg, #dfff80 0%, #a8ff00 100%)',
  },
  {
    title: 'Mindset del emprendedor de bienestar',
    level: 'Principiante',
    duration: '1 h 50 min',
    lessons: 9,
    progress: 100,
    cover: 'linear-gradient(135deg, #7fb800 0%, #c6ff3c 100%)',
  },
  {
    title: 'Construye tu marca personal en redes',
    level: 'Avanzado',
    duration: '6 h 00 min',
    lessons: 30,
    progress: 0,
    cover: 'linear-gradient(135deg, #4a6b00 0%, #dfff80 100%)',
  },
  {
    title: 'Operación logística con Dropi paso a paso',
    level: 'Principiante',
    duration: '2 h 10 min',
    lessons: 11,
    progress: 12,
    cover: 'linear-gradient(135deg, #a8ff00 0%, #c6ff3c 100%)',
  },
]

export default function CursosPage() {
  return (
    <>
      <CommunityTopbar
        title="Cursos"
        subtitle="Formación oficial Vitalcom · 6 cursos activos"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {COURSES.map((c) => (
            <article
              key={c.title}
              className="vc-card group flex flex-col overflow-hidden"
              style={{ padding: 0 }}
            >
              {/* Cover */}
              <div
                className="relative h-32"
                style={{ background: c.cover }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.85) 100%)',
                  }}
                />
                <div className="absolute left-3 top-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      background: 'rgba(10, 10, 10, 0.7)',
                      color: 'var(--vc-lime-main)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {c.level}
                  </span>
                </div>
                <PlayCircle
                  size={42}
                  className="absolute bottom-3 right-3"
                  color="var(--vc-black)"
                  fill="var(--vc-lime-main)"
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3
                  className="mb-3 text-base font-bold leading-snug"
                  style={{
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {c.title}
                </h3>

                <div
                  className="mb-3 flex items-center gap-3 text-[11px]"
                  style={{ color: 'var(--vc-white-dim)' }}
                >
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {c.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap size={11} /> {c.lessons} lecciones
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-auto">
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span style={{ color: 'var(--vc-gray-mid)' }}>Progreso</span>
                    <span
                      style={{
                        color: c.progress === 100 ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {c.progress}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'var(--vc-black-soft)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.progress}%`,
                        background: 'var(--vc-gradient-primary)',
                        boxShadow: c.progress > 0 ? '0 0 8px var(--vc-glow-lime)' : 'none',
                      }}
                    />
                  </div>
                  {c.progress === 100 && (
                    <p
                      className="mt-2 flex items-center gap-1 text-[10px] font-bold"
                      style={{ color: 'var(--vc-lime-main)' }}
                    >
                      <Award size={11} /> ¡Curso completado!
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
