// V34 — Cron dominical 9am UTC (= 4am Colombia) para generar Weekly Insights
// Registrado en vercel.json. Auth por CRON_SECRET.
//
// Diseño:
// - Vercel dispara GET (no POST) con Authorization: Bearer $CRON_SECRET
// - Batch iterativo de users ACTIVE/AT_RISK/CHURNED
// - Crea Notification por cada insight generado (notify=true)
// - Nunca falla el cron entero si un user individual falla

import { NextResponse } from 'next/server'
import { runWeeklyInsightBatch } from '@/lib/insights/cron'

export const dynamic = 'force-dynamic'
// Vercel Hobby: max 60s. Si crecemos a miles de users, migrar a fan-out
// con Vercel Queues o batches múltiples por hora.
export const maxDuration = 60

function authorized(req: Request): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  // Dev: si no hay secret seteado, permitimos localhost; en prod exigimos.
  if (!secret) return process.env.NODE_ENV !== 'production'
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const result = await runWeeklyInsightBatch({ notify: true })

  return NextResponse.json({
    ok: true,
    ...result,
    // Truncamos errors en la respuesta del cron — ya se loggearon a observability
    errors: result.errors.slice(0, 10),
  })
}

export const POST = GET
