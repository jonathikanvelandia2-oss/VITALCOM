// GET /api/status — Endpoint agnóstico de sistema para monitoring/ops.
// No requiere auth (responde con lo público-seguro); no expone secretos.
// Úsalo desde UptimeRobot, BetterUptime, o similares.
//
// Retorna:
//   ok:      true si todos los checks críticos pasan
//   checks:  db + envs + buildInfo
//   degraded: lista de subsistemas que fallaron (non-fatal)
//
// Diseño: cada check es timeout-safe (3s) para que la ruta no cuelgue.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

interface CheckResult {
  name: string
  ok: boolean
  latencyMs?: number
  detail?: string
}

const CHECK_TIMEOUT_MS = 3000

async function withTimeout<T>(p: Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${name} timeout ${ms}ms`)), ms),
    ),
  ])
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, CHECK_TIMEOUT_MS, 'db')
    return { name: 'database', ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      name: 'database',
      ok: false,
      latencyMs: Date.now() - start,
      detail: (err as Error).message.slice(0, 120),
    }
  }
}

function checkCriticalEnvs(): CheckResult {
  // Envs requeridas para funcionamiento mínimo. NO devolvemos valores.
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXT_PUBLIC_SUPABASE_URL']
  const missing = required.filter(name => !process.env[name])
  return {
    name: 'envs',
    ok: missing.length === 0,
    detail: missing.length > 0 ? `missing: ${missing.join(', ')}` : undefined,
  }
}

function checkBuildInfo(): CheckResult {
  // VERCEL_GIT_COMMIT_SHA lo inyecta Vercel. Local = 'dev'.
  return {
    name: 'build',
    ok: true,
    detail: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
  }
}

// ── Checks de integraciones externas ──
// Informativos (no bloquean criticalOk). Cada uno dice "configured" si las
// vars mínimas están; "missing" con detalle si falta algo.

function checkIntegration(name: string, required: string[]): CheckResult {
  const missing = required.filter((v) => !process.env[v])
  return {
    name,
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? 'configured'
        : `missing: ${missing.join(', ')}`,
  }
}

export async function GET() {
  const [db, envs, build] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkCriticalEnvs()),
    Promise.resolve(checkBuildInfo()),
  ])

  // Checks informativos de integraciones (no bloquean criticalOk)
  const shopify = checkIntegration('shopify', [
    'SHOPIFY_CLIENT_ID',
    'SHOPIFY_CLIENT_SECRET',
    'VITALCOM_ENCRYPTION_KEY',
  ])
  const openai = checkIntegration('openai', ['OPENAI_API_KEY'])
  const resend = checkIntegration('resend', ['RESEND_API_KEY'])
  const dropi = checkIntegration('dropi', ['DROPI_API_KEY'])

  const integrations = [shopify, openai, resend, dropi]
  const checks = [db, envs, build, ...integrations]
  // "ok global" = db + envs pasan (build + integraciones solo informativo)
  const criticalOk = db.ok && envs.ok
  const degraded = checks.filter(c => !c.ok).map(c => c.name)

  const body = {
    ok: criticalOk,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    env: process.env.NODE_ENV ?? 'unknown',
    commit: build.detail,
    checks,
    degraded,
  }

  // Retornamos 503 si algo crítico falla — para que los checks externos
  // detecten automáticamente el estado degradado.
  return NextResponse.json(body, {
    status: criticalOk ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
