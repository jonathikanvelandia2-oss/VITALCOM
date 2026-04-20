// ── Impact Calculator IA (V21) ──────────────────────────
// Heurísticas calibradas que estiman el impacto $ de aplicar una
// recomendación IA. Proyección conservadora a 30 días, en COP.
// Los valores vuelven a calcularse cuando hay datos reales
// (ver recompute endpoint).

export type ImpactKind = 'savings' | 'revenue' | 'margin' | 'retention'

export type ImpactEstimate = {
  amount: number        // COP, positivo = ganancia (ahorro o ingreso)
  kind: ImpactKind
  rationale: string
}

type MediaBuyerContext = {
  type: string          // RecommendationType
  roas?: number | null
  spend?: number | null
  revenue?: number | null
  suggestedValue?: number | null
  daysWindow?: number   // default 30
}

export function estimateMediaBuyerImpact(ctx: MediaBuyerContext): ImpactEstimate {
  const days = ctx.daysWindow ?? 30
  const spend = ctx.spend ?? 0
  const revenue = ctx.revenue ?? 0
  const roas = ctx.roas ?? 0
  const pct = ctx.suggestedValue ?? 0

  switch (ctx.type) {
    case 'PAUSE_CAMPAIGN': {
      // Ahorro proyectado = lo que habría gastado los próximos 30d - lo que habría generado
      const dailySpend = spend / Math.max(days, 1) * 1.0
      const expectedLoss = dailySpend * 30 * Math.max(0, 1 - roas)
      return {
        amount: Math.round(expectedLoss),
        kind: 'savings',
        rationale: `Gasto diario promedio $${Math.round(dailySpend).toLocaleString('es-CO')} con ROAS ${roas.toFixed(2)}x. Al pausar ahorras ~30 días de pérdida neta = $${Math.round(expectedLoss).toLocaleString('es-CO')}.`,
      }
    }
    case 'REDUCE_BUDGET': {
      const dailySpend = spend / Math.max(days, 1)
      const savings = dailySpend * 30 * (pct / 100) * Math.max(0, 1 - roas * 0.5)
      return {
        amount: Math.round(savings),
        kind: 'savings',
        rationale: `Reducir ${pct}% del budget mantiene la data pero baja pérdida. Ahorro estimado 30d: $${Math.round(savings).toLocaleString('es-CO')}.`,
      }
    }
    case 'SCALE_BUDGET': {
      const dailyRevenue = revenue / Math.max(days, 1)
      const extraRevenue = dailyRevenue * 30 * (pct / 100) * 0.85  // degradación esperada al escalar
      return {
        amount: Math.round(extraRevenue),
        kind: 'revenue',
        rationale: `Revenue diario $${Math.round(dailyRevenue).toLocaleString('es-CO')} · +${pct}% budget proyecta ~$${Math.round(extraRevenue).toLocaleString('es-CO')} incremental en 30d con degradación del 15%.`,
      }
    }
    case 'TEST_CREATIVE': {
      // Mejor CTR típico al refrescar: +30%, traduce a revenue proyectado
      const dailyRevenue = revenue / Math.max(days, 1)
      const uplift = dailyRevenue * 30 * 0.20  // 20% bump esperado conservador
      return {
        amount: Math.round(uplift),
        kind: 'revenue',
        rationale: `Creativo nuevo levanta CTR ~30% y conversión ~20%. Uplift 30d: $${Math.round(uplift).toLocaleString('es-CO')}.`,
      }
    }
    case 'TEST_AUDIENCE':
    case 'OPTIMIZE_BID': {
      const dailySpend = spend / Math.max(days, 1)
      const savings = dailySpend * 30 * 0.15  // 15% CPC reduction típico
      return {
        amount: Math.round(savings),
        kind: 'savings',
        rationale: `Optimización típica baja CPC 15%. Ahorro 30d: $${Math.round(savings).toLocaleString('es-CO')}.`,
      }
    }
    case 'RESTART_CAMPAIGN': {
      const dailyRevenue = revenue / Math.max(days, 1) * 0.7
      const uplift = dailyRevenue * 30
      return {
        amount: Math.round(uplift),
        kind: 'revenue',
        rationale: `Reactivar una campaña con potencial recupera ~70% del performance anterior. Estimado 30d: $${Math.round(uplift).toLocaleString('es-CO')}.`,
      }
    }
    case 'ADD_TRACKING':
    default:
      return {
        amount: 0,
        kind: 'retention',
        rationale: 'Acción preventiva — reduce riesgo de decisiones sin data.',
      }
  }
}

type StoreOptimizerContext = {
  type: string
  salesLast30?: number | null
  revenueLast30?: number | null
  marginPct?: number | null
  stockLevel?: number | null
  suggestedValue?: number | null
  productPrice?: number | null
}

export function estimateStoreOptimizerImpact(ctx: StoreOptimizerContext): ImpactEstimate {
  const sales30 = ctx.salesLast30 ?? 0
  const rev30 = ctx.revenueLast30 ?? 0
  const margin = ctx.marginPct ?? 0
  const price = ctx.productPrice ?? 0
  const suggestedPrice = ctx.suggestedValue ?? 0

  switch (ctx.type) {
    case 'HIGHLIGHT_PRODUCT': {
      // Bench: destacar sube conversión 18%
      const uplift = rev30 * 0.18
      return {
        amount: Math.round(uplift),
        kind: 'revenue',
        rationale: `Destacar un ganador sube conversión ~18% según benchmarks Shopify. Revenue extra 30d: $${Math.round(uplift).toLocaleString('es-CO')}.`,
      }
    }
    case 'PRICING_ADJUSTMENT':
    case 'MARGIN_IMPROVEMENT': {
      if (!price || !suggestedPrice || !sales30) {
        return { amount: 0, kind: 'margin', rationale: 'Sin datos suficientes para estimar.' }
      }
      const delta = suggestedPrice - price
      // Ajuste conservador: subir precio baja volumen ~5% por cada 10% de subida
      const pctChange = delta / price
      const volumeImpact = -pctChange * 0.5  // elasticidad ~0.5
      const projectedSales = sales30 * (1 + volumeImpact)
      const newRev = projectedSales * suggestedPrice
      const diff = newRev - rev30
      return {
        amount: Math.round(diff),
        kind: 'margin',
        rationale: `Con precio $${Math.round(suggestedPrice).toLocaleString('es-CO')} y elasticidad 0.5, proyección revenue 30d ${diff >= 0 ? '+' : ''}$${Math.round(diff).toLocaleString('es-CO')}.`,
      }
    }
    case 'LANDING_COPY': {
      // Copy IA bueno +25% conversión
      const uplift = rev30 * 0.25
      return {
        amount: Math.round(uplift),
        kind: 'revenue',
        rationale: `Landing con copy optimizado por IA sube conversión 25-40%. Proyección conservadora 30d: $${Math.round(uplift).toLocaleString('es-CO')}.`,
      }
    }
    case 'CROSS_SELL': {
      // Bundle sube ticket promedio ~22%
      const uplift = rev30 * 0.22
      return {
        amount: Math.round(uplift),
        kind: 'revenue',
        rationale: `Cross-sell en producto top sube ticket promedio ~22%. Revenue extra 30d: $${Math.round(uplift).toLocaleString('es-CO')}.`,
      }
    }
    case 'PRODUCT_MIX': {
      // Agregar un ganador a la tienda mueve volumen extra
      if (sales30 > 0) {
        const avg = rev30 / sales30
        const expectedSales = Math.max(sales30 * 0.6, 3)
        const extra = avg * expectedSales
        return {
          amount: Math.round(extra),
          kind: 'revenue',
          rationale: `Agregar este producto a tu tienda: ~${Math.round(expectedSales)} ventas proyectadas × ticket $${Math.round(avg).toLocaleString('es-CO')} = $${Math.round(extra).toLocaleString('es-CO')} extra/mes.`,
        }
      }
      return { amount: 0, kind: 'revenue', rationale: 'Producto recién agregado, impacto se medirá en 30d.' }
    }
    case 'RESTOCK_URGENT': {
      // Evitar stockout: cada día sin stock = ventas perdidas
      if (sales30 > 0 && rev30 > 0) {
        const dailyRev = rev30 / 30
        const daysAvoided = 7  // estimamos 7 días de stockout evitados
        const saved = dailyRev * daysAvoided
        return {
          amount: Math.round(saved),
          kind: 'revenue',
          rationale: `Restock evita ~7 días de stockout · revenue diario $${Math.round(dailyRev).toLocaleString('es-CO')} · ventas recuperadas: $${Math.round(saved).toLocaleString('es-CO')}.`,
        }
      }
      return { amount: 0, kind: 'revenue', rationale: 'Sin datos suficientes.' }
    }
    case 'REMOVE_UNDERPERFORMER': {
      return {
        amount: 0,
        kind: 'retention',
        rationale: 'Limpieza del catálogo: mejora enfoque del cliente sin impacto revenue directo.',
      }
    }
    default:
      return { amount: 0, kind: 'retention', rationale: '—' }
  }
}
