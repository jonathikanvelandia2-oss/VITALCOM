'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ── V32 — Health Score hooks ──

export type HealthSegment = 'NEW' | 'ACTIVE' | 'AT_RISK' | 'CHURNED'

export interface HealthBreakdown {
  loginRecency: number
  community: number
  orders: number
  store: number
  learning: number
  goals: number
  points: number
}

export interface HealthScore {
  score: number
  segment: HealthSegment
  breakdown: HealthBreakdown
  previousScore: number | null
  scoreDelta: number | null
  previousSegment: HealthSegment | null
  computedAt: string
}

export interface AdminHealthRow {
  id: string
  userId: string
  score: number
  segment: HealthSegment
  scoreDelta: number | null
  previousSegment: HealthSegment | null
  breakdown: HealthBreakdown
  computedAt: string
  lastRetentionTriggerAt: string | null
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    country: string | null
    role: string
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error')
  return json.data as T
}

export function useMyHealthScore() {
  return useQuery<HealthScore>({
    queryKey: ['health-score', 'me'],
    queryFn: () => fetchJson('/api/health'),
    refetchInterval: 300_000, // 5min
  })
}

export function useRefreshMyHealthScore() {
  const qc = useQueryClient()
  return useMutation<
    { score: number; segment: HealthSegment; breakdown: HealthBreakdown; reasons: string[] },
    Error,
    void
  >({
    mutationFn: () => fetchJson('/api/health', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health-score'] }),
  })
}

export function useAdminHealthScores(segment?: HealthSegment | null) {
  return useQuery<{
    items: AdminHealthRow[]
    counts: Record<HealthSegment, number>
  }>({
    queryKey: ['health-scores', 'admin', segment],
    queryFn: () =>
      fetchJson(
        `/api/admin/health${segment ? `?segment=${segment}` : ''}`,
      ),
    refetchInterval: 60_000,
  })
}

// ── Meta para UI ──
export const SEGMENT_META: Record<
  HealthSegment,
  { label: string; color: string; tagline: string }
> = {
  NEW: {
    label: 'Nuevo',
    color: '#8B9BA8',
    tagline: 'Te damos la bienvenida. Tu score empezará a calcularse al cumplir 7 días.',
  },
  ACTIVE: {
    label: 'Activo',
    color: '#C6FF3C',
    tagline: 'Estás creciendo — sigue con la inercia.',
  },
  AT_RISK: {
    label: 'En riesgo',
    color: '#FFB800',
    tagline: 'Hay señales de bajada. Revisa qué factor subir.',
  },
  CHURNED: {
    label: 'Inactivo',
    color: '#FF4757',
    tagline: 'No te vemos hace tiempo. Volvamos a activar tu tienda.',
  },
}

export const FACTOR_META: Record<
  keyof HealthBreakdown,
  { label: string; max: number; hint: string; link: string }
> = {
  loginRecency: {
    label: 'Actividad reciente',
    max: 20,
    hint: 'Entra cada semana al dashboard.',
    link: '/feed',
  },
  community: {
    label: 'Comunidad',
    max: 15,
    hint: 'Posts y comentarios suman puntos.',
    link: '/feed',
  },
  orders: {
    label: 'Pedidos últimos 30d',
    max: 25,
    hint: 'El factor más importante. 10+ pedidos/mes = full.',
    link: '/pedidos',
  },
  store: {
    label: 'Tienda Shopify',
    max: 10,
    hint: 'Conecta tu tienda para sincronizar pedidos.',
    link: '/mi-tienda',
  },
  learning: {
    label: 'Formación',
    max: 10,
    hint: '1 lección/semana mantiene el ritmo.',
    link: '/cursos',
  },
  goals: {
    label: 'Metas',
    max: 10,
    hint: 'Define una meta mensual con progreso.',
    link: '/metas',
  },
  points: {
    label: 'Puntos gamificación',
    max: 10,
    hint: '500+ puntos acumulados = full.',
    link: '/ranking',
  },
}
