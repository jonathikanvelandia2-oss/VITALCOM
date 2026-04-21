// V27 — Cron wake-ups de workflows
// Procesa WaExecution con nextWakeupAt vencido cada minuto.
// Autorización via CRON_SECRET (Vercel inyecta en header).

import { NextResponse } from 'next/server'
import { processScheduledWakeups } from '@/lib/flows/workflow-engine'

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
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const result = await processScheduledWakeups()
  return NextResponse.json({ ok: true, ...result })
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const result = await processScheduledWakeups()
  return NextResponse.json({ ok: true, ...result })
}
