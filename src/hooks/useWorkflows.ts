'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type WorkflowStep = { type: 'auto' | 'manual'; text: string }

export type WorkflowTemplate = {
  id: string
  slug: string | null
  name: string
  emoji: string | null
  description: string | null
  category: string
  target: string | null
  impact: string | null
  steps: WorkflowStep[]
  isPublic: boolean
  uses: number
}

export type WorkflowActivation = {
  id: string
  status: 'ACTIVE' | 'PAUSED'
  executions: number
  successRate: number
  lastRunAt: string | null
  template: {
    id: string
    slug: string | null
    name: string
    emoji: string | null
    description: string | null
    target: string | null
    impact: string | null
    steps: WorkflowStep[]
  }
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data
}

export function useWorkflowTemplates() {
  return useQuery<{ items: WorkflowTemplate[] }>({
    queryKey: ['workflow-templates'],
    queryFn: () => fetchJson('/api/workflows/templates'),
    staleTime: 60_000,
  })
}

export function useWorkflowActivations() {
  return useQuery<{ items: WorkflowActivation[] }>({
    queryKey: ['workflow-activations'],
    queryFn: () => fetchJson('/api/workflows/activations'),
  })
}

export function useActivateWorkflow() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (templateId) =>
      fetchJson('/api/workflows/activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow-activations'] })
      qc.invalidateQueries({ queryKey: ['workflow-templates'] })
    },
  })
}

export function useToggleWorkflow() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; status: 'ACTIVE' | 'PAUSED' }>({
    mutationFn: ({ id, status }) =>
      fetchJson(`/api/workflows/activations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-activations'] }),
  })
}

export function useDeactivateWorkflow() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) =>
      fetchJson(`/api/workflows/activations/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-activations'] }),
  })
}
