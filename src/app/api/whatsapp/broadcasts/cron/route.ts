// V30 — Cron de broadcasts programados
// ═══════════════════════════════════════════════════════════
// Cada ~10min Vercel invoca este endpoint. Busca broadcasts
// SCHEDULED con scheduledFor <= now y los ejecuta.
// Autorización via CRON_SECRET (igual que /api/flows/cron).
//
// También intenta recuperar broadcasts RUNNING que se quedaron
// colgados con recipients PENDING (crash mid-flight).

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  prepareBroadcast,
  executeBroadcast,
} from '@/lib/whatsapp/broadcast-runner'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(req: Request): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return auth === `Bearer ${secret}`
}

async function tick() {
  const now = new Date()

  // 1) Broadcasts programados vencidos → ejecutar
  const due = await prisma.whatsappBroadcast.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: now },
    },
    take: 10, // por tick — mantener la invocación corta
    orderBy: { scheduledFor: 'asc' },
  })

  let started = 0
  let resumed = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const b of due) {
    try {
      if (b.totalRecipients === 0) {
        await prepareBroadcast(b.id)
      }
      // Ejecutar en background pero esperamos metadata inicial
      executeBroadcast(b.id).catch(err => {
        console.error(`[broadcasts/cron] execute ${b.id} failed:`, err)
      })
      started++
    } catch (err) {
      errors.push({ id: b.id, error: (err as Error).message })
    }
  }

  // 2) Broadcasts RUNNING con PENDING recipients → reanudar
  // (detecta procesos que se truncaron por timeout de 60s)
  const running = await prisma.whatsappBroadcast.findMany({
    where: {
      status: 'RUNNING',
      recipients: { some: { status: 'PENDING' } },
    },
    take: 5,
  })

  for (const b of running) {
    try {
      executeBroadcast(b.id).catch(err => {
        console.error(`[broadcasts/cron] resume ${b.id} failed:`, err)
      })
      resumed++
    } catch (err) {
      errors.push({ id: b.id, error: (err as Error).message })
    }
  }

  return { due: due.length, started, resumed, errors, at: now.toISOString() }
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const result = await tick()
  return NextResponse.json({ ok: true, ...result })
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const result = await tick()
  return NextResponse.json({ ok: true, ...result })
}
