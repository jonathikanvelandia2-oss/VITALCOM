export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ── POST /api/admin/ai/ceo-chat ────────────────────────
// Chat streaming del Asesor CEO con tools sobre datos globales.
// Acceso: solo staff (SUPERADMIN / ADMIN / MANAGER_AREA).

import { streamText, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { rateLimit } from '@/lib/security/rate-limit'
import { buildCEOAdvisorPrompt } from '@/lib/ai/agents/ceo-advisor'

const MAX_HISTORY_MESSAGES = 10
const LOW_STOCK_THRESHOLD = 10

export async function POST(req: Request) {
  let session
  try {
    session = await requireRole('MANAGER_AREA')
  } catch {
    return new Response(JSON.stringify({ error: 'Solo staff autorizado' }), { status: 403 })
  }

  const rl = rateLimit(`ceo-advisor:${session.id}`, { maxRequests: 60, windowMs: 60 * 60 * 1000 })
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: 'Demasiadas consultas. Espera un momento.' }),
      { status: 429 },
    )
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Asesor CEO no está configurado. Falta OPENAI_API_KEY.' }),
      { status: 503 },
    )
  }

  const { messages: allMessages } = await req.json()
  if (!Array.isArray(allMessages) || allMessages.length === 0) {
    return new Response(JSON.stringify({ error: 'Mensaje vacío' }), { status: 400 })
  }

  const messages = allMessages.slice(-MAX_HISTORY_MESSAGES)

  // ── Snapshot en vivo para el prompt ──
  const [
    activeOrders,
    pendingOrders,
    activeProducts,
    lowStockCount,
    totalCommunity,
    totalDropshippers,
    unresolvedThreads,
  ] = await Promise.all([
    prisma.order.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED'] } },
    }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { active: true } }),
    prisma.stock.count({ where: { quantity: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.user.count({ where: { active: true, role: 'COMMUNITY' } }),
    prisma.user.count({ where: { active: true, role: 'DROPSHIPPER' } }),
    prisma.inboxThread.count({ where: { resolved: false } }),
  ])

  const systemPrompt = buildCEOAdvisorPrompt({
    user: { name: session.name, role: session.role, area: session.area },
    snapshot: {
      activeOrders,
      pendingOrders,
      activeProducts,
      lowStockCount,
      totalCommunity,
      totalDropshippers,
      unresolvedThreads,
    },
  })

  const modelId = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const result = streamText({
    model: openai(modelId),
    system: systemPrompt,
    messages,
    stopWhen: stepCountIs(4),
    tools: {
      getFinanceSnapshot: tool({
        description:
          'P&L global de Vitalcom (no del dropshipper). Ingresos, COGS, envío, utilidad bruta, margen, órdenes, ticket promedio y delta vs periodo anterior.',
        inputSchema: z.object({
          days: z.number().int().min(7).max(365).optional().describe('Periodo en días (default 30)'),
        }),
        execute: async ({ days }) => {
          const d = days ?? 30
          const since = new Date(); since.setDate(since.getDate() - d)
          const prevSince = new Date(); prevSince.setDate(prevSince.getDate() - d * 2)

          const [curr, prev] = await Promise.all([
            prisma.order.findMany({
              where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED'] } },
              include: {
                items: { include: { product: { select: { precioCosto: true } } } },
              },
            }),
            prisma.order.aggregate({
              where: { createdAt: { gte: prevSince, lt: since }, status: { notIn: ['CANCELLED'] } },
              _sum: { total: true }, _count: true,
            }),
          ])

          let revenue = 0, shipping = 0, cogs = 0
          for (const o of curr) {
            revenue += o.total
            shipping += o.shipping
            for (const it of o.items) {
              cogs += (it.product.precioCosto ?? 0) * it.quantity
            }
          }
          const grossProfit = revenue - cogs - shipping
          const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
          const prevRev = prev._sum.total ?? 0
          const deltaPct = prevRev > 0 ? ((revenue - prevRev) / prevRev) * 100 : 0

          return {
            periodDays: d,
            revenue: Math.round(revenue),
            cogs: Math.round(cogs),
            shipping: Math.round(shipping),
            grossProfit: Math.round(grossProfit),
            marginPct: Math.round(margin * 10) / 10,
            orders: curr.length,
            avgTicket: curr.length > 0 ? Math.round(revenue / curr.length) : 0,
            revenueDeltaPct: Math.round(deltaPct * 10) / 10,
            prevPeriodRevenue: Math.round(prevRev),
            prevPeriodOrders: prev._count,
          }
        },
      }),

      getMarketingSnapshot: tool({
        description:
          'Métricas de adquisición y engagement: nuevos usuarios, nuevos dropshippers, tiendas Shopify conectadas, posts, comentarios y engagement ratio.',
        inputSchema: z.object({
          days: z.number().int().min(7).max(365).optional(),
        }),
        execute: async ({ days }) => {
          const d = days ?? 30
          const since = new Date(); since.setDate(since.getDate() - d)
          const prevSince = new Date(); prevSince.setDate(prevSince.getDate() - d * 2)

          const [newUsers, prevUsers, newDrops, stores, totalComm, posts, comments] = await Promise.all([
            prisma.user.count({ where: { createdAt: { gte: since }, active: true } }),
            prisma.user.count({ where: { createdAt: { gte: prevSince, lt: since }, active: true } }),
            prisma.user.count({ where: { createdAt: { gte: since }, role: 'DROPSHIPPER', active: true } }),
            prisma.shopifyStore.count({ where: { status: 'active', createdAt: { gte: since } } }),
            prisma.user.count({ where: { active: true, role: { in: ['COMMUNITY', 'DROPSHIPPER'] } } }),
            prisma.post.count({ where: { createdAt: { gte: since } } }),
            prisma.comment.count({ where: { createdAt: { gte: since } } }),
          ])

          const delta = prevUsers > 0 ? ((newUsers - prevUsers) / prevUsers) * 100 : 0
          const engagement = totalComm > 0 ? ((posts + comments) / totalComm) * 100 : 0

          return {
            periodDays: d,
            newUsers,
            newUsersDeltaPct: Math.round(delta * 10) / 10,
            newDropshippers: newDrops,
            storesConnected: stores,
            totalCommunity: totalComm,
            posts,
            comments,
            engagementPct: Math.round(engagement * 10) / 10,
          }
        },
      }),

      getInventorySnapshot: tool({
        description:
          'Estado del inventario: productos con stock bajo, agotados y desglose por bodega/país. Úsalo para detectar riesgos de quiebre.',
        inputSchema: z.object({
          threshold: z.number().int().min(0).max(100).optional().describe('Umbral de stock bajo (default 10)'),
          country: z.enum(['CO', 'EC', 'GT', 'CL']).optional(),
        }),
        execute: async ({ threshold, country }) => {
          const t = threshold ?? LOW_STOCK_THRESHOLD
          const where: Record<string, unknown> = { quantity: { lte: t } }
          if (country) where.country = country

          const [lowStock, outOfStock, byCountry] = await Promise.all([
            prisma.stock.findMany({
              where,
              orderBy: { quantity: 'asc' },
              take: 20,
              include: { product: { select: { name: true, sku: true, bodega: true } } },
            }),
            prisma.stock.count({ where: { quantity: 0, ...(country ? { country } : {}) } }),
            prisma.stock.groupBy({
              by: ['country'],
              _sum: { quantity: true },
              _count: true,
            }),
          ])

          return {
            threshold: t,
            lowStockCount: lowStock.length,
            outOfStock,
            items: lowStock.map((s) => ({
              sku: s.product.sku,
              name: s.product.name,
              country: s.country,
              quantity: s.quantity,
              warehouse: s.warehouse ?? s.product.bodega,
            })),
            byCountry: byCountry.map((b) => ({
              country: b.country,
              totalUnits: b._sum.quantity ?? 0,
              skuCount: b._count,
            })),
          }
        },
      }),

      getOperationsPulse: tool({
        description:
          'Pulso operativo: pedidos por estado, pendientes por despachar, tiempo promedio confirmación→despacho (horas).',
        inputSchema: z.object({
          days: z.number().int().min(1).max(90).optional(),
        }),
        execute: async ({ days }) => {
          const d = days ?? 7
          const since = new Date(); since.setDate(since.getDate() - d)

          const [byStatus, dispatched] = await Promise.all([
            prisma.order.groupBy({
              by: ['status'],
              where: { createdAt: { gte: since } },
              _count: true,
            }),
            prisma.order.findMany({
              where: {
                status: { in: ['DISPATCHED', 'DELIVERED'] },
                createdAt: { gte: since },
              },
              select: { createdAt: true, updatedAt: true },
              take: 200,
            }),
          ])

          let avgHours = 0
          if (dispatched.length > 0) {
            const sum = dispatched.reduce((acc, o) => {
              const hrs = (o.updatedAt.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60)
              return acc + hrs
            }, 0)
            avgHours = Math.round((sum / dispatched.length) * 10) / 10
          }

          const counts = byStatus.reduce<Record<string, number>>((acc, r) => {
            acc[r.status] = r._count; return acc
          }, {})

          return {
            periodDays: d,
            byStatus: counts,
            avgDispatchHours: avgHours,
            totalOrders: Object.values(counts).reduce((a, b) => a + b, 0),
          }
        },
      }),

      getTopProducts: tool({
        description:
          'Productos top por revenue, unidades vendidas o margen de utilidad. Úsalo para recomendar qué empujar o qué descontinuar.',
        inputSchema: z.object({
          days: z.number().int().min(7).max(365).optional(),
          sortBy: z.enum(['revenue', 'units', 'margin']).optional().describe('Criterio de ranking'),
          limit: z.number().int().min(1).max(20).optional(),
        }),
        execute: async ({ days, sortBy, limit }) => {
          const d = days ?? 30
          const sort = sortBy ?? 'revenue'
          const lim = limit ?? 10
          const since = new Date(); since.setDate(since.getDate() - d)

          const items = await prisma.orderItem.findMany({
            where: {
              order: { createdAt: { gte: since }, status: { notIn: ['CANCELLED'] } },
            },
            select: {
              quantity: true,
              unitPrice: true,
              total: true,
              product: { select: { id: true, sku: true, name: true, precioCosto: true } },
            },
          })

          const map = new Map<string, { sku: string; name: string; units: number; revenue: number; cogs: number }>()
          for (const it of items) {
            const k = it.product.id
            const cur = map.get(k) ?? { sku: it.product.sku, name: it.product.name, units: 0, revenue: 0, cogs: 0 }
            cur.units += it.quantity
            cur.revenue += it.total
            cur.cogs += (it.product.precioCosto ?? 0) * it.quantity
            map.set(k, cur)
          }

          const rows = Array.from(map.values()).map((r) => ({
            ...r,
            profit: r.revenue - r.cogs,
            marginPct: r.revenue > 0 ? Math.round(((r.revenue - r.cogs) / r.revenue) * 1000) / 10 : 0,
          }))

          rows.sort((a, b) => {
            if (sort === 'revenue') return b.revenue - a.revenue
            if (sort === 'units') return b.units - a.units
            return b.marginPct - a.marginPct
          })

          return { periodDays: d, sortBy: sort, products: rows.slice(0, lim) }
        },
      }),

      getCustomerSegments: tool({
        description:
          'Segmentación de clientes/dropshippers: VIP (>$2M gastado), ACTIVE (<60d última compra), AT_RISK (>60d), NEW (<30d sin compras), INACTIVE.',
        inputSchema: z.object({}),
        execute: async () => {
          const users = await prisma.user.findMany({
            where: { active: true, role: { in: ['COMMUNITY', 'DROPSHIPPER'] } },
            select: { id: true, createdAt: true },
          })
          const ids = users.map((u) => u.id)
          if (ids.length === 0) {
            return { VIP: 0, ACTIVE: 0, AT_RISK: 0, NEW: 0, INACTIVE: 0, total: 0 }
          }

          const aggs = await prisma.order.groupBy({
            by: ['userId'],
            where: { userId: { in: ids }, status: { notIn: ['CANCELLED', 'RETURNED'] } },
            _sum: { total: true },
            _max: { createdAt: true },
            _count: true,
          })

          const aggMap = new Map(aggs.map((a) => [a.userId, a]))
          const now = Date.now()
          const counts = { VIP: 0, ACTIVE: 0, AT_RISK: 0, NEW: 0, INACTIVE: 0 }

          for (const u of users) {
            const a = aggMap.get(u.id)
            const spent = a?._sum.total ?? 0
            const lastOrder = a?._max.createdAt
            const orderCount = a?._count ?? 0
            const daysSinceLast = lastOrder
              ? Math.floor((now - lastOrder.getTime()) / 86400000)
              : null
            const daysSinceSignup = Math.floor((now - u.createdAt.getTime()) / 86400000)

            if (spent >= 2_000_000) counts.VIP++
            else if (daysSinceLast !== null && daysSinceLast <= 60) counts.ACTIVE++
            else if (orderCount > 0 && daysSinceLast !== null && daysSinceLast > 60) counts.AT_RISK++
            else if (daysSinceSignup <= 30 && orderCount === 0) counts.NEW++
            else counts.INACTIVE++
          }

          return { ...counts, total: users.length }
        },
      }),

      getInboxPulse: tool({
        description:
          'Estado del inbox interno: hilos sin resolver por área, prioridad alta pendiente, mensajes sin leer del staff.',
        inputSchema: z.object({}),
        execute: async () => {
          const [byArea, highPriority, total] = await Promise.all([
            prisma.inboxThread.groupBy({
              by: ['area'],
              where: { resolved: false },
              _count: true,
            }),
            prisma.inboxThread.count({
              where: { resolved: false, priority: { in: ['high', 'urgent'] } },
            }),
            prisma.inboxThread.count({ where: { resolved: false } }),
          ])

          return {
            totalUnresolved: total,
            highPriorityUnresolved: highPriority,
            byArea: byArea.map((b) => ({ area: b.area, count: b._count })),
          }
        },
      }),

      getCountryBreakdown: tool({
        description:
          'Métricas globales desglosadas por país (CO/EC/GT/CL): revenue, órdenes, usuarios, stock total.',
        inputSchema: z.object({
          days: z.number().int().min(7).max(365).optional(),
        }),
        execute: async ({ days }) => {
          const d = days ?? 30
          const since = new Date(); since.setDate(since.getDate() - d)

          const [orders, users, stock] = await Promise.all([
            prisma.order.groupBy({
              by: ['country'],
              where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED'] } },
              _sum: { total: true },
              _count: true,
            }),
            prisma.user.groupBy({
              by: ['country'],
              where: { active: true, country: { not: null } },
              _count: true,
            }),
            prisma.stock.groupBy({
              by: ['country'],
              _sum: { quantity: true },
            }),
          ])

          const countries = ['CO', 'EC', 'GT', 'CL'] as const
          return {
            periodDays: d,
            countries: countries.map((c) => {
              const o = orders.find((x) => x.country === c)
              const u = users.find((x) => x.country === c)
              const s = stock.find((x) => x.country === c)
              return {
                country: c,
                revenue: Math.round(o?._sum.total ?? 0),
                orders: o?._count ?? 0,
                users: u?._count ?? 0,
                stockUnits: s?._sum.quantity ?? 0,
              }
            }),
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
