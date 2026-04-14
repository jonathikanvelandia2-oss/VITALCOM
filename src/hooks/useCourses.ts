'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error al cargar')
  return json.data
}

async function mutator(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error en operación')
  return json.data
}

/** Lista de cursos con progreso del usuario */
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => fetcher('/api/courses'),
  })
}

/** Detalle de curso con módulos y progreso */
export function useCourseProgress(courseId: string | null) {
  return useQuery({
    queryKey: ['course', courseId, 'progress'],
    queryFn: () => fetcher(`/api/courses/${courseId}/progress`),
    enabled: !!courseId,
  })
}

/** Marcar lección como completada */
export function useCompleteLesson(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lessonId: string) =>
      mutator(`/api/courses/${courseId}/progress`, 'POST', { lessonId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', courseId, 'progress'] })
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

/** Lista de eventos */
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => fetcher('/api/events'),
  })
}
