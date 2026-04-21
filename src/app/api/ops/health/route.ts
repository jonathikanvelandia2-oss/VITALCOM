// V28 — Health endpoint para /admin/ops
// Agrega salud del sistema: feature flags, crons, workflows,
// escalaciones abiertas, bots últimas 24h, router circuits.

import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getRouterHealth } from '@/lib/ai/llm-router'
import { WHATSAPP_MOCK_MODE } from '@/lib/whatsapp/client'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  await requireRole('ADMIN')
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 86400_000)

  const [
    router,
    botRuns,
    workflowsActive,
    workflowsRunningNow,
    escalationsOpen,
    semanticCache,
    userMemoriesWithEmbedding,
    conversationThreadsActive,
    whatsappAccounts,
    webhookEvents24h,
  ] = await Promise.all([
    Promise.resolve(getRouterHealth()),
    prisma.botRun.groupBy({
      by: ['status'],
      where: { startedAt: { gte: dayAgo } },
      _count: { _all: true },
    }),
    prisma.waWorkflow.count({ where: { isActive: true } }),
    prisma.waExecution.count({ where: { status: 'RUNNING' } }),
    prisma.escalationTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.semanticCache.aggregate({
      _count: { _all: true },
      _sum: { hits: true },
      where: { expiresAt: { gt: now } },
    }),
    prisma.userMemory.count({ where: { embedding: { not: { equals: null } } as never } }),
    prisma.conversationThread.count({ where: { lastMessageAt: { gte: dayAgo } } }),
    prisma.whatsappAccount.count({ where: { isActive: true } }),
    prisma.webhookEvent.groupBy({
      by: ['source'],
      where: { processedAt: { gte: dayAgo } },
      _count: { _all: true },
    }),
  ])

  const botSummary = botRuns.reduce((acc, b) => {
    acc[b.status] = b._count._all
    return acc
  }, {} as Record<string, number>)

  return apiSuccess({
    timestamp: now.toISOString(),
    featureFlags: {
      whatsappMockMode: WHATSAPP_MOCK_MODE,
      anthropicEnabled: router.anthropicEnabled,
      embeddingsEnabled: router.embeddingsEnabled,
    },
    router: {
      circuits: router.circuits,
    },
    bots24h: {
      total: Object.values(botSummary).reduce((a, b) => a + b, 0),
      success: botSummary.SUCCESS ?? 0,
      failed: botSummary.FAILED ?? 0,
      partial: botSummary.PARTIAL ?? 0,
      running: botSummary.RUNNING ?? 0,
    },
    workflows: {
      active: workflowsActive,
      runningNow: workflowsRunningNow,
    },
    escalations: {
      open: escalationsOpen,
    },
    cache: {
      entries: semanticCache._count._all,
      totalHits: semanticCache._sum.hits ?? 0,
      userMemoriesWithEmbedding,
    },
    conversations24h: conversationThreadsActive,
    whatsapp: {
      activeAccounts: whatsappAccounts,
      webhookEvents24h: webhookEvents24h.reduce((acc, w) => {
        acc[w.source] = w._count._all
        return acc
      }, {} as Record<string, number>),
    },
  })
})
