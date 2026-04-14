import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { updateStockSchema, stockFiltersSchema } from '@/lib/api/schemas/product'
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

  // Búsqueda por nombre o SKU del producto
  if (filters.search) {
    where.product = {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ],
    }
  }

  const [items, total] = await Promise.all([
    prisma.stock.findMany({
      where,
      include: {
        product: {
          select: { id: true, sku: true, name: true, category: true, active: true, images: true },
        },
      },
      orderBy: { product: { name: 'asc' } },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.stock.count({ where }),
  ])

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

  // Verificar que el producto existe
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true, sku: true, name: true },
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

  return apiSuccess(stock)
})
