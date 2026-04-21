// V32 — Cron de recálculo masivo de health score
import { NextResponse } from 'next/server'
import { runHealthScoreBatch } from '@/lib/health/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(req: Request): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const start = Date.now()
  const result = await runHealthScoreBatch()
  return NextResponse.json({
    ok: true,
    ms: Date.now() - start,
    ...result,
  })
}

export const POST = GET
