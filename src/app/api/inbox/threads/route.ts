import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireSession, isStaff } from '@/lib/auth/session'
import { createThreadSchema, threadFiltersSchema } from '@/lib/api/schemas/inbox'

// ── GET /api/inbox/threads — Listar hilos ───────────────
export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const url = new URL(req.url)
  const filters = threadFiltersSchema.parse({
    area: url.searchParams.get('area') || undefined,
    resolved: url.searchParams.get('resolved') || undefined,
    priority: url.searchParams.get('priority') || undefined,
    page: url.searchParams.get('page') || undefined,
    limit: url.searchParams.get('limit') || undefined,
  })

  const where: any = {}

  // Staff ve hilos de su área (o todos si es admin)
  if (isStaff(session.role)) {
    if (filters.area) {
      where.area = filters.area
    } else if (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN' && session.area) {
      where.area = session.area
    }
  } else {
    // Comunidad solo ve hilos donde participó
    where.messages = { some: { senderId: session.id } }
  }

  if (filters.resolved !== undefined) where.resolved = filters.resolved === 'true'
  if (filters.priority) where.priority = filters.priority

  const skip = (filters.page - 1) * filters.limit

  const [threads, total] = await Promise.all([
    prisma.inboxThread.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, area: true } },
          },
        },
        _count: { select: { messages: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatar: true, area: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take: filters.limit,
    }),
    prisma.inboxThread.count({ where }),
  ])

  // Contar mensajes no leídos por el usuario
  const mapped = await Promise.all(threads.map(async (t) => {
    const unreadCount = await prisma.inboxMessage.count({
      where: { threadId: t.id, read: false, senderId: { not: session.id } },
    })

    const lastMessage = t.messages[0]
    return {
      id: t.id,
      subject: t.subject,
      area: t.area,
      priority: t.priority,
      resolved: t.resolved,
      messageCount: t._count.messages,
      unreadCount,
      // V39 — campos nuevos para SLA + asignación
      assignedTo: t.assignedTo,
      firstResponseAt: t.firstResponseAt,
      resolvedAt: t.resolvedAt,
      lastMessage: lastMessage ? {
        body: lastMessage.body,
        senderName: lastMessage.sender.name,
        senderArea: lastMessage.sender.area,
        createdAt: lastMessage.createdAt,
      } : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }))

  return apiSuccess({
    threads: mapped,
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) },
  })
})

// ── POST /api/inbox/threads — Crear hilo ────────────────
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()

  const body = await req.json()
  const data = createThreadSchema.parse(body)

  const thread = await prisma.inboxThread.create({
    data: {
      subject: data.subject,
      area: data.area,
      priority: data.priority,
      messages: {
        create: {
          senderId: session.id,
          receiverId: data.receiverId,
          body: data.body,
        },
      },
    },
    include: {
      messages: {
        include: { sender: { select: { id: true, name: true, area: true } } },
      },
    },
  })

  return apiSuccess(thread, 201)
})
