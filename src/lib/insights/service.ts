// V34 — Weekly Insight service
// ═══════════════════════════════════════════════════════════
// Orquesta: P&G snapshot (getSnapshot) + Health Score + alertas activas
// + top producto → genera un WeeklyInsight persistido.
//
// Idempotente: upsert por (userId, weekStart). Re-generar la misma semana
// actualiza la narrativa sin duplicar filas.
//
// No hace llamadas LLM por defecto — la narrativa es determinística desde
// templates (generateHeadline + recommendations). Esto ahorra costos y
// asegura consistencia. Si a futuro queremos narrativa IA, envolver con
// llm-router manteniendo la estructura como fallback.

import { prisma } from '@/lib/db/prisma'
import { getSnapshot } from '@/lib/ai/pg-realtime'
import { captureException, captureEvent } from '@/lib/observability'
import {
  getWeekBounds,
  getPreviousWeekBounds,
  deltaPercent,
  generateHeadline,
  generateHighlights,
  generateRecommendations,
  type Highlight,
  type Recommendation,
} from './helpers'
import type { UserHealthSegment } from '@prisma/client'

export interface GenerateParams {
  userId: string
  /** Fecha dentro de la semana a procesar. Default = ahora. */
  asOf?: Date
  /** "cron" | "manual" */
  source?: string
}

export interface GeneratedInsight {
  id: string
  weekStart: Date
  weekEnd: Date
  headline: string
  revenue: number
  revenueDeltaPct: number
  orderCount: number
  netProfit: number
  roas: number
  healthScore: number
  healthDelta: number
  segment: UserHealthSegment | null
  topProductName: string | null
  highlights: Highlight[]
  recommendations: Recommendation[]
  generatedAt: Date
}

export async function generateWeeklyInsight(
  params: GenerateParams,
): Promise<GeneratedInsight | null> {
  const { userId, source = 'manual' } = params
  const asOf = params.asOf ?? new Date()

  try {
    const week = getWeekBounds(asOf)
    const prevWeek = getPreviousWeekBounds(week.start)

    // 1) Snapshots P&G actual + previo — paralelo
    const [pgNow, pgPrev, healthScore, activeAlerts, topProduct, hasShopify] =
      await Promise.all([
        getSnapshot({ userId, from: week.start, to: week.end }),
        getSnapshot({ userId, from: prevWeek.start, to: prevWeek.end }),
        prisma.userHealthScore.findUnique({
          where: { userId },
          select: {
            score: true,
            previousScore: true,
            scoreDelta: true,
            segment: true,
          },
        }),
        // Contamos notificaciones no-leídas de la semana — representan alertas
        // proactivas que el usuario aún no atendió.
        prisma.notification.count({
          where: {
            userId,
            read: false,
            createdAt: { gte: week.start, lte: week.end },
          },
        }),
        findTopProductForUser(userId, week.start, week.end),
        prisma.shopifyStore.findFirst({
          where: { userId, status: 'connected' },
          select: { id: true },
        }),
      ])

    const revenueDeltaPct = deltaPercent(pgNow.revenueGross, pgPrev.revenueGross)
    const healthDelta = healthScore?.scoreDelta ?? 0

    // 2) Narrativa determinística
    const headline = generateHeadline({
      revenueDeltaPct,
      orderCount: pgNow.orderCount,
      orderCountPrev: pgPrev.orderCount,
      healthDelta,
      segment: healthScore?.segment ?? null,
    })

    const highlights = generateHighlights({
      revenue: pgNow.revenueGross,
      revenueDeltaPct,
      orderCount: pgNow.orderCount,
      orderCountPrev: pgPrev.orderCount,
      netProfit: pgNow.netProfit,
      roas: pgNow.roas,
      breakEvenRoas: pgNow.breakEvenRoas,
      topProductName: topProduct?.name ?? null,
    })

    const recommendations = generateRecommendations({
      revenueDeltaPct,
      roas: pgNow.roas,
      breakEvenRoas: pgNow.breakEvenRoas,
      netProfit: pgNow.netProfit,
      orderCount: pgNow.orderCount,
      healthScore: healthScore?.score ?? 0,
      healthDelta,
      activeAlerts,
      hasShopify: Boolean(hasShopify),
    })

    // 3) Upsert idempotente por (userId, weekStart)
    const saved = await prisma.weeklyInsight.upsert({
      where: { userId_weekStart: { userId, weekStart: week.start } },
      create: {
        userId,
        weekStart: week.start,
        weekEnd: week.end,
        revenue: pgNow.revenueGross,
        revenuePrev: pgPrev.revenueGross,
        revenueDeltaPct,
        orderCount: pgNow.orderCount,
        orderCountPrev: pgPrev.orderCount,
        netProfit: pgNow.netProfit,
        roas: pgNow.roas,
        breakEvenRoas: pgNow.breakEvenRoas,
        healthScore: healthScore?.score ?? 0,
        healthScorePrev: healthScore?.previousScore ?? null,
        healthDelta,
        segment: healthScore?.segment ?? null,
        topProductId: topProduct?.id ?? null,
        topProductName: topProduct?.name ?? null,
        topProductSales: topProduct?.sales ?? null,
        headline,
        highlights: highlights as object,
        recommendations: recommendations as object,
        source,
      },
      update: {
        revenue: pgNow.revenueGross,
        revenuePrev: pgPrev.revenueGross,
        revenueDeltaPct,
        orderCount: pgNow.orderCount,
        orderCountPrev: pgPrev.orderCount,
        netProfit: pgNow.netProfit,
        roas: pgNow.roas,
        breakEvenRoas: pgNow.breakEvenRoas,
        healthScore: healthScore?.score ?? 0,
        healthScorePrev: healthScore?.previousScore ?? null,
        healthDelta,
        segment: healthScore?.segment ?? null,
        topProductId: topProduct?.id ?? null,
        topProductName: topProduct?.name ?? null,
        topProductSales: topProduct?.sales ?? null,
        headline,
        highlights: highlights as object,
        recommendations: recommendations as object,
        generatedAt: new Date(),
        source,
        // No sobreescribimos readAt — el usuario lo tocó si lo vio
      },
    })

    captureEvent('insights.weekly.generated', {
      userId,
      extra: {
        weekStart: week.start.toISOString(),
        source,
        revenue: pgNow.revenueGross,
        recommendations: recommendations.length,
      },
    })

    return {
      id: saved.id,
      weekStart: saved.weekStart,
      weekEnd: saved.weekEnd,
      headline: saved.headline,
      revenue: saved.revenue,
      revenueDeltaPct: saved.revenueDeltaPct,
      orderCount: saved.orderCount,
      netProfit: saved.netProfit,
      roas: saved.roas,
      healthScore: saved.healthScore,
      healthDelta: saved.healthDelta,
      segment: saved.segment,
      topProductName: saved.topProductName,
      highlights,
      recommendations,
      generatedAt: saved.generatedAt,
    }
  } catch (err) {
    captureException(err, { route: 'insights.generate', userId })
    return null
  }
}

async function findTopProductForUser(
  userId: string,
  from: Date,
  to: Date,
): Promise<{ id: string; name: string; sales: number } | null> {
  // Top producto por unidades vendidas en la ventana — solo DELIVERED
  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        userId,
        status: 'DELIVERED',
        createdAt: { gte: from, lte: to },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 1,
  })

  const top = grouped[0]
  if (!top || !top._sum.quantity) return null

  const product = await prisma.product.findUnique({
    where: { id: top.productId },
    select: { id: true, name: true },
  })
  if (!product) return null

  return { id: product.id, name: product.name, sales: top._sum.quantity }
}

export async function getLatestInsight(userId: string): Promise<GeneratedInsight | null> {
  const row = await prisma.weeklyInsight.findFirst({
    where: { userId },
    orderBy: { weekStart: 'desc' },
  })
  if (!row) return null
  return {
    id: row.id,
    weekStart: row.weekStart,
    weekEnd: row.weekEnd,
    headline: row.headline,
    revenue: row.revenue,
    revenueDeltaPct: row.revenueDeltaPct,
    orderCount: row.orderCount,
    netProfit: row.netProfit,
    roas: row.roas,
    healthScore: row.healthScore,
    healthDelta: row.healthDelta,
    segment: row.segment,
    topProductName: row.topProductName,
    highlights: (row.highlights as unknown as Highlight[]) ?? [],
    recommendations: (row.recommendations as unknown as Recommendation[]) ?? [],
    generatedAt: row.generatedAt,
  }
}

export async function markInsightAsRead(userId: string, insightId: string): Promise<void> {
  await prisma.weeklyInsight.updateMany({
    where: { id: insightId, userId, readAt: null },
    data: { readAt: new Date() },
  })
}
