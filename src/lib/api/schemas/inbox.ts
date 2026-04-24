import { z } from 'zod'

// ── Schemas de validación para inbox interno ────────────

export const AREAS = ['DIRECCION', 'MARKETING', 'COMERCIAL', 'ADMINISTRATIVA', 'LOGISTICA', 'CONTABILIDAD'] as const
export const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export const createThreadSchema = z.object({
  subject: z.string().min(1).max(200),
  area: z.enum(AREAS),
  priority: z.enum(PRIORITIES).optional().default('normal'),
  body: z.string().min(1).max(5000), // Primer mensaje del hilo
  receiverId: z.string().optional(),
})

export const createMessageSchema = z.object({
  body: z.string().min(1).max(5000),
  receiverId: z.string().optional(),
})

export const updateThreadSchema = z.object({
  resolved: z.boolean().optional(),
  priority: z.enum(PRIORITIES).optional(),
  area: z.enum(AREAS).optional(),
  assignedToId: z.string().nullable().optional(), // V39 — asignar/desasignar
}).refine((data) => Object.keys(data).length > 0, { message: 'Debes modificar al menos un campo' })

export const threadFiltersSchema = z.object({
  area: z.string().optional(),
  resolved: z.string().optional(), // 'true' | 'false'
  priority: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
})

export type CreateThreadInput = z.infer<typeof createThreadSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>
export type ThreadFilters = z.infer<typeof threadFiltersSchema>
