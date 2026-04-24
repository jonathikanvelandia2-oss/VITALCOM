// V37 — Servicio de fulfillment con audit trail.
// Centraliza la escritura de cambios de estado + log en transacciones
// atómicas para garantizar consistencia. Cada acción deja huella.

import { prisma } from '@/lib/db/prisma'
import type { FulfillmentAction, OrderStatus, Prisma } from '@prisma/client'
import { canTransitionTo, normalizeTrackingCode, type OrderStatusLite } from './helpers'

export type LogEntryInput = {
  orderId: string
  actorId: string
  action: FulfillmentAction
  fromStatus?: OrderStatus | null
  toStatus?: OrderStatus | null
  message?: string | null
  metadata?: Record<string, unknown>
}

export async function writeFulfillmentLog(
  tx: Prisma.TransactionClient | typeof prisma,
  entry: LogEntryInput,
) {
  return tx.fulfillmentLog.create({
    data: {
      orderId: entry.orderId,
      actorId: entry.actorId,
      action: entry.action,
      fromStatus: entry.fromStatus ?? undefined,
      toStatus: entry.toStatus ?? undefined,
      message: entry.message ?? undefined,
      metadata: entry.metadata ? (entry.metadata as Prisma.InputJsonValue) : undefined,
    },
  })
}

export type ManualFulfillInput = {
  orderId: string
  actorId: string
  carrierKey: string // key del catálogo de CARRIERS
  trackingCode: string
  manualCost?: number
  labelUrl?: string
  note?: string
}

export async function fulfillManually(input: ManualFulfillInput) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } })
  if (!order) throw new Error('NOT_FOUND')

  const from = order.status as OrderStatusLite
  const to: OrderStatusLite = 'DISPATCHED'

  if (!canTransitionTo(from, to)) {
    throw new Error(`INVALID_TRANSITION:${from}->${to}`)
  }

  const normalizedCode = normalizeTrackingCode(input.trackingCode)
  if (!normalizedCode) throw new Error('INVALID_TRACKING_CODE')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: input.orderId },
      data: {
        status: 'DISPATCHED',
        trackingCode: normalizedCode,
        carrier: input.carrierKey,
        fulfillmentMode: 'MANUAL',
        fulfilledById: input.actorId,
        fulfilledAt: new Date(),
        manualCost: input.manualCost ?? null,
        labelUrl: input.labelUrl ?? null,
        notes: input.note
          ? [order.notes, `[Manual] ${input.note}`].filter(Boolean).join('\n')
          : order.notes,
      },
    })

    await writeFulfillmentLog(tx, {
      orderId: input.orderId,
      actorId: input.actorId,
      action: 'MANUAL_DISPATCHED',
      fromStatus: from as OrderStatus,
      toStatus: 'DISPATCHED',
      message: input.note ?? null,
      metadata: {
        carrier: input.carrierKey,
        trackingCode: normalizedCode,
        manualCost: input.manualCost ?? null,
        labelUrl: input.labelUrl ?? null,
      },
    })

    return updated
  })
}

export type StatusChangeInput = {
  orderId: string
  actorId: string
  toStatus: OrderStatusLite
  message?: string
}

export async function changeStatus(input: StatusChangeInput) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } })
  if (!order) throw new Error('NOT_FOUND')

  const from = order.status as OrderStatusLite
  if (!canTransitionTo(from, input.toStatus)) {
    throw new Error(`INVALID_TRANSITION:${from}->${input.toStatus}`)
  }

  const actionByStatus: Record<OrderStatusLite, FulfillmentAction> = {
    PENDING: 'STATUS_CHANGED',
    CONFIRMED: 'STATUS_CHANGED',
    PROCESSING: 'STATUS_CHANGED',
    DISPATCHED: 'STATUS_CHANGED',
    DELIVERED: 'DELIVERED_CONFIRMED',
    CANCELLED: 'CANCELLED',
    RETURNED: 'RETURNED',
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: input.orderId },
      data: { status: input.toStatus as OrderStatus },
    })

    await writeFulfillmentLog(tx, {
      orderId: input.orderId,
      actorId: input.actorId,
      action: actionByStatus[input.toStatus],
      fromStatus: from as OrderStatus,
      toStatus: input.toStatus as OrderStatus,
      message: input.message ?? null,
    })

    return updated
  })
}

export async function listLogs(orderId: string, limit = 50) {
  return prisma.fulfillmentLog.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: { select: { id: true, name: true, email: true, area: true, role: true } },
    },
  })
}
