'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Rocket, X, Check, ChevronUp, ChevronDown, Sparkles,
  ArrowRight, Circle, CheckCircle2,
} from 'lucide-react'
import { useOnboarding, useDismissOnboarding } from '@/hooks/useOnboarding'
import { getMotivationMessage } from '@/lib/onboarding/helpers'

// Widget flotante de onboarding — esquina inferior derecha.
// Colapsable. Solo se muestra para COMMUNITY/DROPSHIPPER en primeros 30 días
// o hasta completar pasos required.

export function OnboardingWidget() {
  const { data, isLoading } = useOnboarding()
  const dismissM = useDismissOnboarding()
  const [open, setOpen] = useState(true)
  const [confirmDismiss, setConfirmDismiss] = useState(false)

  if (isLoading || !data || !data.visible) return null

  const progress = data
  const message = getMotivationMessage(progress)

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-[min(380px,calc(100vw-2rem))] rounded-xl border shadow-2xl"
      style={{
        background: 'var(--vc-black-mid)',
        borderColor: 'rgba(198, 255, 60, 0.35)',
        boxShadow: '0 0 40px rgba(198, 255, 60, 0.15), 0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            background: progress.allComplete ? 'var(--vc-lime-main)' : 'rgba(198,255,60,0.15)',
            color: progress.allComplete ? 'var(--vc-black)' : 'var(--vc-lime-main)',
          }}
        >
          {progress.allComplete ? <Sparkles size={16} /> : <Rocket size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">
            {progress.allComplete ? '¡Misión cumplida!' : 'Tu misión Vitalcom'}
          </div>
          <div className="truncate text-[11px] text-[var(--vc-white-dim)]">{message}</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="text-xs font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>
            {progress.percent}%
          </div>
          {open ? <ChevronDown size={16} className="text-[var(--vc-white-dim)]" /> : <ChevronUp size={16} className="text-[var(--vc-white-dim)]" />}
        </div>
      </button>

      {/* Progress bar */}
      <div className="relative h-1 bg-[var(--vc-gray-dark)]">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: `${progress.percent}%`,
            background: 'var(--vc-gradient-primary)',
          }}
        />
      </div>

      {open && (
        <>
          {/* Steps */}
          <ul className="max-h-[60vh] overflow-y-auto px-2 py-2">
            {progress.steps.map((step) => (
              <li key={step.key}>
                <Link
                  href={step.cta.href}
                  className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--vc-black-soft)]"
                >
                  {step.completed ? (
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: 'var(--vc-lime-main)' }}
                    />
                  ) : (
                    <Circle
                      size={18}
                      className="mt-0.5 flex-shrink-0 text-[var(--vc-white-dim)]"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          step.completed
                            ? 'text-[var(--vc-white-dim)] line-through'
                            : 'text-white'
                        }`}
                      >
                        {step.title}
                      </span>
                      {step.required && !step.completed && (
                        <span
                          className="rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                          style={{
                            background: 'rgba(255, 184, 0, 0.15)',
                            color: 'var(--vc-warning)',
                          }}
                        >
                          Clave
                        </span>
                      )}
                      <span className="ml-auto text-[10px] font-mono text-[var(--vc-white-dim)]">
                        +{step.points}
                      </span>
                    </div>
                    {!step.completed && (
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[10px] text-[var(--vc-white-dim)]">
                          {step.description}
                        </span>
                      </div>
                    )}
                    {!step.completed && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--vc-lime-main)' }}>
                        {step.cta.label} <ArrowRight size={10} />
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[var(--vc-gray-dark)] px-4 py-2 text-[11px]">
            <div className="text-[var(--vc-white-dim)]">
              <span className="font-bold text-[var(--vc-lime-main)]">
                {progress.totalPointsEarned}
              </span>{' '}
              / {progress.totalPointsAvailable} puntos
            </div>
            {confirmDismiss ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmDismiss(false)}
                  className="text-[var(--vc-white-dim)] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => dismissM.mutate()}
                  className="font-semibold text-[var(--vc-error)] hover:underline"
                >
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDismiss(true)}
                className="flex items-center gap-1 text-[var(--vc-white-dim)] hover:text-white"
              >
                <X size={11} /> Ocultar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
