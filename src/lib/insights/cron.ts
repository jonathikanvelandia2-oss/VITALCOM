// V34 — Weekly Insight cron batch runner
// ═══════════════════════════════════════════════════════════
// Corre generateWeeklyInsight para todos los VITALCOMMERS activos.
// Definición de "activo":
// - UserHealthSegment in [ACTIVE, AT_RISK, CHURNED] (excluye NEW que no tiene
//   datos suficientes todavía)
// - User.active = true
// - UserRole en COMMUNITY/DROPSHIPPER (no staff interno)
//
// Diseño: paginación + concurrencia limitada para no saturar DB.
// Si un usuario individual falla, no aborta el batch — se loggea y continúa.

import { prisma } from '@/lib/db/prisma'
import { captureException, captureEvent } from '@/lib/observability'
import { generateWeeklyInsight } from './service'
import { UserHealthSegment, UserRole } from '@prisma/client'

// Tamaño de chunk para paginación
const CHUNK_SIZE = 100
// Concurrencia: genera N insights en paralelo por chunk
const CONCURRENCY = 5

export interface BatchResult {
  processed: number
  succeeded: number
  failed: number
  durationMs: number
  errors: Array<{ userId: string; message: string }>
}

export async function runWeeklyInsightBatch(options?: {
  asOf?: Date
  /** Si false, no crea notifications (útil para tests) */
  notify?: boolean
}): Promise<BatchResult> {
  const start = Date.now()
  const asOf = options?.asOf ?? new Date()
  const notify = options?.notify ?? true

  const result: BatchResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    durationMs: 0,
    errors: [],
  }

  try {
    let cursor: string | undefined
    while (true) {
      const batch = await prisma.user.findMany({
        where: {
          active: true,
          role: { in: [UserRole.COMMUNITY, UserRole.DROPSHIPPER] },
          healthScore: {
            segment: {
              in: [UserHealthSegment.ACTIVE, UserHealthSegment.AT_RISK, UserHealthSegment.CHURNED],
            },
          },
        },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: CHUNK_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })

      if (batch.length === 0) break

      // Procesar en paralelo con concurrencia limitada
      for (let i = 0; i < batch.length; i += CONCURRENCY) {
        const slice = batch.slice(i, i + CONCURRENCY)
        const outcomes = await Promise.all(
          slice.map(async u => {
            try {
              const insight = await generateWeeklyInsight({
                userId: u.id,
                asOf,
                source: 'cron',
                notify,
              })
              return { userId: u.id, ok: insight !== null }
            } catch (err) {
              return {
                userId: u.id,
                ok: false,
                error: (err as Error).message?.slice(0, 300),
              }
            }
          }),
        )

        for (const o of outcomes) {
          result.processed++
          if (o.ok) {
            result.succeeded++
          } else {
            result.failed++
            result.errors.push({ userId: o.userId, message: o.error ?? 'unknown' })
          }
        }
      }

      cursor = batch[batch.length - 1]!.id
      if (batch.length < CHUNK_SIZE) break
    }
  } catch (err) {
    captureException(err, { route: 'insights.cron.batch' })
  }

  result.durationMs = Date.now() - start
  captureEvent('insights.cron.completed', {
    extra: {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      durationMs: result.durationMs,
    },
  })

  return result
}
