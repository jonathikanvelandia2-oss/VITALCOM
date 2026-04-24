'use client'

import Link from 'next/link'
import {
  Rocket, Sparkles, CheckCircle2, Circle, ArrowRight,
  Trophy, Target, BookOpen, MessageSquare, Zap, Flame,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'
import { useOnboarding } from '@/hooks/useOnboarding'
import { getMotivationMessage } from '@/lib/onboarding/helpers'

// Página de onboarding dedicada — para cuando el user quiere ver todo con calma.
// Incluye atajos a recursos clave de la comunidad (cursos, feed, canales, soporte).

export default function InicioPage() {
  const { data, isLoading } = useOnboarding()

  return (
    <div className="min-h-screen bg-[var(--vc-black)]">
      <CommunityTopbar title="Tu misión Vitalcom" subtitle="Pasos para sacarle el jugo a la plataforma" />

      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
        {isLoading && !data && (
          <div className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-8 text-center text-sm text-[var(--vc-white-dim)]">
            Cargando…
          </div>
        )}

        {data && (
          <>
            {/* Hero */}
            <section
              className="mb-6 rounded-xl border p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(198,255,60,0.08) 0%, rgba(198,255,60,0.02) 100%)',
                borderColor: 'rgba(198, 255, 60, 0.35)',
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--vc-lime-main)]">
                    <Rocket size={11} /> Onboarding
                  </div>
                  <h1
                    className="text-2xl font-bold text-white lg:text-3xl"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {data.allComplete ? '¡Eres un Vitalcommer completo!' : getMotivationMessage(data)}
                  </h1>
                  <p className="mt-2 text-sm text-[var(--vc-white-dim)]">
                    Completa estos pasos y desbloquea todo el ecosistema Vitalcom.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                    {data.percent}%
                  </div>
                  <div className="text-xs text-[var(--vc-white-dim)]">
                    {data.totalPointsEarned} / {data.totalPointsAvailable} pts
                  </div>
                </div>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-[var(--vc-gray-dark)]">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{
                    width: `${data.percent}%`,
                    background: 'var(--vc-gradient-primary)',
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--vc-white-dim)]">
                <span>
                  {data.completedRequired} / {data.totalRequired} pasos clave listos
                </span>
                <span>
                  {data.completedOptional} / {data.totalOptional} bonus completos
                </span>
              </div>
            </section>

            {/* Required steps */}
            <section className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--vc-white-soft)]">
                <Target size={14} style={{ color: 'var(--vc-warning)' }} />
                Pasos clave
              </h2>
              <div className="grid gap-3">
                {data.steps.filter((s) => s.required).map((step) => (
                  <StepCard key={step.key} step={step} />
                ))}
              </div>
            </section>

            {/* Optional */}
            <section className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--vc-white-soft)]">
                <Sparkles size={14} style={{ color: 'var(--vc-lime-main)' }} />
                Subir de nivel
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {data.steps.filter((s) => !s.required).map((step) => (
                  <StepCard key={step.key} step={step} />
                ))}
              </div>
            </section>

            {/* Recursos extra */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--vc-white-soft)]">
                <BookOpen size={14} style={{ color: 'var(--vc-info)' }} />
                Mientras tanto
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                <QuickLink
                  href="/cursos"
                  icon={BookOpen}
                  title="Cursos"
                  description="Dropshipping, marketing, mindset"
                />
                <QuickLink
                  href="/eventos"
                  icon={Flame}
                  title="Eventos en vivo"
                  description="Lives semanales con el equipo"
                />
                <QuickLink
                  href="/asistente"
                  icon={Zap}
                  title="VITA · IA"
                  description="Asistente 24/7 para tus dudas"
                />
                <QuickLink
                  href="/feed"
                  icon={MessageSquare}
                  title="Feed"
                  description="La comunidad en un solo lugar"
                />
                <QuickLink
                  href="/ranking"
                  icon={Trophy}
                  title="Ranking"
                  description="Compite con otros Vitalcommers"
                />
                <QuickLink
                  href="/soporte"
                  icon={MessageSquare}
                  title="Soporte"
                  description="¿Dudas? Estamos al otro lado"
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function StepCard({
  step,
}: {
  step: {
    key: string
    title: string
    description: string
    cta: { label: string; href: string }
    estimatedMin: number
    required: boolean
    completed: boolean
    points: number
  }
}) {
  return (
    <Link
      href={step.cta.href}
      className={`group flex gap-4 rounded-xl border p-4 transition-all ${
        step.completed
          ? 'border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/5'
          : 'border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] hover:border-[var(--vc-lime-main)]/50'
      }`}
    >
      <div className="flex-shrink-0">
        {step.completed ? (
          <CheckCircle2 size={24} style={{ color: 'var(--vc-lime-main)' }} />
        ) : (
          <Circle size={24} className="text-[var(--vc-white-dim)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={`text-sm font-bold ${
              step.completed ? 'text-[var(--vc-white-dim)] line-through' : 'text-white'
            }`}
          >
            {step.title}
          </h3>
          <span className="flex-shrink-0 font-mono text-xs" style={{ color: 'var(--vc-lime-main)' }}>
            +{step.points}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[var(--vc-white-dim)]">{step.description}</p>
        {!step.completed && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--vc-lime-main)] group-hover:underline">
            {step.cta.label} · {step.estimatedMin > 0 ? `${step.estimatedMin} min` : 'cuando pase'}
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </Link>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: typeof BookOpen
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-4 transition-colors hover:border-[var(--vc-lime-main)]/50"
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'rgba(198, 255, 60, 0.1)', color: 'var(--vc-lime-main)' }}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="mt-0.5 text-xs text-[var(--vc-white-dim)]">{description}</div>
      </div>
    </Link>
  )
}
