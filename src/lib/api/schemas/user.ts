import { z } from 'zod'

// ── Schemas de validación para gestión de usuarios (admin) ─

export const USER_ROLES = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE', 'COMMUNITY', 'DROPSHIPPER'] as const
export const AREAS = ['DIRECCION', 'MARKETING', 'COMERCIAL', 'ADMINISTRATIVA', 'LOGISTICA', 'CONTABILIDAD'] as const
export const COUNTRIES = ['CO', 'EC', 'GT', 'CL'] as const

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(6).max(100),
  role: z.enum(USER_ROLES),
  area: z.enum(AREAS).optional(),
  country: z.enum(COUNTRIES).optional(),
  phone: z.string().max(20).optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(USER_ROLES).optional(),
  area: z.enum(AREAS).nullable().optional(),
  country: z.enum(COUNTRIES).nullable().optional(),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  active: z.boolean().optional(),
  verified: z.boolean().optional(),
})

export const userFiltersSchema = z.object({
  role: z.string().optional(),
  area: z.string().optional(),
  active: z.string().optional(), // 'true' | 'false'
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserFilters = z.infer<typeof userFiltersSchema>
