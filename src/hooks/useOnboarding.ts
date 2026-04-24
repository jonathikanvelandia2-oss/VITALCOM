'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { OnboardingStep } from '@/lib/onboarding/helpers'

// ── Hook de onboarding — React Query ────────────────

export type OnboardingResponse = {
  steps: OnboardingStep[]
  completedRequired: number
  totalRequired: number
  completedOptional: number
  totalOptional: number
  percent: number
  percentRequired: number
  nextStep: OnboardingStep | null
  totalPointsEarned: number
  totalPointsAvailable: number
  allRequiredComplete: boolean
  allComplete: boolean
  visible: boolean
  createdAt: string
  dismissedAt: string | null
}

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar')
  return json.data
}

export function useOnboarding() {
  return useQuery<OnboardingResponse>({
    queryKey: ['onboarding'],
    queryFn: () => fetcher('/api/onboarding/progress'),
    refetchInterval: 60_000, // refresca cada minuto — captura cambios cuando el user completa tareas
    staleTime: 30_000,
  })
}

export function useDismissOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/onboarding/dismiss', { method: 'POST' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Error al ocultar')
      return json.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
  })
}
