import { prisma } from '@/lib/db/prisma'
import { generateMorningBrief } from '@/lib/ai/morning-brief'
import type { BotResult } from './types'

// ── MorningBriefBot (V25) ────────────────────────────────
// Corre cada mañana 13:00 UTC (~8AM COL/EC, 7AM GT, 10AM CL).
// Por cada VITALCOMMER activo, genera el brief del día y lo
// envía como Notification MORNING_BRIEF con dedup por fecha.

export async function runMorningBriefBot(): Promise<BotResult> {
  // Usuarios activos con algo mínimo de historia (evita enviar a usuarios sin data)
  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ['COMMUNITY', 'DROPSHIPPER'] },
    },
    select: { id: true, name: true },
  })

  const today = new Date().toISOString().slice(0, 10)
  const cutoff = new Date(Date.now() - 20 * 3600 * 1000) // 20h dedup

  let usersProcessed = 0
  let notifsCreated = 0
  let errors = 0
  const errorLog: Array<{ userId?: string; message: string }> = []

  for (const user of users) {
    usersProcessed++
    try {
      // Dedup: ya recibió brief en las últimas 20h
      const existing = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'MORNING_BRIEF',
          createdAt: { gte: cutoff },
        },
      })
      if (existing) continue

      const brief = await generateMorningBrief(user.id)

      // Solo crear notif si hay algo que reportar — si no, saltar
      // (usuarios sin data no reciben el brief vacío)
      if (brief.topActions.length === 0 && brief.kpiDelta.revenue7d === 0 && !brief.goal.hasGoal) {
        continue
      }

      const topTitle = brief.topActions[0]?.title ?? 'Tu resumen del día'
      const body = brief.topActions.length > 0
        ? `☀️ ${brief.topActions.length} acción(es) prioritarias · ${brief.summary}`
        : `☀️ ${brief.summary}`

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'MORNING_BRIEF',
          title: `☀️ ${brief.greeting} · ${topTitle}`.slice(0, 140),
          body: body.slice(0, 260),
          link: '/brief',
          meta: {
            date: today,
            topActionsCount: brief.topActions.length,
            revenue7dDeltaPct: brief.kpiDelta.revenue7dDeltaPct,
            goalProgressPct: brief.goal.progressPct,
          },
        },
      })
      notifsCreated++
    } catch (err) {
      errors++
      errorLog.push({
        userId: user.id,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    usersProcessed,
    itemsAffected: notifsCreated,
    notifsCreated,
    errors,
    errorLog,
    summary: `${usersProcessed} usuarios · ${notifsCreated} briefs enviados hoy ${today}.`,
  }
}
