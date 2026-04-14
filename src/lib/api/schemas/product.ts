import { z } from 'zod'

// ── Schemas de validación para productos ────────────────
// Usados en API routes de catálogo y stock.

const CATEGORIES = [
  'Polvos', 'Líquidos', 'Gummis', 'Cápsulas', 'Cremas', 'Línea Mascotas',
] as const

const COUNTRIES = ['CO', 'EC', 'GT', 'CL'] as const

// ── Crear producto ──────────────────────────────────────
export const createProductSchema = z.object({
  sku: z.string().min(3, 'SKU mínimo 3 caracteres').max(30),
  name: z.string().min(2, 'Nombre mínimo 2 caracteres').max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(CATEGORIES).optional(),
  subcategory: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  images: z.array(z.string().url()).max(10).default([]),
  precioPublico: z.number().positive('El precio público debe ser positivo'),
  precioComunidad: z.number().positive('El precio comunidad debe ser positivo'),
  precioPrivado: z.number().positive('El precio privado debe ser positivo'),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    depth: z.number().optional(),
  }).optional(),
  active: z.boolean().default(true),
  bestseller: z.boolean().default(false),
})

// ── Actualizar producto ─────────────────────────────────
export const updateProductSchema = createProductSchema.partial()

// ── Filtros de listado ──────────────────────────────────
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
  active: z.enum(['true', 'false']).optional(),
  bestseller: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(['name', 'sku', 'precioPublico', 'createdAt', 'salesCount']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
})

// ── Stock ───────────────────────────────────────────────
export const updateStockSchema = z.object({
  productId: z.string().cuid(),
  country: z.enum(COUNTRIES),
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  warehouse: z.string().max(100).optional(),
})

export const stockFiltersSchema = z.object({
  country: z.enum(COUNTRIES).optional(),
  search: z.string().optional(),
  lowStock: z.coerce.number().int().optional(), // mostrar solo < N unidades
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductFilters = z.infer<typeof productFiltersSchema>
export type UpdateStockInput = z.infer<typeof updateStockSchema>
export type StockFilters = z.infer<typeof stockFiltersSchema>
