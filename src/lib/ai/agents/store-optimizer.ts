import OpenAI from 'openai'
import { prisma } from '@/lib/db/prisma'
import type { OptimizationType } from '@prisma/client'

// ── Agente OptimizadorTienda IA ─────────────────────────
// Analiza el catálogo de productos Vitalcom + ventas del dropshipper +
// tienda Shopify + P&G y genera recomendaciones accionables para
// optimizar la tienda: qué destacar, pricing, copy, cross-sell, restock.
//
// Arquitectura: reglas deterministas (confiables, rápidas) + capa LLM
// opcional que enriquece reasoning y sugiere copy de landing.

const BENCHMARKS = {
  MIN_SALES_FOR_WINNER: 5,          // ≥5 ventas en 30d = producto ganador
  WINNER_SALES_30D: 15,              // ≥15 ventas/30d = top performer
  MARGIN_LOW_THRESHOLD: 25,          // <25% margen = oportunidad pricing
  MARGIN_HIGH_THRESHOLD: 55,         // >55% margen = puede bajar precio para volumen
  STOCK_LOW_DAYS: 7,                 // <7 días de stock → restock urgente
  NO_SALES_DAYS: 60,                 // 60+ días sin venta → candidato a remover
  PRICE_INCREASE_CAP: 15,            // max +15% sobre precio actual
  PRICE_DECREASE_CAP: 12,            // max -12% sobre precio actual
  MIN_DATA_DAYS: 14,                 // no decide con <14 días de operación
}

type ProductMetric = {
  productId: string
  sku: string
  name: string
  category: string | null
  precioPublico: number
  precioComunidad: number
  precioCosto: number | null
  salesLast30: number
  revenueLast30: number
  marginPct: number | null
  stockCO: number
  shopifyPrice: number | null
  shopifyStatus: string | null
  lastSaleAt: Date | null
  daysSinceLastSale: number | null
  inCatalog: boolean  // está en shopifySync del user
}

export type Optimization = {
  type: OptimizationType
  productId: string | null
  title: string
  reasoning: string
  actionLabel: string
  suggestedValue: number | null
  suggestedText: string | null
  suggestedData: Record<string, unknown> | null
  priority: number
  confidence: number
  metrics: {
    salesLast30: number | null
    revenueLast30: number | null
    marginPct: number | null
    stockLevel: number | null
    conversionRate: number | null
  }
}

/** Calcula métricas por producto del catálogo del usuario */
async function analyzeProducts(userId: string): Promise<ProductMetric[]> {
  const from = new Date(Date.now() - 30 * 86400000)

  // Productos del catálogo Vitalcom activos
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      stock: { where: { country: 'CO' } },
      shopifySync: {
        where: { store: { userId } },
        take: 1,
      },
      orderItems: {
        where: {
          order: {
            userId,
            createdAt: { gte: from },
            status: { in: ['DELIVERED', 'DISPATCHED', 'CONFIRMED', 'PROCESSING'] },
          },
        },
        select: {
          quantity: true,
          total: true,
          order: { select: { createdAt: true } },
        },
      },
    },
  })

  const results: ProductMetric[] = []
  for (const p of products) {
    const salesLast30 = p.orderItems.reduce((s, it) => s + it.quantity, 0)
    const revenueLast30 = p.orderItems.reduce((s, it) => s + it.total, 0)
    const lastSale = p.orderItems
      .map((it) => it.order.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

    const sync = p.shopifySync[0]
    const inCatalog = !!sync
    const shopifyPrice = sync?.sellingPrice ?? null

    const salePrice = shopifyPrice ?? p.precioPublico
    const costo = p.precioCosto ?? p.precioComunidad
    const marginPct = salePrice > 0 ? ((salePrice - costo) / salePrice) * 100 : null

    const daysSinceLastSale = lastSale
      ? Math.floor((Date.now() - lastSale.getTime()) / 86400000)
      : null

    results.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      precioPublico: p.precioPublico,
      precioComunidad: p.precioComunidad,
      precioCosto: p.precioCosto,
      salesLast30,
      revenueLast30,
      marginPct,
      stockCO: p.stock[0]?.quantity ?? 0,
      shopifyPrice,
      shopifyStatus: sync?.status ?? null,
      lastSaleAt: lastSale,
      daysSinceLastSale,
      inCatalog,
    })
  }

  return results
}

/** Genera recomendaciones basadas en reglas deterministas */
function generateRuleOptimizations(metrics: ProductMetric[]): Optimization[] {
  const recs: Optimization[] = []

  // Agregar cross-sell: buscar productos top que frecuentemente se venden juntos
  const topSellers = metrics
    .filter((m) => m.salesLast30 >= BENCHMARKS.MIN_SALES_FOR_WINNER)
    .sort((a, b) => b.salesLast30 - a.salesLast30)

  for (const m of metrics) {
    const metricsSnapshot = {
      salesLast30: m.salesLast30,
      revenueLast30: m.revenueLast30,
      marginPct: m.marginPct,
      stockLevel: m.stockCO,
      conversionRate: null,
    }
    const base = {
      productId: m.productId,
      metrics: metricsSnapshot,
    }

    // 1. Producto ganador NO está en la tienda → destacar/agregar
    if (m.salesLast30 >= BENCHMARKS.MIN_SALES_FOR_WINNER && !m.inCatalog) {
      recs.push({
        ...base,
        type: 'PRODUCT_MIX',
        title: `Agrega "${m.name}" a tu tienda Shopify`,
        reasoning: `Este producto vendió ${m.salesLast30} unidades ($${m.revenueLast30.toLocaleString('es-CO')}) en 30 días pero NO está sincronizado en tu tienda. Lo estás vendiendo afuera: conéctalo y suma ese volumen a tu Shopify.`,
        actionLabel: 'Sincronizar',
        suggestedValue: null,
        suggestedText: null,
        suggestedData: { action: 'sync_product' },
        priority: 90,
        confidence: 0.9,
      })
      continue
    }

    // 2. Top performer → destacar en home
    if (m.salesLast30 >= BENCHMARKS.WINNER_SALES_30D && m.inCatalog) {
      recs.push({
        ...base,
        type: 'HIGHLIGHT_PRODUCT',
        title: `Destaca "${m.name}" en tu home`,
        reasoning: `${m.salesLast30} ventas en 30 días = top performer. Ponerlo como producto destacado en home puede subir tu conversión ~18% según benchmarks Shopify. Es tu caballito de batalla.`,
        actionLabel: 'Destacar',
        suggestedValue: null,
        suggestedText: `🌿 ${m.name} — el más vendido este mes`,
        suggestedData: { action: 'mark_featured', productId: m.productId },
        priority: 85,
        confidence: 0.85,
      })
    }

    // 3. Stock bajo + ventas activas → restock urgente
    if (m.stockCO > 0 && m.salesLast30 > 0) {
      const dailySales = m.salesLast30 / 30
      const daysLeft = dailySales > 0 ? m.stockCO / dailySales : 999
      if (daysLeft < BENCHMARKS.STOCK_LOW_DAYS) {
        recs.push({
          ...base,
          type: 'RESTOCK_URGENT',
          title: `Restock urgente: "${m.name}"`,
          reasoning: `Solo quedan ${m.stockCO} unidades — al ritmo actual (${dailySales.toFixed(1)}/día) se agota en ${Math.ceil(daysLeft)} días. Pide reposición YA para no quedarte sin stock del ganador.`,
          actionLabel: 'Solicitar restock',
          suggestedValue: Math.ceil(dailySales * 30),
          suggestedText: null,
          suggestedData: { daysLeft: Math.ceil(daysLeft), dailySales },
          priority: 92,
          confidence: 0.9,
        })
      }
    }

    // 4. Margen bajo → subir precio
    if (m.marginPct !== null && m.marginPct < BENCHMARKS.MARGIN_LOW_THRESHOLD && m.salesLast30 >= 3) {
      const currentPrice = m.shopifyPrice ?? m.precioPublico
      const suggestedPrice = Math.round(currentPrice * 1.1)  // +10%
      recs.push({
        ...base,
        type: 'MARGIN_IMPROVEMENT',
        title: `Sube precio de "${m.name}" +10%`,
        reasoning: `Margen actual de ${m.marginPct.toFixed(1)}% — apenas cubre costos + ads. A este ritmo ${m.salesLast30} ventas/mes = poco beneficio real. Subir a $${suggestedPrice.toLocaleString('es-CO')} te da +${(100 - m.marginPct).toFixed(0)}% sobre base y el producto aguanta: ya demostró tracción.`,
        actionLabel: 'Ajustar precio',
        suggestedValue: suggestedPrice,
        suggestedText: null,
        suggestedData: { currentPrice, pctChange: 10 },
        priority: 75,
        confidence: 0.75,
      })
    }

    // 5. Margen muy alto + pocas ventas → bajar precio para ganar volumen
    if (m.marginPct !== null && m.marginPct > BENCHMARKS.MARGIN_HIGH_THRESHOLD && m.salesLast30 < 5 && m.inCatalog) {
      const currentPrice = m.shopifyPrice ?? m.precioPublico
      const suggestedPrice = Math.round(currentPrice * 0.92)  // -8%
      recs.push({
        ...base,
        type: 'PRICING_ADJUSTMENT',
        title: `Baja precio de "${m.name}" -8%`,
        reasoning: `Margen de ${m.marginPct.toFixed(1)}% — muy sano, pero solo ${m.salesLast30} ventas/mes. Bajar a $${suggestedPrice.toLocaleString('es-CO')} puede duplicar volumen manteniendo margen >45%. Prueba 14 días y mide.`,
        actionLabel: 'Bajar precio',
        suggestedValue: suggestedPrice,
        suggestedText: null,
        suggestedData: { currentPrice, pctChange: -8 },
        priority: 55,
        confidence: 0.65,
      })
    }

    // 6. Producto sin ventas en 60d → considerar remover
    if (m.inCatalog && (m.daysSinceLastSale ?? 0) >= BENCHMARKS.NO_SALES_DAYS) {
      recs.push({
        ...base,
        type: 'REMOVE_UNDERPERFORMER',
        title: `Considera quitar "${m.name}" del catálogo`,
        reasoning: `Sin ventas en ${m.daysSinceLastSale}+ días. Ocupa espacio mental del cliente y diluye tu tienda. Quítalo o crea una campaña específica con copy nuevo antes de eliminarlo.`,
        actionLabel: 'Revisar',
        suggestedValue: null,
        suggestedText: null,
        suggestedData: { daysSinceLastSale: m.daysSinceLastSale },
        priority: 40,
        confidence: 0.7,
      })
    }

    // 7. Producto activo con ventas pero sin landing custom → mejorar copy
    if (m.inCatalog && m.salesLast30 >= 3 && m.salesLast30 < BENCHMARKS.WINNER_SALES_30D) {
      recs.push({
        ...base,
        type: 'LANDING_COPY',
        title: `Optimiza la landing de "${m.name}"`,
        reasoning: `${m.salesLast30} ventas en 30 días — tiene tracción pero no explota. Una landing con beneficios claros, testimonios y urgencia puede subir conversión 25-40%. IA puede generarte el copy.`,
        actionLabel: 'Generar copy',
        suggestedValue: null,
        suggestedText: null,
        suggestedData: { productId: m.productId, action: 'generate_copy' },
        priority: 60,
        confidence: 0.7,
      })
    }
  }

  // 8. Cross-sell: para cada top seller, sugiere bundle con otro producto de la misma categoría
  for (const top of topSellers.slice(0, 3)) {
    const companion = topSellers.find(
      (t) => t.productId !== top.productId && t.category === top.category && t.salesLast30 >= 3,
    )
    if (companion && top.inCatalog && companion.inCatalog) {
      recs.push({
        type: 'CROSS_SELL',
        productId: top.productId,
        title: `Cross-sell: "${top.name}" + "${companion.name}"`,
        reasoning: `Ambos son top de ${top.category ?? 'tu tienda'}. Ofrecer "${companion.name}" como complemento en la página de "${top.name}" sube el ticket promedio ~22%. Usa badge "Clientes también compraron".`,
        actionLabel: 'Configurar bundle',
        suggestedValue: null,
        suggestedText: null,
        suggestedData: {
          mainProduct: top.productId,
          companionProduct: companion.productId,
          bundleDiscount: 10,
        },
        priority: 72,
        confidence: 0.75,
        metrics: {
          salesLast30: top.salesLast30,
          revenueLast30: top.revenueLast30,
          marginPct: top.marginPct,
          stockLevel: top.stockCO,
          conversionRate: null,
        },
      })
    }
  }

  // 9. Si el dropshipper no tiene ningún producto → onboarding
  const totalInCatalog = metrics.filter((m) => m.inCatalog).length
  if (totalInCatalog === 0) {
    const suggestion = topSellers.slice(0, 3)
    recs.push({
      type: 'PRODUCT_MIX',
      productId: null,
      title: 'Arranca con los 3 productos más vendidos',
      reasoning: `Tu tienda Shopify no tiene productos Vitalcom sincronizados. Empieza con los top performers de la comunidad: ${suggestion.map((s) => s.name).join(', ')}. Son los que más están vendiendo hoy.`,
      actionLabel: 'Ver catálogo',
      suggestedValue: null,
      suggestedText: null,
      suggestedData: { suggestedProducts: suggestion.map((s) => s.productId) },
      priority: 100,
      confidence: 1,
      metrics: {
        salesLast30: null,
        revenueLast30: null,
        marginPct: null,
        stockLevel: null,
        conversionRate: null,
      },
    })
  }

  return recs.sort((a, b) => b.priority - a.priority).slice(0, 20)
}

/** Enriquece reasoning + genera copy sugerido con LLM */
async function enhanceWithLLM(recs: Optimization[], metrics: ProductMetric[]): Promise<Optimization[]> {
  if (!process.env.OPENAI_API_KEY || recs.length === 0) return recs

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const topContext = metrics
      .filter((m) => m.salesLast30 > 0)
      .slice(0, 8)
      .map(
        (m) =>
          `${m.name} (${m.category ?? '-'}): ${m.salesLast30}v/30d, margen ${m.marginPct?.toFixed(0) ?? '?'}%, stock ${m.stockCO}u`,
      )
      .join('\n')

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres OptimizadorTienda, consultor Shopify experto para dropshippers LATAM de Vitalcom (productos de bienestar). Tu trabajo: enriquecer recomendaciones existentes con (a) reasoning conversacional de 2 líneas máximo, (b) cuando aplique, sugerir copy concreto de landing o badge. Respondes JSON estricto con "enhanced": [{index, reasoning, suggestedText?}]. Español neutro LATAM, tono mentor directo, cero fluff.`,
        },
        {
          role: 'user',
          content: `Contexto de la tienda:\n${topContext || '(sin ventas todavía)'}\n\nRecomendaciones a enriquecer:\n${recs.slice(0, 8).map((r, i) => `${i}. [${r.type}] ${r.title} — actual reasoning: ${r.reasoning}`).join('\n')}\n\nDevuelve JSON {"enhanced": [{"index": 0, "reasoning": "texto breve mentor", "suggestedText": "copy si type=LANDING_COPY o HIGHLIGHT_PRODUCT"}]}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.enhanced)) {
      for (const e of parsed.enhanced) {
        if (typeof e.index !== 'number' || !recs[e.index]) continue
        if (typeof e.reasoning === 'string' && e.reasoning.length > 20) {
          recs[e.index].reasoning = e.reasoning
        }
        if (typeof e.suggestedText === 'string' && e.suggestedText.length > 5) {
          recs[e.index].suggestedText = e.suggestedText
        }
      }
    }
  } catch (err) {
    console.error('[store-optimizer] LLM enhancement failed, keeping rule reasoning', err)
  }

  return recs
}

/** Punto de entrada principal */
export async function generateOptimizations(userId: string) {
  const metrics = await analyzeProducts(userId)
  const baseRecs = generateRuleOptimizations(metrics)
  const enhanced = await enhanceWithLLM(baseRecs, metrics)
  return { optimizations: enhanced, metrics }
}
