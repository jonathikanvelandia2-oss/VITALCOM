// V26 — Vitalcomer Persona Skill
// ═══════════════════════════════════════════════════════════
// Detecta en qué etapa está el dropshipper (rookie/learner/
// operator/expert/master) y adapta el tono, profundidad y
// terminología del agente. Basado 100% en datos reales:
// - pedidos entregados (totales y últimos 30d)
// - días activo
// - margen promedio (calculado desde FinanceEntry del último mes)
// - estilo de comunicación inferido de mensajes pasados

import { prisma } from '@/lib/db/prisma'
import { FinanceType } from '@prisma/client'

export type PersonaTier = 'rookie' | 'learner' | 'operator' | 'expert' | 'master'

export interface Persona {
  tier: PersonaTier
  ordersTotal: number
  ordersLast30d: number
  avgMarginPct: number
  daysActive: number
  preferredCountry?: string
  communicationStyle: 'formal' | 'casual' | 'emoji-friendly'
  technicalLevel: 'basic' | 'intermediate' | 'advanced'
  firstName: string
}

function classifyTier(params: {
  ordersTotal: number
  daysActive: number
  avgMarginPct: number
  ordersLast30d: number
}): PersonaTier {
  const { ordersTotal, daysActive, avgMarginPct, ordersLast30d } = params
  if (ordersTotal < 3 || daysActive < 7) return 'rookie'
  if (ordersTotal < 20) return 'learner'
  if (ordersTotal < 100) return 'operator'
  if (ordersTotal < 500 && avgMarginPct > 15 && ordersLast30d > 10) return 'expert'
  if (ordersTotal >= 500 && ordersLast30d > 20 && avgMarginPct > 18) return 'master'
  return 'operator'
}

export async function getPersona(userId: string): Promise<Persona> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, name: true, country: true },
  })

  if (!user) {
    // User no existe — devolver persona default rookie
    return {
      tier: 'rookie',
      ordersTotal: 0,
      ordersLast30d: 0,
      avgMarginPct: 0,
      daysActive: 0,
      communicationStyle: 'casual',
      technicalLevel: 'basic',
      firstName: 'amigo',
    }
  }

  const [ordersTotal, ordersLast30d, financeStats, recentMessages, topCountry] = await Promise.all([
    prisma.order.count({
      where: { userId, status: 'DELIVERED' },
    }),
    prisma.order.count({
      where: {
        userId,
        status: 'DELIVERED',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.financeEntry.groupBy({
      by: ['type'],
      where: { userId, date: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.conversationMessage.findMany({
      where: { thread: { userId }, role: 'USER' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { content: true },
    }),
    prisma.order.groupBy({
      by: ['country'],
      where: { userId },
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    }),
  ])

  const daysActive = Math.max(0, Math.floor((now.getTime() - user.createdAt.getTime()) / 86400_000))

  // Margen = (ingresos - egresos) / ingresos × 100
  const ingresos = financeStats.find(f => f.type === FinanceType.INGRESO)?._sum.amount ?? 0
  const egresos = financeStats.find(f => f.type === FinanceType.EGRESO)?._sum.amount ?? 0
  const avgMarginPct = ingresos > 0 ? ((ingresos - egresos) / ingresos) * 100 : 0

  const tier = classifyTier({ ordersTotal, daysActive, avgMarginPct, ordersLast30d })

  // Inferir estilo de comunicación
  const joinedText = recentMessages.map(m => m.content).join(' ')
  const emojiCount = (joinedText.match(/[\u{1F300}-\u{1F9FF}]/gu) ?? []).length
  const hasFormalWords = /(estimado|cordialmente|atentamente|buen d[ií]a, se[ñn]or)/i.test(joinedText)

  const communicationStyle: Persona['communicationStyle'] =
    emojiCount > 3 ? 'emoji-friendly' :
    hasFormalWords ? 'formal' : 'casual'

  const technicalLevel: Persona['technicalLevel'] =
    tier === 'rookie' ? 'basic' :
    tier === 'learner' || tier === 'operator' ? 'intermediate' :
    'advanced'

  const firstName = (user.name ?? '').split(' ')[0] || 'amigo'
  const preferredCountry = topCountry[0]?.country ?? user.country ?? undefined

  return {
    tier,
    ordersTotal,
    ordersLast30d,
    avgMarginPct,
    daysActive,
    preferredCountry,
    communicationStyle,
    technicalLevel,
    firstName,
  }
}

// Genera el bloque de sistema-prompt personalizado
export function personaToSystemPrompt(persona: Persona): string {
  const tierGuidance: Record<PersonaTier, string> = {
    rookie: `
- Este usuario es NUEVO (<3 pedidos o <7 días).
- Tono cálido, motivador, NUNCA condescendiente.
- Explica términos técnicos la primera vez que los menciones (ROAS, CPA, margen).
- Prioriza acciones concretas y simples: "haz X, luego Y".
- NO lo agobies con métricas complejas.`,
    learner: `
- Usuario aprendiendo (3-20 pedidos entregados).
- Puede entender conceptos básicos de dropshipping y ads.
- Usa ejemplos concretos con SUS datos cuando sea posible.
- Ofrece 2-3 opciones ordenadas por impacto.`,
    operator: `
- Operador establecido (20-100 pedidos entregados).
- Asume conocimiento básico-intermedio de ads, P&G y catálogo.
- Sé directo con los números: "Tu ROAS 1.8x vs 2.4x de break-even".
- Evita explicaciones básicas salvo que pregunten explícitamente.`,
    expert: `
- Experto (100-500 pedidos, margen >15%).
- Usa terminología avanzada sin explicar.
- Ofrece insights que un operador normal no detectaría.
- Comparaciones vs percentiles altos de la comunidad.
- Sugiere escalamiento agresivo con cobertura de riesgo.`,
    master: `
- Top-tier (+500 pedidos, muy activo).
- Trátalo como peer. Ofrece data cruda, análisis avanzado, hipótesis.
- Propón tests A/B, optimizaciones marginales, automatización.
- Valida hipótesis con él en vez de asumir respuestas.`,
  }

  const styleGuidance: Record<Persona['communicationStyle'], string> = {
    formal: '- Mantén tono profesional pero cercano.',
    casual: '- Tono cercano y natural, tutea.',
    'emoji-friendly': '- Puedes usar 1-2 emojis ocasionalmente para mantener el tono del usuario.',
  }

  return `
## Persona del usuario
Nombre: ${persona.firstName}
Tier: ${persona.tier.toUpperCase()}
Pedidos entregados: ${persona.ordersTotal} total · ${persona.ordersLast30d} últimos 30d
Margen promedio: ${persona.avgMarginPct.toFixed(1)}%
Días activo: ${persona.daysActive}
País principal: ${persona.preferredCountry ?? 'no detectado'}

## Guía de comunicación
${tierGuidance[persona.tier].trim()}
${styleGuidance[persona.communicationStyle]}

## Regla general
Adapta profundidad y ejemplos al tier exacto. Nunca humilles al rookie ni subestimes al master.
Cuando sea útil, usa el nombre "${persona.firstName}" para personalizar la respuesta.`.trim()
}
