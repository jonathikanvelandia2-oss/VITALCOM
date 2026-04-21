import OpenAI from 'openai'
import { prisma } from '@/lib/db/prisma'

// ── SoporteIA — 7° agente prometido al CEO ──────────────
// Primera línea 24/7 para la comunidad VITALCOMMERS.
// Context-aware: recibe prompt con datos del usuario + catálogo +
// métricas + FAQ base y responde en lenguaje natural.
// Compromiso: siempre sugiere acción concreta ejecutable en la plataforma.

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT_BASE = `Eres SoporteIA, el agente oficial de soporte de Vitalcom, la comunidad SIN ÁNIMO DE LUCRO de dropshippers de bienestar en LATAM. Tu misión es que cada VITALCOMMER venda más productos Vitalcom de forma rentable.

Pilares no-negociables:
- Los dropshippers venden SOLO productos Vitalcom (nunca catálogo externo)
- La plataforma es 100% gratuita — nunca sugieras planes pagos
- Responde en español neutro LATAM, tono mentor directo, cero fluff
- Siempre termina proponiendo una acción concreta ejecutable en la plataforma

Herramientas que el usuario tiene disponibles (usa la ruta exacta al recomendar):
- /mi-tienda — Panel de tienda conectada con Shopify
- /pedidos — Gestión de pedidos y tracking
- /mi-pyg — P&G (ganancias/pérdidas) financiero
- /publicidad — Tracker de gasto en ads Meta/TikTok/Google
- /lanzador — Wizard 5 pasos para lanzar campañas
- /mediabuyer — Recomendaciones IA para optimizar campañas
- /creativo — CreativoMaker: genera copy + imagen en 8 ángulos
- /optimizador — OptimizadorTienda: mejoras de catálogo y pricing
- /comando — Command Center unificado con todas las recomendaciones IA
- /impacto — ROI real de tus acciones aplicadas
- /asistente — VITA IA, agente conversacional general
- /mi-blueprint — Diagnóstico 0-100 de tu tienda + 5 acciones semanales
- /herramientas/catalogo — Catálogo Vitalcom navegable
- /herramientas/calculadora — Calculadora precios multi-país
- /cursos — Academia Vitalcom
- /feed — Comunidad tipo Skool

Reglas:
1. Responde MAX 3 párrafos cortos + si aplica, una lista de pasos concretos
2. Si el usuario pregunta algo que resuelve una página específica, di EXACTAMENTE "ve a /ruta y..." con la ruta correcta
3. Si te preguntan sobre productos, usa el catálogo real que te paso abajo (no inventes)
4. Si te preguntan sobre sus métricas, usa el contexto real que te paso abajo
5. Si no sabes, di "no tengo esa info — pregunta en /feed o a un mentor" en vez de inventar
6. Jamás hables de precios de suscripción ni planes premium — la plataforma es gratis
`

type UserContext = {
  userId: string
  name: string | null
  level: number
  points: number
  hasShopify: boolean
  ordersLast30: number
  revenueLast30: number
  activeCampaigns: number
}

async function buildUserContext(userId: string): Promise<UserContext> {
  const from30 = new Date(Date.now() - 30 * 86400000)
  const [user, shopify, orderAgg, campaignCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, level: true, points: true },
    }),
    prisma.shopifyStore.count({ where: { userId, status: 'connected' } }),
    prisma.order.aggregate({
      where: {
        userId,
        status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
        createdAt: { gte: from30 },
      },
      _count: true,
      _sum: { total: true },
    }),
    prisma.adCampaign.count({
      where: { account: { userId, active: true }, status: 'ACTIVE' },
    }),
  ])

  return {
    userId,
    name: user?.name ?? null,
    level: user?.level ?? 1,
    points: user?.points ?? 0,
    hasShopify: shopify > 0,
    ordersLast30: orderAgg._count ?? 0,
    revenueLast30: orderAgg._sum.total ?? 0,
    activeCampaigns: campaignCount,
  }
}

/** Top 5 productos más vendidos globalmente (ganadores de la comunidad) */
async function getTopProducts() {
  return prisma.product.findMany({
    where: { active: true },
    orderBy: { salesCount: 'desc' },
    take: 5,
    select: { sku: true, name: true, category: true, precioPublico: true, salesCount: true },
  })
}

function buildContextPrompt(ctx: UserContext, products: Awaited<ReturnType<typeof getTopProducts>>) {
  return `# Contexto del usuario
- Nombre: ${ctx.name ?? 'dropshipper'}
- Nivel comunidad: ${ctx.level} · ${ctx.points} pts
- Tienda Shopify conectada: ${ctx.hasShopify ? 'sí' : 'no (sugerir conectar en /mi-tienda)'}
- Pedidos últimos 30d: ${ctx.ordersLast30}
- Revenue últimos 30d: $${Math.round(ctx.revenueLast30).toLocaleString('es-CO')} COP
- Campañas activas: ${ctx.activeCampaigns}

# Top 5 productos ganadores de la comunidad (para sugerencias)
${products.map((p) => `- ${p.name} (${p.sku}) · ${p.category ?? '-'} · $${p.precioPublico.toLocaleString('es-CO')} · ${p.salesCount} ventas totales`).join('\n')}
`
}

// Respuestas canned cuando no hay OPENAI_API_KEY
const CANNED_RESPONSES: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['vender', 'empezar', 'comenzar', 'primer', 'arranco'],
    answer: 'Para empezar a vender, tres pasos:\n\n1. **Conecta tu Shopify** en /mi-tienda — es gratis.\n2. **Elige 3 productos ganadores** del catálogo en /herramientas/catalogo (filtra por ventas altas).\n3. **Lanza tu primera campaña** con el wizard en /lanzador.\n\nSi ya tienes tienda, tu siguiente paso es /comando para ver las acciones IA que te esperan.',
  },
  {
    keywords: ['campaña', 'anuncio', 'meta', 'tiktok', 'ads'],
    answer: 'Para campañas, usa el flujo completo:\n\n1. Registra tu gasto diario en /publicidad\n2. Lanza con /lanzador (wizard 5 pasos con IA)\n3. Genera creativos en /creativo (8 ángulos + imagen automática)\n4. Cuando tengas datos, /mediabuyer te dice qué pausar, escalar o testear\n\nTodo con 1 clic para aplicar. Sin experiencia previa en ads.',
  },
  {
    keywords: ['precio', 'margen', 'rentable', 'ganancia'],
    answer: 'Para pricing:\n\n1. Usa /herramientas/calculadora para saber tu margen real por país\n2. Registra costos en /mi-pyg (publicidad, envíos, empaque)\n3. /optimizador te sugiere si tu precio actual está bien o conviene ajustar\n\nMargen mínimo saludable: 35-45% después de ads.',
  },
  {
    keywords: ['producto', 'catálogo', 'qué vender'],
    answer: 'Para elegir productos:\n\n1. Ve a /herramientas/catalogo y filtra por bestsellers\n2. Revisa /feed — la comunidad comparte qué les funciona\n3. /optimizador te recomienda qué agregar a tu tienda según tu perfil\n\nRegla: arranca con 3 productos ganadores, no 30.',
  },
  {
    keywords: ['stock', 'inventario', 'agotó'],
    answer: 'Para stock:\n\nVitalcom maneja el inventario — tú no necesitas comprar stock anticipado. Cuando el cliente compra, se descuenta automáticamente del stock disponible en tu país. Si un producto se está agotando, /optimizador te manda alerta con la recomendación RESTOCK_URGENT.',
  },
]

function pickCannedAnswer(message: string): string {
  const lower = message.toLowerCase()
  for (const c of CANNED_RESPONSES) {
    if (c.keywords.some((k) => lower.includes(k))) return c.answer
  }
  return 'Buena pregunta. Revisa tu **Command Center** en /comando para ver las acciones IA priorizadas de hoy, o entra a /asistente (VITA) para una consulta más general. Si necesitas algo específico que no esté cubierto, publica en /feed y la comunidad responde.'
}

export async function chatSoporteIA(
  userId: string,
  messages: ChatMessage[],
): Promise<string> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser) return 'Hola, ¿en qué te puedo ayudar?'

  // Build context in parallel
  const [ctx, products] = await Promise.all([buildUserContext(userId), getTopProducts()])

  if (!process.env.OPENAI_API_KEY) {
    return pickCannedAnswer(lastUser.content)
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const contextPrompt = buildContextPrompt(ctx, products)

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_BASE },
        { role: 'system', content: contextPrompt },
        ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.5,
      max_tokens: 500,
    })

    return (
      completion.choices[0]?.message?.content?.trim() ?? pickCannedAnswer(lastUser.content)
    )
  } catch (err) {
    console.error('[soporte-ia] LLM failed, using canned response', err)
    return pickCannedAnswer(lastUser.content)
  }
}
