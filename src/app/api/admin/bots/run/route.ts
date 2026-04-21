import { z } from 'zod'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { requireSession } from '@/lib/auth/session'
import { runBotWithTracking } from '@/lib/bots/types'
import { runStockBot } from '@/lib/bots/stock-bot'
import { runRestockBot } from '@/lib/bots/restock-bot'
import { runAdsBot } from '@/lib/bots/ads-bot'
import { runInactivityBot } from '@/lib/bots/inactivity-bot'
import { runOnboardingBot } from '@/lib/bots/onboarding-bot'
import type { BotName } from '@prisma/client'

export const dynamic = 'force-dynamic'

// ── POST /api/admin/bots/run ────────────────────────────
// Permite al admin disparar un bot manualmente para testing.
// Respeta los dedup/guards del bot. Body: {bot: BotName}

const BOT_MAP: Record<string, () => Promise<any>> = {
  STOCK_BOT: runStockBot,
  RESTOCK_BOT: runRestockBot,
  ADS_BOT: runAdsBot,
  INACTIVITY_BOT: runInactivityBot,
  ONBOARDING_BOT: runOnboardingBot,
}

const schema = z.object({
  bot: z.enum([
    'STOCK_BOT',
    'RESTOCK_BOT',
    'ADS_BOT',
    'INACTIVITY_BOT',
    'ONBOARDING_BOT',
  ]),
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireSession()
  if (!['SUPERADMIN', 'ADMIN'].includes(session.role)) {
    return apiError('Solo admin puede disparar bots', 403, 'FORBIDDEN')
  }

  const { bot } = schema.parse(await req.json())
  const fn = BOT_MAP[bot]
  if (!fn) return apiError('Bot desconocido', 400, 'INVALID_BOT')

  const res = await runBotWithTracking(bot as BotName, fn, session.id)
  return apiSuccess({
    runId: res.runId,
    status: res.status,
    summary: res.result.summary,
    metrics: {
      usersProcessed: res.result.usersProcessed,
      itemsAffected: res.result.itemsAffected,
      notifsCreated: res.result.notifsCreated,
      errors: res.result.errors,
    },
  })
})
