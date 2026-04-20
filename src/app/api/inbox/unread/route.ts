import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession, isStaff } from '@/lib/auth/session'

// ── GET /api/inbox/unread ──────────────────────────────
// Devuelve el total de mensajes no leídos y el desglose por área
// del usuario actual. Usado por:
// - Badge en AdminSidebar (total)
// - Contadores por pill de área en la lista de hilos

export const GET = withErrorHandler(async () => {
  const session = await requireSession()

  // Comunidad: solo cuenta hilos donde participa
  if (!isStaff(session.role)) {
    const total = await prisma.inboxMessage.count({
      where: {
        senderId: { not: session.id },
        read: false,
        thread: { messages: { some: { senderId: session.id } } },
      },
    })
    return apiSuccess({ total, byArea: {} })
  }

  // Staff: cuenta mensajes no leídos en hilos visibles para este rol.
  // SUPERADMIN/ADMIN ven todo. MANAGER_AREA/EMPLOYEE ven su área.
  const areaScope = (session.role === 'SUPERADMIN' || session.role === 'ADMIN') ? null : session.area

  const unread = await prisma.inboxMessage.findMany({
    where: {
      senderId: { not: session.id },
      read: false,
      ...(areaScope ? { thread: { area: areaScope } } : {}),
    },
    select: {
      thread: { select: { area: true } },
    },
  })

  const byArea: Record<string, number> = {}
  for (const m of unread) {
    const a = m.thread.area
    byArea[a] = (byArea[a] ?? 0) + 1
  }

  return apiSuccess({ total: unread.length, byArea })
})
