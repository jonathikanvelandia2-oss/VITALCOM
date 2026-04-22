import { prisma } from '@/lib/db/prisma'

// ── Sistema de gamificación Vitalcom ────────────────────
// Niveles con naming natural/wellness alineado al branding

export type LevelDef = { level: number; name: string; emoji: string; minPoints: number }

export const LEVELS: LevelDef[] = [
  { level: 1, name: 'Semilla', emoji: '🌱', minPoints: 0 },
  { level: 2, name: 'Brote', emoji: '🌿', minPoints: 100 },
  { level: 3, name: 'Hoja', emoji: '🍃', minPoints: 500 },
  { level: 4, name: 'Tallo', emoji: '🌱', minPoints: 1500 },
  { level: 5, name: 'Rama', emoji: '🌿', minPoints: 3500 },
  { level: 6, name: 'Árbol', emoji: '🌳', minPoints: 7000 },
  { level: 7, name: 'Bosque', emoji: '🌲', minPoints: 15000 },
  { level: 8, name: 'Ecosistema', emoji: '🌍', minPoints: 30000 },
  { level: 9, name: 'Vital', emoji: '⚡', minPoints: 60000 },
]

// Puntos por acción
export const POINTS = {
  POST_CREATED: 10,
  COMMENT_CREATED: 3,
  LIKE_RECEIVED: 1,
  COURSE_COMPLETED: 50,
  LESSON_COMPLETED: 5,
  EVENT_ATTENDED: 20,
  TOOL_USED: 2,
  REFERRAL: 100,
} as const

export type PointAction = keyof typeof POINTS

/** Calcula el nivel basado en puntos */
export function getLevelFromPoints(points: number) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (points >= lvl.minPoints) current = lvl
    else break
  }
  return current
}

/** Calcula el siguiente nivel y progreso */
export function getLevelProgress(points: number) {
  const current = getLevelFromPoints(points)
  const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1
  const next = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null

  if (!next) {
    return { current, next: null, progress: 100, pointsToNext: 0 }
  }

  const range = next.minPoints - current.minPoints
  const earned = points - current.minPoints
  const progress = Math.round((earned / range) * 100)

  return {
    current,
    next,
    progress: Math.min(progress, 100),
    pointsToNext: next.minPoints - points,
  }
}

/** Otorga puntos a un usuario y actualiza su nivel de forma atómica.
 *  La transacción evita race conditions si dos acciones llegan
 *  simultáneamente (ej: like + comment en el mismo milisegundo).
 */
export async function awardPoints(userId: string, action: PointAction) {
  const amount = POINTS[action]

  return prisma.$transaction(async tx => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { points: { increment: amount } },
      select: { points: true, level: true },
    })

    const newLevel = getLevelFromPoints(user.points)
    const levelUp = newLevel.level !== user.level

    if (levelUp) {
      await tx.user.update({
        where: { id: userId },
        data: { level: newLevel.level },
      })
    }

    return { points: user.points, levelUp, newLevel }
  })
}

/** Formatea el nombre del nivel con emoji */
export function formatLevel(level: number) {
  const lvl = LEVELS.find(l => l.level === level) ?? LEVELS[0]
  return `${lvl.name} ${lvl.emoji}`
}
