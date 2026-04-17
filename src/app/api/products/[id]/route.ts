import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { updateProductSchema } from '@/lib/api/schemas/product'
import { ProductRepository } from '@/lib/repositories/product-repository'

type Ctx = { params: Promise<{ id: string }> }

// ── GET /api/products/[id] — Detalle de producto ────────
export const GET = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  const { id } = await ctx!.params

  const product = await ProductRepository.findById(id)
  if (!product) throw new Error('NOT_FOUND')

  return apiSuccess(product)
})

// ── PUT /api/products/[id] — Actualizar producto ────────
// Acceso: ADMIN o superior
export const PUT = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw new Error('NOT_FOUND')

  const body = await req.json()
  const data = updateProductSchema.parse(body)

  // Si cambia el nombre, regenerar slug
  let slug = existing.slug
  if (data.name && data.name !== existing.name) {
    slug = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Si cambia SKU, verificar unicidad
  if (data.sku && data.sku !== existing.sku) {
    const dup = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (dup) return apiError('Ya existe un producto con ese SKU', 409, 'DUPLICATE')
  }

  const product = await prisma.product.update({
    where: { id },
    data: { ...data, slug },
    include: { stock: true },
  })

  ProductRepository.invalidateOne(product.id, product.slug)
  return apiSuccess(product)
})

// ── DELETE /api/products/[id] — Desactivar producto ─────
// Soft delete: marca active = false, no elimina de BD
// Acceso: ADMIN o superior
export const DELETE = withErrorHandler(async (req: Request, ctx?: Ctx) => {
  await requireRole('ADMIN')
  const { id } = await ctx!.params

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw new Error('NOT_FOUND')

  const product = await prisma.product.update({
    where: { id },
    data: { active: false },
  })

  ProductRepository.invalidateOne(product.id, existing.slug)
  return apiSuccess({ id: product.id, active: false })
})
