import { FinanceRepository } from '@/lib/repositories/finance-repository'
import { InsightsRepository } from '@/lib/repositories/insights-repository'
import type { PnLSummary, Period } from '@/lib/finance/pnl-service'

// ── Vitalcom Blueprint — Diagnóstico 0-100 del dropshipper ──
// Inspirado en ConvertMate (score + acciones) + AI-First pipelines (multi-fuente)
// + DuoWeb (recursos accionables).
//
// 5 pilares que suman 100 puntos:
//   1. Rentabilidad (25)   — margen neto
//   2. Ads (20)            — eficiencia publicidad
//   3. Oferta (20)         — diversificación de productos
//   4. Actividad (20)      — órdenes del periodo
//   5. Entregas (15)       — salud de devoluciones

export type PillarStatus = 'good' | 'warning' | 'critical' | 'empty'

export type BlueprintPillar = {
  id: 'profitability' | 'ads' | 'offer' | 'activity' | 'quality'
  label: string
  score: number
  max: number
  status: PillarStatus
  note: string
}

export type BlueprintTier = 'Semilla' | 'Brote' | 'Hoja' | 'Tallo' | 'Rama' | 'Árbol'

export type BlueprintDiagnostic = {
  score: number
  tier: BlueprintTier
  tierColor: string
  pillars: BlueprintPillar[]
  signals: {
    ingresoBruto: number
    gananciaNeta: number
    margenNeto: number
    ordersCount: number
    ticketPromedio: number
    gastoPublicidad: number
    adsRatio: number
    productsSold: number
    topProductShare: number
    devolucionesRatio: number
  }
  community: {
    avgTicket: number
    totalDropshippers: number
    relativeActivity: 'above' | 'average' | 'below'
  }
  period: Period
}

function tierFromScore(score: number): { tier: BlueprintTier; color: string } {
  if (score >= 85) return { tier: 'Árbol', color: '#C6FF3C' }
  if (score >= 70) return { tier: 'Rama', color: '#A8FF00' }
  if (score >= 55) return { tier: 'Tallo', color: '#DFFF80' }
  if (score >= 40) return { tier: 'Hoja', color: '#FFB800' }
  if (score >= 20) return { tier: 'Brote', color: '#FFB800' }
  return { tier: 'Semilla', color: '#FF4757' }
}

function scoreProfitability(s: PnLSummary): BlueprintPillar {
  if (s.ordersCount === 0) {
    return {
      id: 'profitability',
      label: 'Rentabilidad',
      score: 0,
      max: 25,
      status: 'empty',
      note: 'Sin órdenes registradas para calcular margen.',
    }
  }
  const m = s.margenNeto
  let score = 0
  let status: PillarStatus = 'critical'
  let note = ''
  if (m >= 25) { score = 25; status = 'good'; note = `Margen neto ${m.toFixed(1)}% — élite LATAM (>25%).` }
  else if (m >= 20) { score = 22; status = 'good'; note = `Margen neto ${m.toFixed(1)}% — sobre el benchmark saludable.` }
  else if (m >= 15) { score = 17; status = 'good'; note = `Margen neto ${m.toFixed(1)}% — sólido, cerca del ideal (20-30%).` }
  else if (m >= 10) { score = 12; status = 'warning'; note = `Margen neto ${m.toFixed(1)}% — bajo el ideal LATAM.` }
  else if (m >= 0) { score = 6; status = 'warning'; note = `Margen neto ${m.toFixed(1)}% — apretado, revisa costos.` }
  else { score = 0; status = 'critical'; note = `Margen negativo ${m.toFixed(1)}% — estás perdiendo plata.` }
  return { id: 'profitability', label: 'Rentabilidad', score, max: 25, status, note }
}

function scoreAds(s: PnLSummary): BlueprintPillar {
  if (s.ingresoBruto === 0) {
    return {
      id: 'ads',
      label: 'Eficiencia Ads',
      score: 0,
      max: 20,
      status: 'empty',
      note: 'Registra gasto en ads o ventas para evaluar eficiencia.',
    }
  }
  const ratio = (s.gastoPublicidad / s.ingresoBruto) * 100
  let score = 0
  let status: PillarStatus = 'critical'
  let note = ''
  if (s.gastoPublicidad === 0) {
    return {
      id: 'ads',
      label: 'Eficiencia Ads',
      score: 8,
      max: 20,
      status: 'warning',
      note: 'No has registrado gasto en ads. Si ya inviertes en Meta/TikTok, registra el gasto para medir rentabilidad real.',
    }
  }
  if (ratio >= 15 && ratio <= 25) { score = 20; status = 'good'; note = `Gastas ${ratio.toFixed(0)}% en ads — en la zona ideal (15-25%).` }
  else if (ratio >= 10 && ratio <= 30) { score = 15; status = 'good'; note = `Ads al ${ratio.toFixed(0)}% — cerca del rango óptimo.` }
  else if (ratio < 10) { score = 10; status = 'warning'; note = `Solo ${ratio.toFixed(0)}% en ads — podrías escalar más.` }
  else if (ratio <= 40) { score = 7; status = 'warning'; note = `Ads al ${ratio.toFixed(0)}% — alto, revisa ROAS por campaña.` }
  else { score = 0; status = 'critical'; note = `Ads al ${ratio.toFixed(0)}% — está comiéndose tu margen.` }
  return { id: 'ads', label: 'Eficiencia Ads', score, max: 20, status, note }
}

function scoreOffer(productsSold: number, topShare: number): BlueprintPillar {
  let score = 0
  let status: PillarStatus = 'empty'
  let note = ''
  if (productsSold === 0) {
    return {
      id: 'offer',
      label: 'Diversificación',
      score: 0,
      max: 20,
      status: 'empty',
      note: 'Aún no has vendido productos en este periodo.',
    }
  }
  if (productsSold >= 5 && topShare < 40) { score = 20; status = 'good'; note = `${productsSold} productos activos, riesgo distribuido.` }
  else if (productsSold >= 5) { score = 15; status = 'warning'; note = `${productsSold} productos pero ${topShare.toFixed(0)}% depende de uno — riesgo de concentración.` }
  else if (productsSold >= 3) { score = 12; status = 'warning'; note = `${productsSold} productos — amplía oferta para diversificar.` }
  else if (productsSold >= 2) { score = 8; status = 'warning'; note = `Solo ${productsSold} productos activos — suma más ganadores.` }
  else { score = 4; status = 'critical'; note = `Un solo producto vendiendo — vulnerable si cambia la demanda.` }
  return { id: 'offer', label: 'Diversificación', score, max: 20, status, note }
}

function scoreActivity(ordersCount: number): BlueprintPillar {
  let score = 0
  let status: PillarStatus = 'critical'
  let note = ''
  if (ordersCount === 0) {
    return {
      id: 'activity',
      label: 'Actividad',
      score: 0,
      max: 20,
      status: 'empty',
      note: 'Aún no tienes órdenes registradas.',
    }
  }
  if (ordersCount >= 30) { score = 20; status = 'good'; note = `${ordersCount} órdenes — ritmo de +1 al día, buen volumen.` }
  else if (ordersCount >= 15) { score = 15; status = 'good'; note = `${ordersCount} órdenes — actividad constante.` }
  else if (ordersCount >= 5) { score = 10; status = 'warning'; note = `${ordersCount} órdenes — crece el volumen con más tráfico.` }
  else { score = 4; status = 'warning'; note = `${ordersCount} órdenes — apenas arrancando, foco en tráfico.` }
  return { id: 'activity', label: 'Actividad', score, max: 20, status, note }
}

function scoreQuality(s: PnLSummary): BlueprintPillar {
  if (s.ordersCount === 0) {
    return {
      id: 'quality',
      label: 'Entregas',
      score: 0,
      max: 15,
      status: 'empty',
      note: 'Sin órdenes entregadas para evaluar calidad.',
    }
  }
  const ratio = s.ingresoBruto > 0 ? (s.devoluciones / s.ingresoBruto) * 100 : 0
  let score = 0
  let status: PillarStatus = 'critical'
  let note = ''
  if (ratio < 3) { score = 15; status = 'good'; note = `Devoluciones ${ratio.toFixed(1)}% — excelente.` }
  else if (ratio < 5) { score = 11; status = 'good'; note = `Devoluciones ${ratio.toFixed(1)}% — dentro del benchmark (<5%).` }
  else if (ratio < 10) { score = 6; status = 'warning'; note = `Devoluciones ${ratio.toFixed(1)}% — revisa empaque y expectativas.` }
  else { score = 0; status = 'critical'; note = `Devoluciones ${ratio.toFixed(1)}% — problema serio, audita calidad.` }
  return { id: 'quality', label: 'Entregas', score, max: 15, status, note }
}

export async function computeBlueprint(userId: string, period: Period = '30d'): Promise<BlueprintDiagnostic> {
  const [summary, profitability, communityStats] = await Promise.all([
    FinanceRepository.getPnL(userId, period),
    FinanceRepository.getProfitability(userId, period, 20),
    InsightsRepository.getCommunityStats(period),
  ])

  const productsSold = profitability.length
  const totalRevenue = profitability.reduce((acc, p: any) => acc + (p.revenue ?? 0), 0)
  const topShare = productsSold > 0 && totalRevenue > 0
    ? ((profitability[0] as any).revenue / totalRevenue) * 100
    : 0

  const pillars: BlueprintPillar[] = [
    scoreProfitability(summary),
    scoreAds(summary),
    scoreOffer(productsSold, topShare),
    scoreActivity(summary.ordersCount),
    scoreQuality(summary),
  ]

  const score = pillars.reduce((acc, p) => acc + p.score, 0)
  const { tier, color } = tierFromScore(score)

  // Comparación relativa: si el user tiene >1.5x del ticket promedio de la comunidad, está sobre promedio
  let relativeActivity: 'above' | 'average' | 'below' = 'average'
  if (communityStats.avgTicket > 0 && summary.ticketPromedio > 0) {
    const ratio = summary.ticketPromedio / communityStats.avgTicket
    if (ratio >= 1.2) relativeActivity = 'above'
    else if (ratio <= 0.8) relativeActivity = 'below'
  }

  return {
    score,
    tier,
    tierColor: color,
    pillars,
    signals: {
      ingresoBruto: summary.ingresoBruto,
      gananciaNeta: summary.gananciaNeta,
      margenNeto: summary.margenNeto,
      ordersCount: summary.ordersCount,
      ticketPromedio: summary.ticketPromedio,
      gastoPublicidad: summary.gastoPublicidad,
      adsRatio: summary.ingresoBruto > 0 ? (summary.gastoPublicidad / summary.ingresoBruto) * 100 : 0,
      productsSold,
      topProductShare: topShare,
      devolucionesRatio: summary.ingresoBruto > 0 ? (summary.devoluciones / summary.ingresoBruto) * 100 : 0,
    },
    community: {
      avgTicket: communityStats.avgTicket,
      totalDropshippers: communityStats.activeDropshippers,
      relativeActivity,
    },
    period,
  }
}
