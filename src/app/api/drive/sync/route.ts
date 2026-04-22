// V33 — GET/POST /api/drive/sync
// ═══════════════════════════════════════════════════════════
// GET: endpoint cron (autenticado con CRON_SECRET) que dispara sync.
// POST: admin puede forzar manualmente desde /admin/catalogo.

import { NextResponse } from 'next/server'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { runDriveSync, getLatestSyncRun, DRIVE_MOCK_MODE } from '@/lib/drive/sync-bot'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorizedCron(req: Request): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return auth === `Bearer ${secret}`
}

const DEFAULT_ROOT_FOLDER = process.env.DRIVE_ROOT_FOLDER_ID ?? 'mock-root'

export async function GET(req: Request) {
  if (!authorizedCron(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const start = Date.now()
  const result = await runDriveSync(DEFAULT_ROOT_FOLDER)
  return NextResponse.json({
    ok: true,
    ms: Date.now() - start,
    ...result,
    bytesTransferred: undefined, // BigInt no es JSON serializable
  })
}

export const POST = withErrorHandler(async (req: Request) => {
  await requireRole('ADMIN')
  const body = await req.json().catch(() => ({}))
  const rootFolderId = typeof body.rootFolderId === 'string' && body.rootFolderId.length > 0
    ? body.rootFolderId
    : DEFAULT_ROOT_FOLDER
  const result = await runDriveSync(rootFolderId)
  return apiSuccess(result)
})
