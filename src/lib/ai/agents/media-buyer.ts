import OpenAI from 'openai'
import { prisma } from '@/lib/db/prisma'
import type { RecommendationType, AdPlatform } from '@prisma/client'

// ── Agente MediaBuyer IA ─────────────────────────────────
// Analiza campañas activas del dropshipper y genera recomendaciones
// concretas: pausar, escalar, reducir, testear creativo/audiencia.
//
// Arquitectura: reglas deterministas primero (confiables, rápidas)
// + opcional capa LLM que enriquece el reasoning con lenguaje natural.

const BENCHMARKS = {
  ROAS_PAUSE_THRESHOLD: 1.3,       // <1.3x sostenido = pausar
  ROAS_REDUCE_THRESHOLD: 2.0,       // <2x = reducir budget 30%
  ROAS_SCALE_THRESHOLD: 3.5,        // >3.5x sostenido = escalar +30%
  ROAS_HIGH_SCALE: 5.0,             // >5x = escalar +50% agresivo
  CPC_HIGH_META: 800,               // COP — CPC alto en Meta
  CPC_HIGH_TIKTOK: 600,
  CPC_HIGH_GOOGLE: 1200,
  CTR_LOW_THRESHOLD: 0.8,           // <0.8% = creativo fatigado
  MIN_DAYS_FOR_DECISION: 3,         // No decide con <3 días de datos
  MIN_SPEND_FOR_DECISION: 30000,    // No decide con <$30k COP
}

type CampaignAnalysis = {
  campaignId: string
  campaignName: string
  accountId: string
  platform: AdPlatform
  currency: string
  days: number
  spend: number
  revenue: number
  clicks: number
  conversions: number
  impressions: number
  roas: number
  cpc: number
  ctr: number
  cpa: number
  trend: 'up' | 'stable' | 'down'
}

export type Recommendation = {
  type: RecommendationType
  campaignId: string | null
  accountId: string | null
  title: string
  reasoning: string
  actionLabel: string
  suggestedValue: number | null
  priority: number              // 0-100
  confidence: number            // 0-1
  metrics: {
    roas: number | null
    spend: number | null
    revenue: number | null
    clicks: number | null
    conversions: number | null
    impressions: number | null
  }
}

/** Calcula métricas por campaña en los últimos N días */
async function analyzeCampaigns(userId: string, days: number = 7): Promise<CampaignAnalysis[]> {
  const from = new Date(Date.now() - days * 86400000)
  const halfPoint = new Date(Date.now() - (days / 2) * 86400000)

  const campaigns = await prisma.adCampaign.findMany({
    where: {
      account: { userId, active: true },
    },
    include: {
      account: { select: { id: true, platform: true, currency: true } },
      spendEntries: {
        where: { date: { gte: from } },
      },
    },
  })

  // Ingresos del periodo (para ROAS aproximado global)
  const revenueAgg = await prisma.order.aggregate({
    where: {
      userId,
      status: { in: ['DELIVERED', 'DISPATCHED'] },
      createdAt: { gte: from },
    },
    _sum: { total: true },
  })
  const totalRevenue = revenueAgg._sum.total ?? 0

  const results: CampaignAnalysis[] = []

  for (const c of campaigns) {
    const entries = c.spendEntries
    if (entries.length === 0) continue

    const spend = entries.reduce((s, e) => s + (e.spend ?? 0), 0)
    const clicks = entries.reduce((s, e) => s + (e.clicks ?? 0), 0)
    const conversions = entries.reduce((s, e) => s + (e.conversions ?? 0), 0)
    const impressions = entries.reduce((s, e) => s + (e.impressions ?? 0), 0)

    // ROAS estimado: ingresos atribuidos proporcionalmente al share de spend
    const totalSpendAll = campaigns.reduce(
      (s, cc) => s + cc.spendEntries.reduce((ss, e) => ss + (e.spend ?? 0), 0),
      0,
    )
    const spendShare = totalSpendAll > 0 ? spend / totalSpendAll : 0
    const revenue = totalRevenue * spendShare

    const roas = spend > 0 ? revenue / spend : 0
    const cpc = clicks > 0 ? spend / clicks : 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const cpa = conversions > 0 ? spend / conversions : 0

    // Tendencia: comparar primera mitad vs segunda mitad
    const firstHalf = entries.filter((e) => e.date < halfPoint)
    const secondHalf = entries.filter((e) => e.date >= halfPoint)
    const firstHalfSpend = firstHalf.reduce((s, e) => s + (e.spend ?? 0), 0)
    const secondHalfSpend = secondHalf.reduce((s, e) => s + (e.spend ?? 0), 0)
    const trend: 'up' | 'stable' | 'down' =
      secondHalfSpend > firstHalfSpend * 1.15 ? 'up' :
      secondHalfSpend < firstHalfSpend * 0.85 ? 'down' : 'stable'

    const daysActive = Array.from(new Set(entries.map((e) => e.date.toISOString().slice(0, 10)))).length

    results.push({
      campaignId: c.id,
      campaignName: c.name,
      accountId: c.account.id,
      platform: c.account.platform,
      currency: c.account.currency,
      days: daysActive,
      spend,
      revenue,
      clicks,
      conversions,
      impressions,
      roas,
      cpc,
      ctr,
      cpa,
      trend,
    })
  }

  return results
}

/** Reglas deterministas → genera recomendaciones con numeritos concretos */
function generateRuleRecommendations(analyses: CampaignAnalysis[]): Recommendation[] {
  const recs: Recommendation[] = []

  for (const a of analyses) {
    const metrics = {
      roas: a.roas,
      spend: a.spend,
      revenue: a.revenue,
      clicks: a.clicks,
      conversions: a.conversions,
      impressions: a.impressions,
    }
    const base = {
      campaignId: a.campaignId,
      accountId: a.accountId,
      metrics,
    }

    // Datos insuficientes → recomienda más tracking
    if (a.days < BENCHMARKS.MIN_DAYS_FOR_DECISION || a.spend < BENCHMARKS.MIN_SPEND_FOR_DECISION) {
      recs.push({
        ...base,
        type: 'ADD_TRACKING',
        title: `Registra más días de "${a.campaignName}"`,
        reasoning: `Solo ${a.days} día(s) con $${a.spend.toLocaleString('es-CO')} gastados. Se necesitan al menos ${BENCHMARKS.MIN_DAYS_FOR_DECISION} días y $${BENCHMARKS.MIN_SPEND_FOR_DECISION.toLocaleString('es-CO')} para decidir con confianza.`,
        actionLabel: 'Ver campaña',
        suggestedValue: null,
        priority: 30,
        confidence: 0.9,
      })
      continue
    }

    // ROAS crítico → pausar
    if (a.roas > 0 && a.roas < BENCHMARKS.ROAS_PAUSE_THRESHOLD) {
      recs.push({
        ...base,
        type: 'PAUSE_CAMPAIGN',
        title: `Pausa "${a.campaignName}" — está perdiendo plata`,
        reasoning: `ROAS de ${a.roas.toFixed(2)}x en ${a.days} días con $${a.spend.toLocaleString('es-CO')} gastados. Por cada $1 invertido estás recuperando $${a.roas.toFixed(2)}. Pausar corta el sangrado mientras analizas el creativo o audiencia.`,
        actionLabel: 'Pausar ahora',
        suggestedValue: null,
        priority: 95,
        confidence: 0.9,
      })
      continue
    }

    // ROAS marginal → reducir budget
    if (a.roas >= BENCHMARKS.ROAS_PAUSE_THRESHOLD && a.roas < BENCHMARKS.ROAS_REDUCE_THRESHOLD) {
      recs.push({
        ...base,
        type: 'REDUCE_BUDGET',
        title: `Reduce budget de "${a.campaignName}" en 30%`,
        reasoning: `ROAS de ${a.roas.toFixed(2)}x — apenas rentable. Reducir el budget baja el gasto pero mantiene la data corriendo mientras optimizas creativo o copy.`,
        actionLabel: 'Reducir -30%',
        suggestedValue: -30,
        priority: 60,
        confidence: 0.75,
      })
    }

    // ROAS alto → escalar
    if (a.roas >= BENCHMARKS.ROAS_SCALE_THRESHOLD && a.roas < BENCHMARKS.ROAS_HIGH_SCALE) {
      recs.push({
        ...base,
        type: 'SCALE_BUDGET',
        title: `Escala "${a.campaignName}" +30%`,
        reasoning: `ROAS sostenido de ${a.roas.toFixed(2)}x — la campaña está en zona ganadora. Subir el budget 30% cada 2-3 días permite capturar más volumen sin romper el algoritmo de aprendizaje.`,
        actionLabel: 'Subir +30%',
        suggestedValue: 30,
        priority: 85,
        confidence: 0.85,
      })
    }

    // ROAS muy alto → escalar agresivo
    if (a.roas >= BENCHMARKS.ROAS_HIGH_SCALE) {
      recs.push({
        ...base,
        type: 'SCALE_BUDGET',
        title: `Duplica budget de "${a.campaignName}" ya`,
        reasoning: `ROAS de ${a.roas.toFixed(2)}x — estás dejando plata sobre la mesa. Recomendamos +50% agresivo y monitorear 48h. Si se mantiene >${BENCHMARKS.ROAS_SCALE_THRESHOLD}x, sigue escalando.`,
        actionLabel: 'Subir +50%',
        suggestedValue: 50,
        priority: 98,
        confidence: 0.9,
      })
    }

    // CTR bajo → testear nuevo creativo
    if (a.ctr > 0 && a.ctr < BENCHMARKS.CTR_LOW_THRESHOLD && a.impressions > 5000) {
      recs.push({
        ...base,
        type: 'TEST_CREATIVE',
        title: `Refresca el creativo de "${a.campaignName}"`,
        reasoning: `CTR de ${a.ctr.toFixed(2)}% con ${a.impressions.toLocaleString('es-CO')} impresiones — por debajo del 0.8% sano. La audiencia ya vio el anuncio y empieza a ignorarlo. Lanza 2-3 variantes nuevas desde el Lanzador.`,
        actionLabel: 'Nuevo creativo',
        suggestedValue: null,
        priority: 70,
        confidence: 0.8,
      })
    }

    // CPC alto según plataforma → optimizar bid
    const cpcBenchmark =
      a.platform === 'META' ? BENCHMARKS.CPC_HIGH_META :
      a.platform === 'TIKTOK' ? BENCHMARKS.CPC_HIGH_TIKTOK :
      a.platform === 'GOOGLE' ? BENCHMARKS.CPC_HIGH_GOOGLE : 1000

    if (a.cpc > cpcBenchmark && a.clicks > 50) {
      recs.push({
        ...base,
        type: 'OPTIMIZE_BID',
        title: `CPC alto en "${a.campaignName}" (${a.platform})`,
        reasoning: `Estás pagando $${a.cpc.toFixed(0)} por clic, cuando el benchmark para ${a.platform} es ~$${cpcBenchmark.toLocaleString('es-CO')}. Puede ser audiencia demasiado amplia o bid manual mal calibrado. Prueba acotar intereses o cambiar a bid automático.`,
        actionLabel: 'Revisar audiencia',
        suggestedValue: null,
        priority: 50,
        confidence: 0.7,
      })
    }
  }

  // Si no hay campañas con datos → recomendación general
  if (analyses.length === 0) {
    recs.push({
      type: 'ADD_TRACKING',
      campaignId: null,
      accountId: null,
      title: 'Aún no hay campañas para analizar',
      reasoning: 'Registra tu primer gasto publicitario en Publicidad o crea una campaña desde el Lanzador. Con 3 días de datos MediaBuyer empieza a darte recomendaciones concretas.',
      actionLabel: 'Ir a Publicidad',
      suggestedValue: null,
      priority: 100,
      confidence: 1,
      metrics: { roas: null, spend: null, revenue: null, clicks: null, conversions: null, impressions: null },
    })
  }

  return recs.sort((a, b) => b.priority - a.priority)
}

/** Enriquece el reasoning con lenguaje natural LLM (opcional) */
async function enhanceWithLLM(recs: Recommendation[], analyses: CampaignAnalysis[]): Promise<Recommendation[]> {
  if (!process.env.OPENAI_API_KEY || recs.length === 0) return recs

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const summary = analyses
      .slice(0, 10)
      .map(
        (a) =>
          `"${a.campaignName}" (${a.platform}): ROAS ${a.roas.toFixed(2)}x, CTR ${a.ctr.toFixed(2)}%, CPC $${a.cpc.toFixed(0)}, ${a.days}d, $${a.spend.toLocaleString('es-CO')} gastados, tendencia ${a.trend}`,
      )
      .join('\n')

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un MediaBuyer experto de Vitalcom (LATAM dropshipping). Tu trabajo: enriquecer las recomendaciones existentes con contexto conversacional breve. Respondes JSON con array "enhanced" de objetos {index, reasoning}. Max 2 líneas por reasoning, tono de mentor experto, español neutro.`,
        },
        {
          role: 'user',
          content: `Estado del media-buy:\n${summary}\n\nRecomendaciones a enriquecer:\n${recs.slice(0, 6).map((r, i) => `${i}. [${r.type}] ${r.title} — ${r.reasoning}`).join('\n')}\n\nDevuelve JSON {"enhanced": [{"index": 0, "reasoning": "..."}]}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.enhanced)) {
      for (const e of parsed.enhanced) {
        if (typeof e.index === 'number' && recs[e.index] && typeof e.reasoning === 'string') {
          recs[e.index].reasoning = e.reasoning
        }
      }
    }
  } catch (err) {
    console.error('[media-buyer] LLM enhancement failed, keeping rule reasoning', err)
  }

  return recs
}

/** Punto de entrada principal: genera recomendaciones para un usuario */
export async function generateRecommendations(userId: string, days: number = 7) {
  const analyses = await analyzeCampaigns(userId, days)
  const baseRecs = generateRuleRecommendations(analyses)
  const enhanced = await enhanceWithLLM(baseRecs, analyses)
  return { recommendations: enhanced, analyses }
}
