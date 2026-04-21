import { NextResponse } from 'next/server'
import { runBotWithTracking } from '@/lib/bots/types'
import { runStockBot } from '@/lib/bots/stock-bot'
import { runRestockBot } from '@/lib/bots/restock-bot'
import { runAdsBot } from '@/lib/bots/ads-bot'
import { runInactivityBot } from '@/lib/bots/inactivity-bot'
import { runOnboardingBot } from '@/lib/bots/onboarding-bot'
import type { BotName } from '@prisma/client'

export const dynamic = 'force-dynamic'

// ── POST/GET /api/cron/bots ──────────────────────────────
// Corre uno o varios bots. Protegido con CRON_SECRET.
// Vercel Cron llama con GET + header Authorization: Bearer <CRON_SECRET>.
// Admin puede disparar manualmente con POST + ?bot=STOCK_BOT.

const BOT_MAP: Record<string, () => Promise<any>> = {
  STOCK_BOT: runStockBot,
  RESTOCK_BOT: runRestockBot,
  ADS_BOT: runAdsBot,
  INACTIVITY_BOT: runInactivityBot,
  ONBOARDING_BOT: runOnboardingBot,
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

async function runBot(name: BotName) {
  const fn = BOT_MAP[name]
  if (!fn) throw new Error(`Bot desconocido: ${name}`)
  return runBotWithTracking(name, fn)
}

async function handle(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const botParam = url.searchParams.get('bot') as BotName | 'ALL' | null
  const target: Array<BotName> = botParam && botParam !== 'ALL'
    ? [botParam as BotName]
    : ['STOCK_BOT', 'ONBOARDING_BOT', 'INACTIVITY_BOT', 'ADS_BOT', 'RESTOCK_BOT']

  const results = []
  for (const bot of target) {
    try {
      const res = await runBot(bot)
      results.push({
        bot,
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
    } catch (err) {
      results.push({
        bot,
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results })
}

export const GET = handle
export const POST = handle
