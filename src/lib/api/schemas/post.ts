import { z } from 'zod'

// ── Schemas de validación para comunidad (posts, comments) ─

export const POST_CATEGORIES = [
  'resultado', 'tip', 'pregunta', 'anuncio', 'mindset', 'ventas', 'general',
] as const

// ── Posts ───────────────────────────────────────────────

export const createPostSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().min(1, 'El contenido es requerido').max(5000),
  category: z.enum(POST_CATEGORIES).optional().default('general'),
  images: z.array(z.string().url()).max(4).optional().default([]),
})

export const updatePostSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(5000).optional(),
  category: z.enum(POST_CATEGORIES).optional(),
  images: z.array(z.string().url()).max(4).optional(),
  pinned: z.boolean().optional(),
})

export const postFiltersSchema = z.object({
  category: z.enum(POST_CATEGORIES).optional(),
  authorId: z.string().optional(),
  pinned: z.string().optional(), // 'true' | 'false'
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
})

// ── Comments ────────────────────────────────────────────

export const createCommentSchema = z.object({
  body: z.string().min(1, 'El comentario es requerido').max(2000),
  parentId: z.string().optional(),
})

// ── Types ────────────────────────────────────────────────

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostFilters = z.infer<typeof postFiltersSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
