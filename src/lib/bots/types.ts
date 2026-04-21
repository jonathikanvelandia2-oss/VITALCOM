import type { BotName, BotRunStatus } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

// ── Infraestructura compartida de bots V23 ──────────────
// Cada bot es una función pura `runBot` que recibe contexto y
// retorna métricas. El runner (cron endpoint) abre BotRun,
// corre el bot, y cierra con status + summary.

export type BotResult = {
  usersProcessed: number
  itemsAffected: number
  notifsCreated: number
  errors: number
  errorLog?: Array<{ userId?: string; message: string }>
  summary: string
}

export type BotRunnerFn = () => Promise<BotResult>

export async function runBotWithTracking(
  bot: BotName,
  runner: BotRunnerFn,
  triggeredBy: string = 'cron',
): Promise<{ runId: string; result: BotResult; status: BotRunStatus }> {
  const run = await prisma.botRun.create({
    data: { bot, status: 'RUNNING', triggeredBy },
  })
  const start = Date.now()

  try {
    const result = await runner()
    const status: BotRunStatus =
      result.errors === 0 ? 'SUCCESS' : result.errors === result.usersProcessed ? 'FAILED' : 'PARTIAL'

    await prisma.botRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        durationMs: Date.now() - start,
        usersProcessed: result.usersProcessed,
        itemsAffected: result.itemsAffected,
        notifsCreated: result.notifsCreated,
        errors: result.errors,
        summary: result.summary,
        errorLog: (result.errorLog as any) ?? undefined,
      },
    })

    return { runId: run.id, result, status }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.botRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        durationMs: Date.now() - start,
        summary: `Fatal: ${message}`,
        errorLog: [{ message }] as any,
        errors: 1,
      },
    })
    throw err
  }
}
