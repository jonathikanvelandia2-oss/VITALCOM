import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { createProductSchema, productFiltersSchema } from '@/lib/api/schemas/product'
import { Prisma } from '@prisma/client'

// ── GET /api/products — Listado paginado con filtros ────
// Acceso: cualquier usuario autenticado (comunidad ve solo activos)
export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams)
  const filters = productFiltersSchema.parse(params)

  const where: Prisma.ProductWhereInput = {}

  // Búsqueda por nombre, SKU o tags
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search.toLowerCase() } },
    ]
  }

  if (filters.category) where.category = filters.category
  if (filters.active) where.active = filters.active === 'true'
  if (filters.bestseller) where.bestseller = filters.bestseller === 'true'

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { stock: true },
      orderBy: { [filters.sort]: filters.order },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.product.count({ where }),
  ])

  return apiSuccess({
    products,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit),
    },
  })
})

// ── POST /api/products — Crear producto ─────────────────
// Acceso: ADMIN o superior
export const POST = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')

  const body = await req.json()
  const data = createProductSchema.parse(body)

  // Generar slug desde el nombre
  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  // Verificar SKU y slug únicos
  const existing = await prisma.product.findFirst({
    where: { OR: [{ sku: data.sku }, { slug }] },
  })

  if (existing) {
    const field = existing.sku === data.sku ? 'SKU' : 'slug'
    return apiError(`Ya existe un producto con ese ${field}`, 409, 'DUPLICATE')
  }

  const product = await prisma.product.create({
    data: { ...data, slug },
    include: { stock: true },
  })

  return apiSuccess(product, 201)
})
