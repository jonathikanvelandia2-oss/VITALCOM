// GET /api/version — diagnóstico público para verificar qué commit está live.
// Sin auth · sin middleware · super simple. Útil para debugging deployments.

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local-dev',
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'unknown',
    deployedAt: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN
      ? new Date().toISOString()
      : 'local-dev',
    version: '2.27.2-oauth-separator-fix',
    routes: {
      presentation: '/presentacion',
      presentationStatic: '/presentacion.html',
      adminPulse: '/admin/comunidad/pulse',
      insights: '/insights',
      status: '/api/status',
    },
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
