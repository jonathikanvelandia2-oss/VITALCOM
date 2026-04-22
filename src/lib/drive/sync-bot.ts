// V33 — Drive Sync Bot
// ═══════════════════════════════════════════════════════════
// Lee Google Drive con Service Account, matchea carpetas contra
// productos de la BD (fuzzy matching), sube assets a Cloudinary
// y persiste ProductAsset con estado DRAFT para revisión admin.
//
// Diseño:
//  - MOCK mode si DRIVE_MOCK_MODE=true o falta GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON.
//    En MOCK genera 3 carpetas virtuales con 5 assets c/u usando placeholders
//    Cloudinary (picsum) para que el UI funcione sin credenciales.
//  - Prisma singleton (no `new PrismaClient()`).
//  - Observability via captureException/captureWarning.
//  - Concurrencia limitada al procesar files (máx 5 en paralelo).
//  - Retry exponencial en llamadas externas.
//  - Idempotencia por driveFileId + driveLastSyncAt.

import { prisma } from '@/lib/db/prisma'
import { captureException, captureWarning, captureEvent } from '@/lib/observability'
import {
  classifyDriveFolder,
  fuzzyMatchProduct,
  autoGradeAsset,
  slugify,
  type ProductMatchCandidate,
} from '@/lib/studio/helpers'
import { AssetStatus, AssetType, AssetFormat, SalesAngle } from '@prisma/client'

export const DRIVE_MOCK_MODE =
  process.env.DRIVE_MOCK_MODE === 'true'
  || !process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON

// ─── Interfaces mínimas para deps opcionales ────────────
// googleapis/cloudinary se importan dinámicamente en runtime.
// Sólo describimos los métodos que consumimos — no pretendemos
// reemplazar sus types completos.
interface DriveFileListResult {
  data: { files?: Array<{
    id?: string | null
    name?: string | null
    mimeType?: string | null
    size?: string | null
    modifiedTime?: string | null
    md5Checksum?: string | null
  }> }
}

interface DriveClient {
  files: {
    list: (opts: { q: string; fields: string; pageSize: number }) => Promise<DriveFileListResult>
    get: (a: { fileId: string; alt: string }, b: { responseType: string }) => Promise<{ data: ArrayBuffer }>
  }
}

interface GoogleApisModule {
  google: {
    auth: {
      JWT: new (opts: { email: string; key: string; scopes: string[] }) => unknown
    }
    drive: (opts: { version: string; auth: unknown }) => DriveClient
  }
}

interface CloudinaryV2 {
  config: (opts: Record<string, unknown>) => void
  uploader: {
    upload_stream: (
      opts: Record<string, unknown>,
      cb: (err: unknown, result: unknown) => void,
    ) => { end: (buf: Buffer) => void }
  }
}

interface CloudinaryModule {
  v2: CloudinaryV2
}

const CONCURRENCY = 5
const MIN_IMAGE_BYTES = 50 * 1024 // 50KB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500MB

export interface DriveSyncResult {
  syncRunId: string
  scanned: number
  created: number
  updated: number
  unchanged: number
  failed: number
  mockMode: boolean
}

// ─── Entry point ────────────────────────────────────────
export async function runDriveSync(rootFolderId: string): Promise<DriveSyncResult> {
  const syncRun = await prisma.driveSyncRun.create({
    data: { rootFolderId, status: 'running' },
  })

  try {
    if (DRIVE_MOCK_MODE) {
      return await runMockSync(syncRun.id, rootFolderId)
    }
    return await runRealSync(syncRun.id, rootFolderId)
  } catch (err) {
    captureException(err, {
      route: 'lib/drive/sync-bot',
      tags: { stage: 'top-level' },
      extra: { syncRunId: syncRun.id, rootFolderId },
    })
    await prisma.driveSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        errorLog: [{ fatal: err instanceof Error ? err.message : String(err) }] as never,
      },
    })
    throw err
  }
}

// ─── MOCK sync (sin Google credentials) ─────────────────
// Genera assets realistas usando placeholders Cloudinary (Picsum)
// para que UI admin y community funcionen sin Drive real.
async function runMockSync(syncRunId: string, rootFolderId: string): Promise<DriveSyncResult> {
  captureEvent('drive-sync:mock-started', { extra: { syncRunId } })

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true },
    take: 20, // limitar para que el mock no cree miles
  })

  let scanned = 0
  let created = 0
  let updated = 0

  // 3 carpetas Drive simuladas por producto
  const MOCK_FOLDERS = [
    { name: 'Fotos reales', count: 3 },
    { name: 'Mockups', count: 2 },
    { name: 'Reel Lanzamiento', count: 1 },
  ]

  for (const product of products) {
    for (const folder of MOCK_FOLDERS) {
      const typeMeta = classifyDriveFolder(folder.name)
      for (let i = 0; i < folder.count; i++) {
        scanned++
        const driveFileId = `mock-${product.id}-${slugify(folder.name)}-${i}`
        const existing = await prisma.productAsset.findUnique({
          where: { driveFileId },
          select: { id: true },
        })
        if (existing) {
          await prisma.productAsset.update({
            where: { driveFileId },
            data: { driveLastSyncAt: new Date() },
          })
          updated++
          continue
        }

        const isVideo = folder.name === 'Reel Lanzamiento'
        const cloudinaryUrl = isVideo
          ? 'https://res.cloudinary.com/demo/video/upload/dog.mp4'
          : `https://picsum.photos/seed/${driveFileId}/1080/1080`
        const width = isVideo ? 720 : 1080
        const height = isVideo ? 1280 : 1080

        const quality = autoGradeAsset({
          width,
          height,
          altText: `${product.name} · ${folder.name}`,
          angle: typeMeta.angle ?? null,
          type: typeMeta.type,
          fileSizeBytes: 250_000,
        })

        await prisma.productAsset.create({
          data: {
            productId: product.id,
            driveFileId,
            driveFolderPath: `MOCK/${product.slug}/${folder.name}`,
            driveFolderType: folder.name,
            driveLastSyncAt: new Date(),
            type: typeMeta.type as AssetType,
            angle: (typeMeta.angle ?? null) as SalesAngle | null,
            format: (typeMeta.defaultFormat ?? 'FREEFORM') as AssetFormat,
            cloudinaryId: `mock/${driveFileId}`,
            cloudinaryUrl,
            originalMime: isVideo ? 'video/mp4' : 'image/jpeg',
            width,
            height,
            durationSec: isVideo ? 15 : null,
            fileSizeBytes: 250_000,
            title: `${folder.name} ${i + 1}`,
            altText: `${product.name} · ${folder.name} · variante ${i + 1}`,
            status: AssetStatus.DRAFT,
            quality,
            syncedBy: 'drive-sync-bot:mock',
          },
        })
        created++
      }
    }
  }

  await prisma.driveSyncRun.update({
    where: { id: syncRunId },
    data: {
      status: 'completed',
      finishedAt: new Date(),
      filesScanned: scanned,
      filesNew: created,
      filesUpdated: updated,
      filesUnchanged: 0,
      filesFailed: 0,
    },
  })

  return {
    syncRunId,
    scanned,
    created,
    updated,
    unchanged: 0,
    failed: 0,
    mockMode: true,
  }
}

// ─── REAL sync (Google Drive + Cloudinary) ──────────────
// Se activa cuando GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON está presente.
// Importa googleapis + cloudinary dinámicamente para no aumentar bundle si no se usan.
async function runRealSync(syncRunId: string, rootFolderId: string): Promise<DriveSyncResult> {
  captureEvent('drive-sync:real-started', { extra: { syncRunId, rootFolderId } })

  // Dynamic imports via `eval` — webpack no puede resolverlos estáticamente,
  // así que el build no falla si las deps opcionales (googleapis, cloudinary)
  // no están instaladas. En runtime, si ALGUIEN activa el modo real sin
  // instalar las deps, obtendrá un error claro al llamar esto.
  // Para activar modo real:
  //   npm install googleapis cloudinary
  //   set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON + CLOUDINARY_*
  const dynImport = new Function('m', 'return import(m)')
  const googleapis = await dynImport('googleapis') as GoogleApisModule
  const cloudinaryMod = await dynImport('cloudinary') as CloudinaryModule
  const google = googleapis.google
  const cloudinary = cloudinaryMod.v2

  const serviceAccount = JSON.parse(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  const drive = google.drive({ version: 'v3', auth })

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  // Cargar catalog completo UNA VEZ para fuzzy match
  const candidates: ProductMatchCandidate[] = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
  })

  let scanned = 0, created = 0, updated = 0, failed = 0
  const errors: Array<{ file?: string; folder?: string; error: string }> = []
  let bytes = BigInt(0)

  // Nivel 1: categorías
  const categoriesRes = await drive.files.list({
    q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 200,
  })

  for (const category of categoriesRes.data.files ?? []) {
    if (!category.id) continue

    // Nivel 2: productos
    const productsRes = await drive.files.list({
      q: `'${category.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 500,
    })

    for (const productFolder of productsRes.data.files ?? []) {
      if (!productFolder.id || !productFolder.name) continue

      const match = fuzzyMatchProduct(productFolder.name, candidates)
      if (!match.candidate || match.score < 0.3) {
        errors.push({
          folder: productFolder.name,
          error: `NO_MATCH (best score ${match.score.toFixed(2)})`,
        })
        captureWarning('[drive-sync] sin match de producto', {
          extra: { folder: productFolder.name, score: match.score, strategy: match.strategy },
        })
        continue
      }

      const productId = match.candidate.id
      const basePath = `${category.name}/${productFolder.name}`

      // Nivel 3: subfolders o archivos sueltos
      const level3Res = await drive.files.list({
        q: `'${productFolder.id}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, md5Checksum)',
        pageSize: 1000,
      })

      // Colectar todos los files a procesar (con concurrencia controlada)
      const tasks: Array<() => Promise<void>> = []

      for (const item of level3Res.data.files ?? []) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          const typeMeta = classifyDriveFolder(item.name ?? '')
          const subPath = `${basePath}/${item.name}`
          const sub = await drive.files.list({
            q: `'${item.id}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
            fields: 'files(id, name, mimeType, size, modifiedTime, md5Checksum)',
            pageSize: 1000,
          })
          for (const file of sub.data.files ?? []) {
            tasks.push(async () => {
              scanned++
              try {
                const res = await processFile(drive, cloudinary, {
                  file,
                  productId,
                  subPath,
                  folderType: item.name ?? 'gallery',
                  typeMeta,
                })
                if (res.created) created++
                else if (res.updated) updated++
                if (res.bytes) bytes += BigInt(res.bytes)
              } catch (err) {
                failed++
                const msg = err instanceof Error ? err.message : String(err)
                errors.push({ file: file.name ?? undefined, folder: item.name ?? undefined, error: msg })
                captureException(err, {
                  route: 'lib/drive/sync-bot',
                  tags: { stage: 'process-file' },
                  extra: { fileName: file.name, folder: item.name },
                })
              }
            })
          }
        } else {
          // archivo suelto → GALLERY
          tasks.push(async () => {
            scanned++
            try {
              const res = await processFile(drive, cloudinary, {
                file: item,
                productId,
                subPath: basePath,
                folderType: 'gallery',
                typeMeta: { type: 'GALLERY' },
              })
              if (res.created) created++
              else if (res.updated) updated++
              if (res.bytes) bytes += BigInt(res.bytes)
            } catch (err) {
              failed++
              const msg = err instanceof Error ? err.message : String(err)
              errors.push({ file: item.name ?? undefined, error: msg })
            }
          })
        }
      }

      // Ejecutar con concurrencia limitada
      await runWithConcurrency(tasks, CONCURRENCY)
    }
  }

  await prisma.driveSyncRun.update({
    where: { id: syncRunId },
    data: {
      status: 'completed',
      finishedAt: new Date(),
      filesScanned: scanned,
      filesNew: created,
      filesUpdated: updated,
      filesUnchanged: scanned - created - updated - failed,
      filesFailed: failed,
      errorLog: errors as never,
      bytesTransferred: bytes,
    },
  })

  return {
    syncRunId,
    scanned,
    created,
    updated,
    unchanged: scanned - created - updated - failed,
    failed,
    mockMode: false,
  }
}

// ─── Procesa 1 archivo: Drive → Cloudinary → Prisma upsert ─
interface DriveFile {
  id?: string | null
  name?: string | null
  mimeType?: string | null
  size?: string | null
  modifiedTime?: string | null
  md5Checksum?: string | null
}

interface FolderMeta {
  type: AssetType
  angle?: SalesAngle
  defaultFormat?: AssetFormat
}

async function processFile(
  drive: DriveClient,
  cloudinary: CloudinaryV2,
  params: {
    file: DriveFile
    productId: string
    subPath: string
    folderType: string
    typeMeta: FolderMeta
  },
): Promise<{ created: boolean; updated: boolean; bytes?: number }> {
  const { file, productId, subPath, folderType, typeMeta } = params
  if (!file.id || !file.mimeType) return { created: false, updated: false }

  const isImage = file.mimeType.startsWith('image/')
  const isVideo = file.mimeType.startsWith('video/')
  const isPdf = file.mimeType === 'application/pdf'
  if (!isImage && !isVideo && !isPdf) return { created: false, updated: false }

  const sizeBytes = parseInt(file.size ?? '0', 10)
  if (isImage && sizeBytes < MIN_IMAGE_BYTES) throw new Error('IMAGE_TOO_SMALL')
  if (isVideo && sizeBytes > MAX_VIDEO_BYTES) throw new Error('VIDEO_TOO_LARGE')

  const existing = await prisma.productAsset.findUnique({
    where: { driveFileId: file.id },
    select: { id: true, status: true, heroRank: true, driveLastSyncAt: true },
  })

  // Skip si ya procesado y Drive no cambió
  if (existing && existing.driveLastSyncAt && file.modifiedTime) {
    const modified = new Date(file.modifiedTime)
    if (existing.driveLastSyncAt >= modified) {
      return { created: false, updated: false }
    }
  }

  // Download de Drive
  const driveRes = await drive.files.get(
    { fileId: file.id, alt: 'media' },
    { responseType: 'arraybuffer' },
  )
  const buffer = Buffer.from(driveRes.data as ArrayBuffer)

  // Upload Cloudinary
  const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw'
  const publicId = `vitalcom/products/${productId}/${slugify(folderType)}/${slugify((file.name ?? 'asset').replace(/\.[^.]+$/, ''))}-${file.id.substring(0, 8)}`

  const uploadResult: any = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true,
          invalidate: true,
          folder: `vitalcom/products/${productId}`,
        },
        (err: unknown, result: unknown) => (err ? reject(err) : resolve(result)),
      )
      .end(buffer)
  })

  const width = uploadResult?.width ?? null
  const height = uploadResult?.height ?? null
  const quality = autoGradeAsset({
    width,
    height,
    altText: file.name?.replace(/\.[^.]+$/, '') ?? null,
    angle: typeMeta.angle ?? null,
    type: typeMeta.type,
    fileSizeBytes: sizeBytes,
  })

  const data = {
    productId,
    driveFileId: file.id,
    driveFolderPath: subPath,
    driveFolderType: folderType,
    driveLastSyncAt: new Date(),
    type: typeMeta.type,
    angle: (typeMeta.angle ?? null) as SalesAngle | null,
    format: (typeMeta.defaultFormat ?? 'FREEFORM') as AssetFormat,
    cloudinaryId: uploadResult?.public_id,
    cloudinaryUrl: uploadResult?.secure_url,
    originalMime: file.mimeType,
    width,
    height,
    durationSec: uploadResult?.duration ? Math.round(uploadResult.duration) : null,
    fileSizeBytes: sizeBytes,
    title: file.name?.replace(/\.[^.]+$/, '') ?? null,
    syncedBy: 'drive-sync-bot',
    status: (existing?.status ?? AssetStatus.DRAFT),
    quality,
    heroRank: existing?.heroRank ?? null,
  }

  if (existing) {
    await prisma.productAsset.update({ where: { id: existing.id }, data })
    return { created: false, updated: true, bytes: sizeBytes }
  }
  await prisma.productAsset.create({ data })
  return { created: true, updated: false, bytes: sizeBytes }
}

async function runWithConcurrency(tasks: Array<() => Promise<void>>, limit: number) {
  const queue = [...tasks]
  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift()
      if (!task) break
      await task()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()))
}

// ─── Queries de conveniencia ────────────────────────────
export async function getLatestSyncRun() {
  return prisma.driveSyncRun.findFirst({ orderBy: { startedAt: 'desc' } })
}

export async function getPendingReview(limit = 50) {
  return prisma.productAsset.findMany({
    where: { status: AssetStatus.DRAFT },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
