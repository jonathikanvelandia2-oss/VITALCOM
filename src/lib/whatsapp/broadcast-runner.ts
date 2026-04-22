// V29 — Broadcast runner
// ═══════════════════════════════════════════════════════════
// Ejecuta un broadcast: resuelve segmentación, crea recipients
// (asignando variante A/B si corresponde), envía plantillas en
// tandas con delay para respetar rate limit Meta, actualiza stats.
//
// Respeta:
// - opt-out (contact.isOptedIn=false → skip)
// - cuenta activa
// - rate limit (pausa 200ms entre envíos por cuenta)
//
// Modo MOCK: los envíos loguean + crean WhatsappMessage vía sendTemplate.

import { prisma } from '@/lib/db/prisma'
import { sendTemplate } from './client'
import { pickWeightedVariant } from './ab-testing'
import {
  WaBroadcastStatus,
  WaBroadcastRecipientStatus,
} from '@prisma/client'

export interface SegmentFilter {
  segment?: string
  tags?: string[]
  country?: string
  minLtv?: number
  excludeTags?: string[]
  onlyOptedIn?: boolean      // default true
}

// Tamaño máximo absoluto (protección contra broadcasts masivos que
// podrían saturar memoria en una sola request serverless).
export const MAX_RECIPIENTS = 5000
// Cursor page size — paginamos para no cargar todo en memoria.
export const RESOLVE_CHUNK = 500

// ─── Helpers puros (testables sin Prisma) ───────────────────

// Construye el `where` de Prisma desde un SegmentFilter. Aislado para
// garantizar que `onlyOptedIn=false` no introduce contactos opt-out por
// accidente y que los filtros opcionales no colisionan.
export function buildSegmentWhere(accountId: string, filter: SegmentFilter) {
  return {
    accountId,
    ...(filter.onlyOptedIn !== false ? { isOptedIn: true } : {}),
    ...(filter.segment ? { segment: filter.segment } : {}),
    ...(filter.country ? { shippingCountry: filter.country } : {}),
    ...(filter.minLtv != null ? { lifetimeValue: { gte: filter.minLtv } } : {}),
  }
}

// Filtro de tags en memoria (Prisma no puede indexar JSON arrays con
// contains bidireccional; lo hacemos después del fetch). Crítico: un
// bug aquí manda el broadcast al segmento equivocado.
export function matchesTagFilter(
  contactTags: unknown,
  includeTags: string[],
  excludeTags: string[],
): boolean {
  const tagList = Array.isArray(contactTags) ? contactTags as Array<{ key?: string }> : []
  const keys = tagList.map(t => t?.key).filter(Boolean) as string[]
  if (includeTags.length > 0 && !includeTags.some(t => keys.includes(t))) return false
  if (excludeTags.length > 0 && excludeTags.some(t => keys.includes(t))) return false
  return true
}

// Indica si un filtro requiere pasada en memoria adicional después del query.
export function needsTagFilter(filter: SegmentFilter): boolean {
  return (filter.tags?.length ?? 0) > 0 || (filter.excludeTags?.length ?? 0) > 0
}

// Resuelve los contactos que matchean el filtro.
// Usa cursor-pagination para procesar en chunks, evitando cargar
// miles de filas de una sola vez (causaba picos de memoria en Vercel).
export async function resolveRecipients(
  accountId: string,
  filter: SegmentFilter,
): Promise<Array<{ id: string; phoneE164: string; firstName: string | null; tags: unknown }>> {
  const where = buildSegmentWhere(accountId, filter)
  const includeTags = filter.tags ?? []
  const excludeTags = filter.excludeTags ?? []
  const applyTagFilter = needsTagFilter(filter)

  const out: Array<{ id: string; phoneE164: string; firstName: string | null; tags: unknown }> = []
  let cursor: string | undefined
  while (out.length < MAX_RECIPIENTS) {
    const batch = await prisma.whatsappContact.findMany({
      where,
      select: { id: true, phoneE164: true, firstName: true, tags: true },
      orderBy: { id: 'asc' },
      take: RESOLVE_CHUNK,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    if (batch.length === 0) break

    const filtered = applyTagFilter
      ? batch.filter(c => matchesTagFilter(c.tags, includeTags, excludeTags))
      : batch

    for (const r of filtered) {
      out.push(r)
      if (out.length >= MAX_RECIPIENTS) break
    }

    cursor = batch[batch.length - 1]!.id
    if (batch.length < RESOLVE_CHUNK) break
  }
  return out
}

// Crea recipients + asigna variante A/B
export async function prepareBroadcast(broadcastId: string): Promise<{
  totalRecipients: number
  skippedOptedOut: number
}> {
  const broadcast = await prisma.whatsappBroadcast.findUniqueOrThrow({
    where: { id: broadcastId },
  })

  const filter = (broadcast.segmentFilter ?? {}) as SegmentFilter
  const candidates = await resolveRecipients(broadcast.accountId, filter)

  // Si hay variantGroup, cargar variantes
  let variants: Array<{ id: string; metaName: string; weight: number; variantKey: string }> = []
  if (broadcast.variantGroup) {
    const tmpls = await prisma.whatsappTemplate.findMany({
      where: { accountId: broadcast.accountId, variantGroup: broadcast.variantGroup },
      orderBy: { metaName: 'asc' },
    })
    variants = tmpls.map((t, idx) => ({
      id: t.id,
      metaName: t.metaName,
      weight: t.weight,
      variantKey: String.fromCharCode(65 + idx),
    }))
  }

  // Crear recipients en batches para rendimiento
  const BATCH = 500
  let created = 0
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH)
    await prisma.whatsappBroadcastRecipient.createMany({
      data: batch.map(c => {
        const chosen = variants.length > 0 ? pickWeightedVariant(variants) : null
        return {
          broadcastId,
          contactId: c.id,
          phoneE164: c.phoneE164,
          templateId: chosen?.id,
          variantKey: chosen?.variantKey,
          status: WaBroadcastRecipientStatus.PENDING,
        }
      }),
      skipDuplicates: true,
    })
    created += batch.length
  }

  await prisma.whatsappBroadcast.update({
    where: { id: broadcastId },
    data: { totalRecipients: created },
  })

  return { totalRecipients: created, skippedOptedOut: 0 }
}

// Ejecuta el envío — tandas, rate limit, updates
export async function executeBroadcast(broadcastId: string): Promise<{
  sent: number
  failed: number
  skippedOptOut?: number
}> {
  const broadcast = await prisma.whatsappBroadcast.findUniqueOrThrow({
    where: { id: broadcastId },
    include: { account: true },
  })

  if (broadcast.status === WaBroadcastStatus.COMPLETED) {
    return { sent: broadcast.sentCount, failed: broadcast.failedCount }
  }

  await prisma.whatsappBroadcast.update({
    where: { id: broadcastId },
    data: { status: WaBroadcastStatus.RUNNING, startedAt: new Date() },
  })

  let sent = 0
  let failed = 0
  let skippedOptOut = 0
  const BATCH = 50
  let offset = 0

  while (true) {
    const pending = await prisma.whatsappBroadcastRecipient.findMany({
      where: { broadcastId, status: WaBroadcastRecipientStatus.PENDING },
      include: { template: true, contact: { select: { isOptedIn: true } } },
      take: BATCH,
    })
    if (pending.length === 0) break

    for (const r of pending) {
      // V30 — Revalidar opt-in justo antes de enviar (puede haber
      // cambiado entre prepareBroadcast y executeBroadcast)
      if (r.contact && r.contact.isOptedIn === false) {
        await prisma.whatsappBroadcastRecipient.update({
          where: { id: r.id },
          data: {
            status: WaBroadcastRecipientStatus.SKIPPED,
            failureReason: 'contact_opted_out',
          },
        })
        skippedOptOut++
        continue
      }

      try {
        const templateName = r.template?.metaName ?? broadcast.templateName
        const res = await sendTemplate({
          accountId: broadcast.accountId,
          toPhoneE164: r.phoneE164,
          templateName,
          languageCode: broadcast.languageCode,
          headerVariables: broadcast.headerVariables as never,
          bodyVariables: broadcast.bodyVariables as never,
          // No conversationId: es un broadcast, no una conversación activa
        })

        await prisma.whatsappBroadcastRecipient.update({
          where: { id: r.id },
          data: {
            status: WaBroadcastRecipientStatus.SENT,
            metaMessageId: res.metaMessageId,
            sentAt: new Date(),
          },
        })
        sent++
        // Rate limit suave: 200ms entre envíos
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        const reason = (err as Error).message.slice(0, 500)
        await prisma.whatsappBroadcastRecipient.update({
          where: { id: r.id },
          data: {
            status: WaBroadcastRecipientStatus.FAILED,
            failureReason: reason,
          },
        })
        failed++
      }
    }

    // Progreso intermedio (idempotente — set absoluto, no increment)
    await prisma.whatsappBroadcast.update({
      where: { id: broadcastId },
      data: {
        sentCount: sent,
        failedCount: failed,
        optedOutCount: skippedOptOut,
      },
    }).catch(() => {})

    offset += pending.length
    // Guardia — no procesar más de 5k en una sola invocación
    if (offset >= 5000) break
  }

  // Verificar si quedan pendientes
  const stillPending = await prisma.whatsappBroadcastRecipient.count({
    where: { broadcastId, status: WaBroadcastRecipientStatus.PENDING },
  })

  await prisma.whatsappBroadcast.update({
    where: { id: broadcastId },
    data: {
      sentCount: sent,
      failedCount: failed,
      optedOutCount: skippedOptOut,
      ...(stillPending === 0 && {
        status: WaBroadcastStatus.COMPLETED,
        completedAt: new Date(),
      }),
    },
  })

  return { sent, failed, skippedOptOut }
}

// Estadísticas agregadas por variante (para dashboard A/B)
export async function getBroadcastStats(broadcastId: string) {
  const broadcast = await prisma.whatsappBroadcast.findUniqueOrThrow({
    where: { id: broadcastId },
  })

  const byStatus = await prisma.whatsappBroadcastRecipient.groupBy({
    by: ['status'],
    where: { broadcastId },
    _count: { _all: true },
  })

  const byVariant = await prisma.whatsappBroadcastRecipient.groupBy({
    by: ['variantKey', 'status'],
    where: { broadcastId, variantKey: { not: null } },
    _count: { _all: true },
  })

  const statusCounts = byStatus.reduce((acc, r) => {
    acc[r.status] = r._count._all
    return acc
  }, {} as Record<string, number>)

  const variantMap = new Map<string, Record<string, number>>()
  for (const r of byVariant) {
    if (!r.variantKey) continue
    if (!variantMap.has(r.variantKey)) variantMap.set(r.variantKey, {})
    variantMap.get(r.variantKey)![r.status] = r._count._all
  }

  return {
    broadcast,
    statusCounts,
    variants: [...variantMap.entries()].map(([key, counts]) => ({ key, counts })),
  }
}
