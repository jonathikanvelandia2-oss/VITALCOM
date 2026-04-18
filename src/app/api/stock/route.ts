import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { updateStockSchema, stockFiltersSchema } from '@/lib/api/schemas/product'
import { StockRepository } from '@/lib/repositories/stock-repository'
import { Prisma } from '@prisma/client'

// ── GET /api/stock — Stock por país con filtros ─────────
// Acceso: EMPLOYEE o superior
export const GET = withErrorHandler(async (req: Request) => {
  await requireRole('EMPLOYEE')

  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams)
  const filters = stockFiltersSchema.parse(params)

  const where: Prisma.StockWhereInput = {}
  if (filters.country) where.country = filters.country
  if (filters.lowStock) where.quantity = { lt: filters.lowStock }

  if (filters.search) {
    where.product = {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ],
    }
  }

  const { items, total } = await StockRepository.list({
    where,
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  })

  return apiSuccess({
    stock: items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit),
    },
  })
})

// ── PUT /api/stock — Actualizar stock ───────────────────
// Upsert: si no existe el registro de stock, lo crea
// Acceso: EMPLOYEE o superior
export const PUT = withErrorHandler(async (req: Request) => {
  await requireRole('EMPLOYEE')

  const body = await req.json()
  const data = updateStockSchema.parse(body)

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true, sku: true, name: true, slug: true },
  })
  if (!product) throw new Error('NOT_FOUND')

  const stock = await prisma.stock.upsert({
    where: {
      productId_country: {
        productId: data.productId,
        country: data.country,
      },
    },
    update: {
      quantity: data.quantity,
      warehouse: data.warehouse,
    },
    create: {
      productId: data.productId,
      country: data.country,
      quantity: data.quantity,
      warehouse: data.warehouse,
    },
    include: {
      product: {
        select: { id: true, sku: true, name: true },
      },
    },
  })

  StockRepository.invalidateProduct(product.id, product.slug)
  return apiSuccess(stock)
})
