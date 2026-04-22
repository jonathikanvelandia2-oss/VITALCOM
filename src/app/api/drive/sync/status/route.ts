// V33 — GET /api/drive/sync/status — último run + estado MOCK mode
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { getLatestSyncRun, DRIVE_MOCK_MODE } from '@/lib/drive/sync-bot'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  await requireRole('ADMIN')
  const latest = await getLatestSyncRun()
  return apiSuccess({
    mockMode: DRIVE_MOCK_MODE,
    latest: latest
      ? {
          id: latest.id,
          status: latest.status,
          startedAt: latest.startedAt.toISOString(),
          finishedAt: latest.finishedAt?.toISOString() ?? null,
          filesScanned: latest.filesScanned,
          filesNew: latest.filesNew,
          filesUpdated: latest.filesUpdated,
          filesFailed: latest.filesFailed,
          errorLog: latest.errorLog,
        }
      : null,
  })
})
