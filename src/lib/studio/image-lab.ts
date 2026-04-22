// V33 — Image Lab (agente creativo de edición)
// ═══════════════════════════════════════════════════════════
// 9 operaciones sobre ProductAsset tipo imagen:
//   UPSCALE · REMOVE_BG · REPLACE_BG · OVERLAY_TEXT · OVERLAY_BADGE
//   COLOR_ADJUST · GENERATE_VARIANT · AUTO_CROP · WATERMARK
//
// Diseño:
//  - 6 ops son Cloudinary transforms (instantáneas, baratas).
//  - 3 ops (REPLACE_BG, GENERATE_VARIANT, REMOVE_BG premium) usan Replicate
//    SDXL en prod. En MOCK mode (sin REPLICATE_API_TOKEN) devuelven
//    transforms aproximados con Cloudinary para que el UI funcione.
//  - Cada edit queda en AssetEdit con cost + duration.
//  - Prisma singleton + observability integrados.

import { prisma } from '@/lib/db/prisma'
import { captureException } from '@/lib/observability'
import { IMAGE_LAB_COSTS } from './helpers'
import { EditOperation } from '@prisma/client'

export const IMAGE_LAB_MOCK_MODE = !process.env.REPLICATE_API_TOKEN

export type ImageLabOperation = keyof typeof IMAGE_LAB_COSTS

export interface ImageLabParams {
  sourceAssetId: string
  operation: ImageLabOperation
  params?: Record<string, unknown>
  createdBy: string
  persistAsNewAsset?: boolean
}

export interface ImageLabResult {
  resultUrl: string
  resultAssetId?: string
  editId: string
  costUsd: number
  durationMs: number
  mockMode: boolean
}

const CLOUDINARY_BASE = process.env.CLOUDINARY_CLOUD_NAME
  ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
  : 'https://res.cloudinary.com/demo/image/upload'

// ─── Entry point ────────────────────────────────────────
export async function runImageLab(p: ImageLabParams): Promise<ImageLabResult> {
  const startedAt = Date.now()
  const asset = await prisma.productAsset.findUniqueOrThrow({
    where: { id: p.sourceAssetId },
  })

  if (!asset.cloudinaryId) throw new Error('ASSET_NO_CLOUDINARY_ID')
  if (!asset.originalMime?.startsWith('image/')) throw new Error('ASSET_NOT_IMAGE')

  let resultUrl: string
  try {
    resultUrl = await executeOperation(asset.cloudinaryId, p.operation, p.params ?? {})
  } catch (err) {
    captureException(err, {
      route: 'lib/studio/image-lab',
      tags: { operation: p.operation },
      extra: { sourceAssetId: p.sourceAssetId },
    })
    throw err
  }

  const costUsd = IMAGE_LAB_COSTS[p.operation]
  const durationMs = Date.now() - startedAt

  const edit = await prisma.assetEdit.create({
    data: {
      sourceAssetId: p.sourceAssetId,
      operation: p.operation as EditOperation,
      params: (p.params ?? {}) as never,
      resultUrl,
      costUsd,
      durationMs,
      createdBy: p.createdBy,
    },
  })

  let resultAssetId: string | undefined
  if (p.persistAsNewAsset) {
    const newAsset = await prisma.productAsset.create({
      data: {
        productId: asset.productId,
        driveFileId: `edit-${edit.id}`,
        driveFolderPath: `edits/${p.operation.toLowerCase()}`,
        driveFolderType: 'ai_edit',
        type: asset.type,
        angle: asset.angle,
        format: asset.format,
        cloudinaryUrl: resultUrl,
        originalMime: asset.originalMime,
        width: asset.width,
        height: asset.height,
        syncedBy: 'image-lab',
        status: 'DRAFT',
        title: `Edit: ${p.operation}`,
      },
    })
    resultAssetId = newAsset.id
    await prisma.assetEdit.update({
      where: { id: edit.id },
      data: { resultAssetId },
    })
  }

  return { resultUrl, resultAssetId, editId: edit.id, costUsd, durationMs, mockMode: IMAGE_LAB_MOCK_MODE }
}

// ─── Ops dispatcher ─────────────────────────────────────
async function executeOperation(
  publicId: string,
  op: ImageLabOperation,
  params: Record<string, unknown>,
): Promise<string> {
  switch (op) {
    case 'UPSCALE':          return opUpscale(publicId, params)
    case 'REMOVE_BG':        return opRemoveBg(publicId)
    case 'REPLACE_BG':       return opReplaceBg(publicId, params)
    case 'OVERLAY_TEXT':     return opOverlayText(publicId, params)
    case 'OVERLAY_BADGE':    return opOverlayBadge(publicId, params)
    case 'COLOR_ADJUST':     return opColorAdjust(publicId, params)
    case 'GENERATE_VARIANT': return opGenerateVariant(publicId, params)
    case 'AUTO_CROP':        return opAutoCrop(publicId, params)
    case 'WATERMARK':        return opWatermark(publicId)
  }
}

// ─── Cloudinary transforms (6 ops rápidas) ──────────────
function opUpscale(publicId: string, params: Record<string, unknown>): string {
  const scale = (params.scale as number) ?? 2
  return `${CLOUDINARY_BASE}/c_scale,w_${1080 * scale},q_auto,f_auto/${publicId}`
}

function opRemoveBg(publicId: string): string {
  // Cloudinary background_removal (requiere plan Plus; fallback a transparency trick)
  if (IMAGE_LAB_MOCK_MODE) {
    return `${CLOUDINARY_BASE}/e_trim/${publicId}`
  }
  return `${CLOUDINARY_BASE}/e_background_removal/${publicId}`
}

function opOverlayText(publicId: string, params: Record<string, unknown>): string {
  const text = encodeURIComponent(String(params.text ?? 'VITALCOM').slice(0, 80))
  const color = String(params.color ?? 'C6FF3C').replace('#', '')
  const size = Number(params.size ?? 80)
  const gravity = String(params.gravity ?? 'south')
  return `${CLOUDINARY_BASE}/l_text:Arial_${size}_bold:${text},co_rgb:${color},g_${gravity},y_60/${publicId}`
}

function opOverlayBadge(publicId: string, params: Record<string, unknown>): string {
  const text = encodeURIComponent(String(params.text ?? '-20%').slice(0, 20))
  return `${CLOUDINARY_BASE}/l_text:Arial_120_bold:${text},co_white,b_rgb:ff4757,r_max,pd_20,g_north_east,x_40,y_40/${publicId}`
}

function opColorAdjust(publicId: string, params: Record<string, unknown>): string {
  const brightness = Number(params.brightness ?? 0)
  const saturation = Number(params.saturation ?? 20)
  const contrast = Number(params.contrast ?? 0)
  return `${CLOUDINARY_BASE}/e_brightness:${brightness},e_saturation:${saturation},e_contrast:${contrast}/${publicId}`
}

function opAutoCrop(publicId: string, params: Record<string, unknown>): string {
  const ratio = String(params.ratio ?? '1:1')
  const [w, h] = ratio.split(':').map(Number)
  return `${CLOUDINARY_BASE}/c_fill,g_auto,ar_${w}:${h},w_1080/${publicId}`
}

function opWatermark(publicId: string): string {
  return `${CLOUDINARY_BASE}/l_text:Arial_40_bold:VITALCOM,co_rgb:C6FF3C,o_60,g_south_east,x_20,y_20/${publicId}`
}

// ─── SDXL ops (MOCK en ausencia de Replicate) ───────────
async function opReplaceBg(publicId: string, params: Record<string, unknown>): Promise<string> {
  if (IMAGE_LAB_MOCK_MODE) {
    // Simulamos: remove bg + color sólido
    const bgColor = String(params.bgColor ?? 'e8ffb3').replace('#', '')
    return `${CLOUDINARY_BASE}/e_trim,b_rgb:${bgColor}/${publicId}`
  }
  // TODO: real Replicate SDXL img2img when REPLICATE_API_TOKEN is set
  const prompt = String(params.prompt ?? 'clean white background studio photo')
  return await callReplicate('sdxl-img2img', {
    image: `${CLOUDINARY_BASE}/${publicId}`,
    prompt,
    strength: 0.5,
  })
}

async function opGenerateVariant(publicId: string, params: Record<string, unknown>): Promise<string> {
  if (IMAGE_LAB_MOCK_MODE) {
    // Fake variant: aplicar filtro y rotar
    return `${CLOUDINARY_BASE}/e_cartoonify/${publicId}`
  }
  const prompt = String(params.prompt ?? 'product variation, same subject')
  return await callReplicate('sdxl-img2img', {
    image: `${CLOUDINARY_BASE}/${publicId}`,
    prompt,
    strength: 0.7,
  })
}

async function callReplicate(_model: string, _input: Record<string, unknown>): Promise<string> {
  // Stub — cuando se agregue Replicate SDK:
  //   const Replicate = (await import('replicate')).default
  //   const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  //   const output = await replicate.run(...)
  throw new Error('REPLICATE_NOT_CONFIGURED — set REPLICATE_API_TOKEN and install `replicate` SDK')
}
