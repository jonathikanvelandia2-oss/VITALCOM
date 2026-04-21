// V29 — A/B testing de templates WhatsApp
// ═══════════════════════════════════════════════════════════
// Dado un templateName, elige al azar una variante ponderada
// entre los templates del mismo `variantGroup` en la cuenta.
// Si no hay variantes agrupadas, devuelve el mismo templateName.
//
// Uso en workflow-engine:
//   const chosen = await resolveTemplateVariant(accountId, templateName)
//   sendTemplate({ templateName: chosen.metaName, ... })
//
// Uso en broadcast:
//   const variant = pickWeightedVariant(variants)
//   → asigna variantKey al recipient y envía con template específico

import { prisma } from '@/lib/db/prisma'

export interface TemplateVariant {
  id: string
  metaName: string
  weight: number
  variantKey?: string
}

// Weighted random picker (cumulative)
export function pickWeightedVariant<T extends { weight: number }>(variants: T[]): T {
  if (variants.length === 0) throw new Error('No variants')
  if (variants.length === 1) return variants[0]

  const totalWeight = variants.reduce((s, v) => s + Math.max(0, v.weight), 0)
  if (totalWeight <= 0) return variants[0]

  let r = Math.random() * totalWeight
  for (const v of variants) {
    r -= Math.max(0, v.weight)
    if (r <= 0) return v
  }
  return variants[variants.length - 1]
}

// Para workflow engine: dado templateName, busca variantes y elige una
export async function resolveTemplateVariant(
  accountId: string,
  templateName: string,
): Promise<{ metaName: string; templateId: string | null; variantKey: string | null }> {
  const base = await prisma.whatsappTemplate.findFirst({
    where: { accountId, metaName: templateName },
  })

  // Sin variantGroup → template único, no A/B
  if (!base?.variantGroup) {
    return {
      metaName: templateName,
      templateId: base?.id ?? null,
      variantKey: null,
    }
  }

  const variants = await prisma.whatsappTemplate.findMany({
    where: {
      accountId,
      variantGroup: base.variantGroup,
      status: { in: ['APPROVED', 'DRAFT'] },
    },
  })

  if (variants.length <= 1) {
    return { metaName: templateName, templateId: base.id, variantKey: null }
  }

  const chosen = pickWeightedVariant(variants.map(v => ({
    id: v.id,
    metaName: v.metaName,
    weight: v.weight,
  })))

  // variantKey = letras A, B, C... según orden alfabético de metaName
  const sorted = [...variants].sort((a, b) => a.metaName.localeCompare(b.metaName))
  const idx = sorted.findIndex(v => v.id === chosen.id)
  const variantKey = String.fromCharCode(65 + Math.max(0, idx))

  return { metaName: chosen.metaName, templateId: chosen.id, variantKey }
}

// Stats por variante para dashboard
export async function getVariantStats(accountId: string, variantGroup: string): Promise<Array<{
  templateId: string
  metaName: string
  weight: number
  sent: number
  opened: number
  clicked: number
  blocked: number
  broadcastSent: number
  broadcastDelivered: number
  broadcastRead: number
  broadcastFailed: number
}>> {
  const variants = await prisma.whatsappTemplate.findMany({
    where: { accountId, variantGroup },
  })

  const stats = await Promise.all(variants.map(async v => {
    const recipientStats = await prisma.whatsappBroadcastRecipient.groupBy({
      by: ['status'],
      where: { templateId: v.id },
      _count: { _all: true },
    })
    const counts = recipientStats.reduce((acc, r) => {
      acc[r.status] = r._count._all
      return acc
    }, {} as Record<string, number>)

    return {
      templateId: v.id,
      metaName: v.metaName,
      weight: v.weight,
      sent: v.timesSent,
      opened: v.timesOpened,
      clicked: v.timesClicked,
      blocked: v.timesBlocked,
      broadcastSent: counts.SENT ?? 0,
      broadcastDelivered: counts.DELIVERED ?? 0,
      broadcastRead: counts.READ ?? 0,
      broadcastFailed: counts.FAILED ?? 0,
    }
  }))

  return stats
}
