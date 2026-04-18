'use client'

import { use, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Loader2,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useCourseProgress, useCompleteLesson } from '@/hooks/useCourses'

// ── Detalle de curso — viewer de lecciones + progreso ──

type Lesson = { id: string; title: string; duration?: string; content: string; videoUrl?: string }
type Module = { id: string; title: string; description?: string; lessons: Lesson[] }

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useCourseProgress(id)
  const complete = useCompleteLesson(id)

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ points: number; levelUp: boolean; completed: boolean } | null>(null)

  const course = data?.course
  const modules: Module[] = course?.modules ?? []
  const completed = useMemo<string[]>(() => data?.progress?.completedLessons ?? [], [data])
  const percentage = data?.progress?.percentage ?? 0
  const totalLessons = data?.progress?.totalLessons ?? 0
  const isCourseCompleted = data?.progress?.completed ?? false

  const flatLessons = useMemo(
    () => modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))),
    [modules],
  )

  // Selecciona la primera lección no completada al cargar
  useEffect(() => {
    if (!activeLessonId && flatLessons.length > 0) {
      const firstPending = flatLessons.find((l) => !completed.includes(l.id))
      setActiveLessonId(firstPending?.id ?? flatLessons[0].id)
    }
  }, [flatLessons, completed, activeLessonId])

  const activeLesson = flatLessons.find((l) => l.id === activeLessonId)
  const activeIndex = flatLessons.findIndex((l) => l.id === activeLessonId)
  const isActiveDone = activeLessonId ? completed.includes(activeLessonId) : false

  const handleComplete = async () => {
    if (!activeLessonId || isActiveDone) return
    try {
      const res = await complete.mutateAsync(activeLessonId)
      const wasCompleted = res?.completed ?? false
      setFeedback({ points: 5, levelUp: false, completed: wasCompleted })
      setTimeout(() => setFeedback(null), 3500)
      // Avanza automáticamente a la siguiente lección pendiente
      const next = flatLessons[activeIndex + 1]
      if (next) setTimeout(() => setActiveLessonId(next.id), 900)
    } catch {}
  }

  const goNext = () => {
    const next = flatLessons[activeIndex + 1]
    if (next) setActiveLessonId(next.id)
  }
  const goPrev = () => {
    const prev = flatLessons[activeIndex - 1]
    if (prev) setActiveLessonId(prev.id)
  }

  if (isLoading) {
    return (
      <>
        <CommunityTopbar title="Cargando..." />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
        </div>
      </>
    )
  }

  if (!course) {
    return (
      <>
        <CommunityTopbar title="Curso no encontrado" />
        <div className="p-6">
          <Link href="/cursos" className="text-sm" style={{ color: 'var(--vc-lime-main)' }}>
            ← Volver a Cursos
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <CommunityTopbar title={course.title} subtitle={LEVEL_LABELS[course.level] || course.level} />

      {/* Feedback flotante */}
      {feedback && (
        <div
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-bold shadow-2xl"
          style={{
            background: 'var(--vc-gradient-primary)',
            color: 'var(--vc-black)',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 0 32px var(--vc-glow-strong)',
            animation: 'vc-reveal 0.3s ease-out',
          }}
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} />
            {feedback.completed ? '¡Curso completado! +55 pts' : '¡Lección completada! +5 pts'}
          </span>
        </div>
      )}

      <div className="flex-1 p-4 md:p-6">
        <Link
          href="/cursos"
          className="mb-4 inline-flex items-center gap-1 text-xs transition-colors hover:opacity-80"
          style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}
        >
          <ArrowLeft size={12} /> Cursos
        </Link>

        {/* Hero: título + progreso */}
        <div className="vc-card mb-4 overflow-hidden p-0">
          <div
            className="relative h-28 md:h-36"
            style={{ background: course.cover || 'var(--vc-gradient-primary)' }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(10,10,10,0.9) 100%)' }}
            />
            <div className="absolute bottom-4 left-5 right-5">
              <p
                className="mb-1 text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
              >
                {LEVEL_LABELS[course.level] || course.level}
              </p>
              <h1
                className="text-lg font-bold leading-tight md:text-2xl"
                style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
              >
                {course.title}
              </h1>
            </div>
            {isCourseCompleted && (
              <div
                className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold"
                style={{
                  background: 'var(--vc-lime-main)',
                  color: 'var(--vc-black)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <Award size={12} /> Completado
              </div>
            )}
          </div>

          <div className="p-5">
            {course.description && (
              <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                {course.description}
              </p>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                    {completed.length} / {totalLessons} lecciones
                  </span>
                  <span
                    style={{
                      color: percentage === 100 ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {percentage}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--vc-black-soft)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      background: 'var(--vc-gradient-primary)',
                      boxShadow: percentage > 0 ? '0 0 8px var(--vc-glow-lime)' : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: sidebar + viewer */}
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Sidebar de módulos/lecciones */}
          <aside className="vc-card p-0">
            <div
              className="px-4 py-3 text-[10px] uppercase tracking-[0.2em]"
              style={{
                color: 'var(--vc-lime-main)',
                fontFamily: 'var(--font-mono)',
                borderBottom: '1px solid var(--vc-gray-dark)',
              }}
            >
              Contenido
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 lg:max-h-[calc(100vh-360px)]">
              {modules.map((mod, mIdx) => (
                <div key={mod.id} className="mb-4 last:mb-0">
                  <p
                    className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}
                  >
                    Módulo {mIdx + 1} · {mod.title}
                  </p>
                  {mod.lessons.map((lesson) => {
                    const isDone = completed.includes(lesson.id)
                    const isActive = activeLessonId === lesson.id
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonId(lesson.id)}
                        className="mb-0.5 flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition-all"
                        style={{
                          background: isActive ? 'rgba(198, 255, 60, 0.1)' : 'transparent',
                          border: isActive
                            ? '1px solid rgba(198, 255, 60, 0.35)'
                            : '1px solid transparent',
                          color: isActive ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                        }}
                      >
                        <span className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 size={14} color="var(--vc-lime-main)" />
                          ) : (
                            <Circle size={14} color="var(--vc-gray-mid)" />
                          )}
                        </span>
                        <span className="flex-1">
                          <span className="block leading-snug">{lesson.title}</span>
                          {lesson.duration && (
                            <span
                              className="text-[9px]"
                              style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                            >
                              {lesson.duration}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </aside>

          {/* Viewer */}
          <section className="vc-card p-5 md:p-7">
            {activeLesson ? (
              <>
                <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
                  <PlayCircle size={12} color="var(--vc-lime-main)" />
                  {activeLesson.moduleTitle}
                  {activeLesson.duration && (
                    <span> · {activeLesson.duration}</span>
                  )}
                </div>
                <h2
                  className="mb-5 text-xl font-bold md:text-2xl"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                >
                  {activeLesson.title}
                </h2>

                {/* Contenido markdown-lite */}
                <article className="prose-vitalcom mb-8">
                  {renderMarkdown(activeLesson.content)}
                </article>

                {/* Controles */}
                <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: 'var(--vc-gray-dark)' }}>
                  <div className="flex gap-2">
                    <button
                      onClick={goPrev}
                      disabled={activeIndex <= 0}
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs transition-all disabled:opacity-30"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--vc-gray-dark)',
                        color: 'var(--vc-white-dim)',
                      }}
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                    <button
                      onClick={goNext}
                      disabled={activeIndex >= flatLessons.length - 1}
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs transition-all disabled:opacity-30"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--vc-gray-dark)',
                        color: 'var(--vc-white-dim)',
                      }}
                    >
                      Siguiente <ChevronRight size={14} />
                    </button>
                  </div>

                  {isActiveDone ? (
                    <div
                      className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold"
                      style={{
                        background: 'rgba(198, 255, 60, 0.12)',
                        border: '1px solid rgba(198, 255, 60, 0.4)',
                        color: 'var(--vc-lime-main)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      <CheckCircle2 size={14} /> Completada
                    </div>
                  ) : (
                    <button
                      onClick={handleComplete}
                      disabled={complete.isPending}
                      className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-60"
                      style={{
                        background: 'var(--vc-lime-main)',
                        color: 'var(--vc-black)',
                        fontFamily: 'var(--font-heading)',
                        boxShadow: '0 0 20px var(--vc-glow-lime)',
                      }}
                    >
                      {complete.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Marcar como completada
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm" style={{ color: 'var(--vc-gray-mid)' }}>
                  Selecciona una lección para empezar
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

// ── Renderer markdown ligero ────────────────────────────
// Solo soporta: # H1, ## H2, ### H3, **bold**, listas -, [link](url), párrafos.
// Suficiente para contenido de lecciones sin traer una librería de 50kb.
function renderMarkdown(content: string) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = (key: number) => {
    if (listBuffer.length === 0) return
    blocks.push(
      <ul key={`ul-${key}`} className="my-3 space-y-1.5 pl-5">
        {listBuffer.map((item, i) => (
          <li
            key={i}
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--vc-white-dim)', listStyle: 'disc' }}
          >
            {formatInline(item)}
          </li>
        ))}
      </ul>,
    )
    listBuffer = []
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList(i)
      return
    }
    if (trimmed.startsWith('# ')) {
      flushList(i)
      blocks.push(
        <h1 key={i} className="mb-3 mt-4 text-xl font-bold"
          style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          {formatInline(trimmed.slice(2))}
        </h1>,
      )
    } else if (trimmed.startsWith('## ')) {
      flushList(i)
      blocks.push(
        <h2 key={i} className="mb-2 mt-5 text-base font-bold"
          style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
          {formatInline(trimmed.slice(3))}
        </h2>,
      )
    } else if (trimmed.startsWith('### ')) {
      flushList(i)
      blocks.push(
        <h3 key={i} className="mb-2 mt-4 text-sm font-bold"
          style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
          {formatInline(trimmed.slice(4))}
        </h3>,
      )
    } else if (trimmed.startsWith('- ')) {
      listBuffer.push(trimmed.slice(2))
    } else if (/^\d+\.\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^\d+\.\s/, ''))
    } else {
      flushList(i)
      blocks.push(
        <p key={i} className="my-2.5 text-[13px] leading-relaxed"
          style={{ color: 'var(--vc-white-dim)' }}>
          {formatInline(trimmed)}
        </p>,
      )
    }
  })
  flushList(lines.length)

  return <>{blocks}</>
}

// Inline: **bold**, [text](url)
function formatInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)

    const linkIdx = linkMatch?.index ?? Infinity
    const boldIdx = boldMatch?.index ?? Infinity

    if (linkIdx === Infinity && boldIdx === Infinity) {
      nodes.push(remaining)
      break
    }

    if (linkIdx < boldIdx && linkMatch) {
      if (linkIdx > 0) nodes.push(remaining.slice(0, linkIdx))
      nodes.push(
        <Link
          key={`link-${key++}`}
          href={linkMatch[2]}
          className="underline transition-colors hover:opacity-80"
          style={{ color: 'var(--vc-lime-main)' }}
        >
          {linkMatch[1]}
        </Link>,
      )
      remaining = remaining.slice(linkIdx + linkMatch[0].length)
    } else if (boldMatch) {
      if (boldIdx > 0) nodes.push(remaining.slice(0, boldIdx))
      nodes.push(
        <strong key={`b-${key++}`} style={{ color: 'var(--vc-white-soft)', fontWeight: 700 }}>
          {boldMatch[1]}
        </strong>,
      )
      remaining = remaining.slice(boldIdx + boldMatch[0].length)
    }
  }

  return <>{nodes}</>
}
