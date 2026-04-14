'use client'

import { GraduationCap, Clock, Award, PlayCircle, Loader2 } from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useCourses } from '@/hooks/useCourses'

// ── Plataforma de cursos — datos reales de BD ───────────

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #a8ff00 0%, #7fb800 100%)',
  'linear-gradient(135deg, #c6ff3c 0%, #4a6b00 100%)',
  'linear-gradient(135deg, #dfff80 0%, #a8ff00 100%)',
  'linear-gradient(135deg, #7fb800 0%, #c6ff3c 100%)',
  'linear-gradient(135deg, #4a6b00 0%, #dfff80 100%)',
  'linear-gradient(135deg, #a8ff00 0%, #c6ff3c 100%)',
]

export default function CursosPage() {
  const { data, isLoading } = useCourses()
  const courses = data?.courses ?? []

  return (
    <>
      <CommunityTopbar
        title="Cursos"
        subtitle={isLoading ? 'Cargando...' : `Formación oficial Vitalcom · ${courses.length} cursos`}
      />
      <div className="flex-1 space-y-6 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <GraduationCap size={48} color="var(--vc-gray-dark)" className="mx-auto mb-4" />
              <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
                Próximamente — estamos preparando los cursos
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((c: any, i: number) => (
              <article key={c.id} className="vc-card group flex flex-col overflow-hidden" style={{ padding: 0 }}>
                {/* Cover */}
                <div className="relative h-32" style={{ background: c.cover || COVER_GRADIENTS[i % COVER_GRADIENTS.length] }}>
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.85) 100%)' }} />
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: 'rgba(10,10,10,0.7)', color: 'var(--vc-lime-main)', backdropFilter: 'blur(8px)' }}>
                      {LEVEL_LABELS[c.level] || c.level}
                    </span>
                  </div>
                  <PlayCircle size={42} className="absolute bottom-3 right-3" color="var(--vc-black)" fill="var(--vc-lime-main)" />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-3 text-base font-bold leading-snug"
                    style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                    {c.title}
                  </h3>
                  {c.description && (
                    <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                      {c.description}
                    </p>
                  )}

                  <div className="mb-3 flex items-center gap-3 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
                    <span className="flex items-center gap-1">
                      <GraduationCap size={11} /> {c.lessonsCount} lecciones
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {c.modulesCount} módulos
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-auto">
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span style={{ color: 'var(--vc-gray-mid)' }}>Progreso</span>
                      <span style={{
                        color: c.completed ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {c.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)' }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${c.progress}%`,
                          background: 'var(--vc-gradient-primary)',
                          boxShadow: c.progress > 0 ? '0 0 8px var(--vc-glow-lime)' : 'none',
                        }} />
                    </div>
                    {c.completed && (
                      <p className="mt-2 flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                        <Award size={11} /> ¡Curso completado!
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
