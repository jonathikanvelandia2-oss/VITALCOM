import { prisma } from '@/lib/db/prisma'
import type { NotificationType } from '@prisma/client'

// ── Service de notificaciones in-app ───────────────────
// Centraliza la creación de entradas en la campana.
// NO envía emails — los emails son side-effects separados
// del trigger del evento (order PATCH, post like, etc.).
//
// Todas las funciones son fire-and-forget safe: si falla
// la inserción, la operación principal no se ve afectada
// (se loggea y se sigue).

type CreateInput = {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
  meta?: Record<string, unknown>
}

/**
 * Crea una notificación. Silenciosamente falla si la BD está caída
 * para no bloquear el flujo principal.
 */
export async function createNotification(input: CreateInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        meta: input.meta as any,
      },
    })
  } catch (err) {
    console.error('[notifications] createNotification failed:', err)
  }
}

/**
 * Crea múltiples notificaciones de una vez (ej. notificar a todos los
 * managers de un área cuando llega un hilo).
 */
export async function createBulkNotifications(
  userIds: string[],
  template: Omit<CreateInput, 'userId'>,
): Promise<void> {
  if (userIds.length === 0) return
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: template.type,
        title: template.title,
        body: template.body,
        link: template.link,
        meta: template.meta as any,
      })),
    })
  } catch (err) {
    console.error('[notifications] createBulkNotifications failed:', err)
  }
}

/**
 * IDs de usuarios staff que pueden recibir notificaciones globales
 * (ORDER_NEW, etc). SUPERADMIN/ADMIN + managers del área.
 */
export async function getStaffIdsForArea(area?: string | null): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      active: true,
      OR: [
        { role: { in: ['SUPERADMIN', 'ADMIN'] } },
        ...(area ? [{ role: { in: ['MANAGER_AREA', 'EMPLOYEE'] as Array<'MANAGER_AREA' | 'EMPLOYEE'> }, area: area as any }] : []),
      ],
    },
    select: { id: true },
  })
  return users.map((u) => u.id)
}
