import { z } from 'zod'

export const periodSchema = z.enum(['7d', '30d', '90d', 'month', 'year']).default('30d')

export const financeTypeSchema = z.enum(['INGRESO', 'EGRESO'])

export const financeCategorySchema = z.enum([
  'VENTA',
  'COSTO_PRODUCTO',
  'ENVIO',
  'PUBLICIDAD',
  'COMISION_PLATAFORMA',
  'DEVOLUCION',
  'EMPAQUE',
  'OPERATIVO',
  'IMPUESTO',
  'OTRO',
])

export const createEntrySchema = z.object({
  type: financeTypeSchema,
  category: financeCategorySchema,
  amount: z.number().positive('El monto debe ser positivo'),
  date: z.string().datetime().optional(),
  currency: z.string().default('COP'),
  description: z.string().max(500).optional(),
})

export const updateEntrySchema = createEntrySchema.partial()

export const entryFiltersSchema = z.object({
  type: financeTypeSchema.optional(),
  category: financeCategorySchema.optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
})

// z.input: lo que el cliente envía (currency opcional porque tiene default)
export type CreateEntryInput = z.input<typeof createEntrySchema>
export type UpdateEntryInput = z.input<typeof updateEntrySchema>
