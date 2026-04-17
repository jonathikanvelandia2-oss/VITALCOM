export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── POST /api/assistant/chat ───
// VITA con router inteligente + cache + keywords + historial limitado

import { streamText, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { rateLimit } from '@/lib/security/rate-limit'
import { buildVITASystemPrompt, buildMinimalPrompt } from '@/lib/ai/prompts/vita-system-prompt'
import { classifyQuery } from '@/lib/ai/router'
import { interpretKeywords } from '@/lib/ai/keywords'
import { getCachedResponse, cacheResponse, learnPattern, getFrequentPatterns } from '@/lib/ai/cache'

const MAX_HISTORY_MESSAGES = 8

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.id) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 })
  }

  const rl = rateLimit(`vita:${session.id}`, { maxRequests: 30, windowMs: 60 * 60 * 1000 })
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: 'Has enviado muchos mensajes. Espera un momento.' }),
      { status: 429 },
    )
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'VITA no está configurada. Contacta al administrador.' }),
      { status: 503 },
    )
  }

  const userId = session.id
  const isInternal = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(session.role)

  const { messages: allMessages } = await req.json()

  // ── 1. Extraer último mensaje del usuario ──
  const lastUserMsg = [...allMessages].reverse().find((m: { role: string }) => m.role === 'user')
  const userText = extractText(lastUserMsg)

  if (!userText) {
    return new Response(JSON.stringify({ error: 'Mensaje vacío' }), { status: 400 })
  }

  // ── 2. Clasificar consulta → modelo apropiado ──
  const classification = classifyQuery(userText)

  // ── 3. Interpretar keywords → enriquecer contexto ──
  const keywordCtx = interpretKeywords(userText)

  // ── 4. Registrar patrón para auto-aprendizaje ──
  learnPattern(userText, classification.detectedIntent)

  // ── 5. Buscar en cache ──
  const cached = getCachedResponse(userId, userText, classification.detectedIntent)
  if (cached && !keywordCtx.suggestedTools.length) {
    // Respuesta cacheada para consultas sin tools (saludos, etc.)
    return new Response(
      JSON.stringify({
        role: 'assistant',
        content: cached.response,
        _meta: { source: 'cache', model: 'none', tokens: 0 },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ── 6. Limitar historial (solo últimos N mensajes) ──
  const messages = allMessages.slice(-MAX_HISTORY_MESSAGES)

  // ── 7. Cargar contexto ligero (solo counts, no datos pesados) ──
  const [user, statsData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true, country: true, level: true, points: true },
    }),
    Promise.all([
      prisma.product.count({ where: { active: true } }),
      prisma.user.count({ where: { active: true } }),
    ]).then(([totalProducts, communityMembers]) => ({ totalProducts, communityMembers })),
  ])

  if (!user) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 })
  }

  // ── 8. Construir prompt según complejidad ──
  const isSimple = classification.detectedIntent === 'greeting'
    || classification.detectedIntent === 'acknowledgement'

  const systemPrompt = isSimple
    ? buildMinimalPrompt(user.name || 'Vitalcommer')
    : buildVITASystemPrompt({
        user: {
          name: user.name,
          role: user.role,
          country: user.country,
          level: user.level,
          points: user.points,
        },
        stats: statsData,
        frequentPatterns: getFrequentPatterns(3),
        keywordContext: keywordCtx.enrichedPrompt,
      })

  // ── 9. Seleccionar modelo ──
  const modelId = process.env.OPENAI_MODEL === 'gpt-4o'
    ? classification.model // Respetar router si el user tiene gpt-4o configurado
    : (process.env.OPENAI_MODEL || 'gpt-4o-mini')

  // ── 10. Stream con tool calling ──
  const result = streamText({
    model: openai(modelId),
    system: systemPrompt,
    messages,
    stopWhen: stepCountIs(3),
    tools: {
      searchCatalog: tool({
        description: 'Busca productos en el catálogo por nombre, categoría o marca',
        inputSchema: z.object({
          query: z.string().describe('Texto de búsqueda'),
          category: z.string().optional().describe('Filtrar por categoría'),
        }),
        execute: async ({ query, category }) => {
          const where: Record<string, unknown> = { active: true }
          if (category) where.category = category
          if (query) {
            where.OR = [
              { name: { contains: query, mode: 'insensitive' } },
              { marca: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
              { sabor: { contains: query, mode: 'insensitive' } },
            ]
          }
          return {
            products: await prisma.product.findMany({
              where,
              select: {
                name: true, slug: true, category: true, marca: true,
                precioPublico: true, precioComunidad: true,
                presentacion: true, sabor: true, contenido: true,
              },
              take: 15,
              orderBy: { salesCount: 'desc' },
            }),
          }
        },
      }),

      getProductDetail: tool({
        description: 'Obtiene el detalle completo de un producto por nombre o slug',
        inputSchema: z.object({
          nameOrSlug: z.string().describe('Nombre o slug del producto'),
        }),
        execute: async ({ nameOrSlug }) => {
          const selectBase = {
            name: true, slug: true, sku: true, category: true,
            marca: true, contenido: true, presentacion: true, sabor: true,
            precioPublico: true, precioComunidad: true, precioPrivado: true,
            bodega: true, images: true,
            stock: { select: { country: true, quantity: true, warehouse: true } },
          } as const

          const product = await prisma.product.findFirst({
            where: {
              active: true,
              OR: [
                { slug: nameOrSlug },
                { name: { contains: nameOrSlug, mode: 'insensitive' } },
              ],
            },
            select: isInternal
              ? { ...selectBase, precioCosto: true, precioMayorContado: true, precioMayorCredito: true, precioMaquilla: true }
              : selectBase,
          })
          return product ? { product } : { error: 'Producto no encontrado' }
        },
      }),

      calculatePrice: tool({
        description: 'Calcula el precio de venta sugerido con margen de ganancia',
        inputSchema: z.object({
          productName: z.string().describe('Nombre del producto'),
          marginPercent: z.number().describe('Porcentaje de margen (ej: 30)'),
          country: z.enum(['CO', 'EC', 'GT', 'CL']).optional().describe('País del cliente'),
        }),
        execute: async ({ productName, marginPercent, country }) => {
          const product = await prisma.product.findFirst({
            where: { name: { contains: productName, mode: 'insensitive' }, active: true },
            select: { name: true, precioComunidad: true, precioPublico: true },
          })
          if (!product) return { error: 'Producto no encontrado' }

          const base = product.precioComunidad
          const shippingMap: Record<string, number> = { CO: 12000, EC: 8000, GT: 15000, CL: 10000 }
          const shipping = shippingMap[country || session.country || 'CO'] || 12000
          const margin = marginPercent / 100
          const selling = Math.ceil((base + shipping) / (1 - margin))
          const profit = selling - base - shipping

          return {
            product: product.name,
            precioComunidad: base,
            precioPublicoRef: product.precioPublico,
            shipping,
            marginPercent,
            sellingPrice: selling,
            profit,
            profitPercent: Math.round((profit / selling) * 100),
          }
        },
      }),

      getMyOrders: tool({
        description: 'Muestra los pedidos del usuario',
        inputSchema: z.object({
          status: z.string().optional().describe('Filtrar: PENDING, CONFIRMED, PROCESSING, DISPATCHED, DELIVERED, CANCELLED'),
        }),
        execute: async ({ status }) => {
          const where: Record<string, unknown> = { userId }
          if (status) where.status = status
          return {
            orders: await prisma.order.findMany({
              where,
              select: {
                number: true, status: true, total: true,
                customerName: true, createdAt: true,
                items: { select: { product: { select: { name: true } }, quantity: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            }),
          }
        },
      }),

      getStock: tool({
        description: 'Consulta disponibilidad de stock por producto y país',
        inputSchema: z.object({
          productName: z.string().describe('Nombre del producto'),
          country: z.enum(['CO', 'EC', 'GT', 'CL']).optional().describe('País'),
        }),
        execute: async ({ productName, country }) => {
          const product = await prisma.product.findFirst({
            where: { name: { contains: productName, mode: 'insensitive' }, active: true },
            select: {
              name: true, bodega: true,
              stock: {
                select: { country: true, quantity: true, warehouse: true },
                ...(country ? { where: { country: country as any } } : {}),
              },
            },
          })
          return product
            ? { product: product.name, bodega: product.bodega, stock: product.stock }
            : { error: 'Producto no encontrado' }
        },
      }),

      getCommunityRanking: tool({
        description: 'Ranking de la comunidad VITALCOMMERS por puntos',
        inputSchema: z.object({
          top: z.number().optional().describe('Cantidad (default 10)'),
        }),
        execute: async ({ top }) => ({
          ranking: await prisma.user.findMany({
            where: { active: true, role: { in: ['COMMUNITY', 'DROPSHIPPER'] } },
            select: { name: true, level: true, points: true, role: true },
            orderBy: { points: 'desc' },
            take: top || 10,
          }),
        }),
      }),

      getMyStats: tool({
        description: 'Estadísticas personales del usuario',
        inputSchema: z.object({}),
        execute: async () => {
          const [userData, ordersCount, totalSpent, postsCount] = await Promise.all([
            prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, level: true, points: true, role: true, country: true, createdAt: true },
            }),
            prisma.order.count({ where: { userId } }),
            prisma.order.aggregate({ where: { userId, status: { not: 'CANCELLED' } }, _sum: { total: true } }),
            prisma.post.count({ where: { authorId: userId } }),
          ])
          return {
            user: userData,
            ordersCount,
            totalSpent: totalSpent._sum.total || 0,
            postsCount,
          }
        },
      }),
    },

    onFinish: async ({ text }) => {
      if (text && userText) {
        cacheResponse(userId, userText, classification.detectedIntent, text)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}

function extractText(msg: any): string {
  if (!msg) return ''
  if (msg.content) return typeof msg.content === 'string' ? msg.content : ''
  if (msg.parts) {
    return msg.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text || '')
      .join('')
  }
  return ''
}
