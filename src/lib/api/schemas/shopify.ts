import { z } from 'zod'

// ── Schemas Zod para Shopify stores y sincronización ────

export const connectStoreSchema = z.object({
  shopDomain: z.string().min(3).regex(/\.myshopify\.com$/, 'Debe ser un dominio .myshopify.com'),
  storeName: z.string().min(1, 'Nombre de tienda requerido'),
  plan: z.string().optional(),
})

export const syncProductSchema = z.object({
  productId: z.string().min(1),
  sellingPrice: z.number().positive('Precio debe ser positivo'),
  shopifyProductId: z.string().optional().default('pending'),
  shopifyVariantId: z.string().optional(),
})

export const syncMultipleSchema = z.object({
  products: z.array(syncProductSchema).min(1, 'Al menos un producto'),
})

export const updateSyncSchema = z.object({
  sellingPrice: z.number().positive().optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
})

export const storeFiltersSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export type ConnectStoreInput = z.infer<typeof connectStoreSchema>
export type SyncProductInput = z.infer<typeof syncProductSchema>
export type SyncMultipleInput = z.infer<typeof syncMultipleSchema>
export type UpdateSyncInput = z.infer<typeof updateSyncSchema>
export type StoreFilters = z.infer<typeof storeFiltersSchema>
