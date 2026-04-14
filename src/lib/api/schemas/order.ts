import { z } from 'zod'

// ── Schemas de validación para pedidos ──────────────────

const COUNTRIES = ['CO', 'EC', 'GT', 'CL'] as const
const SOURCES = ['DIRECT', 'ZENDU', 'COMMUNITY', 'DROPSHIPPER'] as const
const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED'] as const

// Transiciones de estado válidas
export const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED', 'RETURNED'],
  DELIVERED:  ['RETURNED'],
  CANCELLED:  [],
  RETURNED:   [],
}

// ── Crear pedido ────────────────────────────────────────
const orderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive('Cantidad debe ser positiva'),
  unitPrice: z.number().positive('Precio unitario debe ser positivo'),
})

export const createOrderSchema = z.object({
  source: z.enum(SOURCES).default('DIRECT'),
  country: z.enum(COUNTRIES),
  customerName: z.string().min(2, 'Nombre mínimo 2 caracteres').max(200),
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z.string().max(20).optional(),
  customerAddress: z.string().max(500).optional(),
  items: z.array(orderItemSchema).min(1, 'Al menos un producto'),
  shipping: z.number().min(0).default(0),
  notes: z.string().max(1000).optional(),
  externalRef: z.string().max(100).optional(),
})

// ── Actualizar estado ───────────────────────────────────
export const updateOrderStatusSchema = z.object({
  status: z.enum(STATUSES),
  trackingCode: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
})

// ── Filtros de listado ──────────────────────────────────
export const orderFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(STATUSES).optional(),
  source: z.enum(SOURCES).optional(),
  country: z.enum(COUNTRIES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'total', 'number']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type OrderFilters = z.infer<typeof orderFiltersSchema>
