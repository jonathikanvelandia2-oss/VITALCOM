// V33 — Helpers puros del Product Studio
// ═══════════════════════════════════════════════════════════
// Todo lo que no dependa de Prisma/Cloudinary/Drive vive aquí
// para ser testeable sin mocks de BD ni fetch.

import { AssetType, AssetFormat, SalesAngle } from '@prisma/client'

// ─── Slugify ────────────────────────────────────────────
// Quita acentos + normaliza a-z0-9-.
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Drive folder → AssetType classifier ────────────────
interface FolderTypeMeta {
  type: AssetType
  angle?: SalesAngle
  defaultFormat?: AssetFormat
}

const FOLDER_TYPE_MAP: Record<string, FolderTypeMeta> = {
  'reel-lanzamiento':    { type: 'REEL_MASTER',     angle: 'ASPIRATION',     defaultFormat: 'STORY_9x16' },
  'reel':                { type: 'REEL_MASTER',     angle: 'ASPIRATION',     defaultFormat: 'STORY_9x16' },
  'mockups':             { type: 'MOCKUP',                                    defaultFormat: 'SQUARE_1x1' },
  'manual-de-marca':     { type: 'BRAND_MANUAL',                              defaultFormat: 'A4_PORTRAIT' },
  'landing':             { type: 'LANDING_HERO',    angle: 'ASPIRATION',     defaultFormat: 'LANDSCAPE_16x9' },
  'fotos-resena':        { type: 'REVIEW_PHOTO',    angle: 'SOCIAL_PROOF',   defaultFormat: 'SQUARE_1x1' },
  'fotos-resenas':       { type: 'REVIEW_PHOTO',    angle: 'SOCIAL_PROOF',   defaultFormat: 'SQUARE_1x1' },
  'fotos-reales':        { type: 'LIFESTYLE',                                 defaultFormat: 'PORTRAIT_4x5' },
  'fotos-producto':      { type: 'PRODUCT_ONLY',                              defaultFormat: 'SQUARE_1x1' },
  'empaques':            { type: 'PACK_SHOT',                                 defaultFormat: 'SQUARE_1x1' },
  'ebook':               { type: 'EBOOK',                                     defaultFormat: 'A4_PORTRAIT' },
  'ebooks':              { type: 'EBOOK',                                     defaultFormat: 'A4_PORTRAIT' },
  'ingredientes':        { type: 'INGREDIENT_INFO',                           defaultFormat: 'PORTRAIT_4x5' },
  'certificados':        { type: 'CERTIFICATE',                               defaultFormat: 'A4_PORTRAIT' },
  'antes-despues':       { type: 'BEFORE_AFTER',    angle: 'TRANSFORMATION', defaultFormat: 'SQUARE_1x1' },
  'antes-y-despues':     { type: 'BEFORE_AFTER',    angle: 'TRANSFORMATION', defaultFormat: 'SQUARE_1x1' },
  'ugc':                 { type: 'UGC_CLIP',        angle: 'TESTIMONIAL',    defaultFormat: 'STORY_9x16' },
  'testimonios':         { type: 'UGC_CLIP',        angle: 'TESTIMONIAL',    defaultFormat: 'STORY_9x16' },
  'hero':                { type: 'HERO',                                      defaultFormat: 'SQUARE_1x1' },
}

export function classifyDriveFolder(folderName: string): FolderTypeMeta {
  const slug = slugify(folderName)
  return FOLDER_TYPE_MAP[slug] ?? { type: 'GALLERY' }
}

// ─── Fuzzy product matching ─────────────────────────────
// Devuelve el mejor match con score 0..1. Score > 0.6 = alta confianza.
export interface ProductMatchCandidate {
  id: string
  name: string
  slug: string
}

export interface FuzzyMatchResult {
  candidate: ProductMatchCandidate | null
  score: number
  strategy: 'exact-slug' | 'exact-name' | 'contains' | 'overlap' | 'none'
}

export function fuzzyMatchProduct(
  folderName: string,
  candidates: ProductMatchCandidate[],
): FuzzyMatchResult {
  const target = slugify(folderName)
  if (!target) return { candidate: null, score: 0, strategy: 'none' }

  // 1) Exact slug
  const exactSlug = candidates.find(c => c.slug === target)
  if (exactSlug) return { candidate: exactSlug, score: 1, strategy: 'exact-slug' }

  // 2) Exact slugified name
  const exactName = candidates.find(c => slugify(c.name) === target)
  if (exactName) return { candidate: exactName, score: 0.95, strategy: 'exact-name' }

  // 3) Contains (bidirectional)
  const contains = candidates.find(c => {
    const cslug = slugify(c.name)
    return cslug.includes(target) || target.includes(cslug)
  })
  if (contains) {
    const cslug = slugify(contains.name)
    const shorter = Math.min(cslug.length, target.length)
    const longer = Math.max(cslug.length, target.length)
    return {
      candidate: contains,
      score: 0.6 + (shorter / longer) * 0.3,
      strategy: 'contains',
    }
  }

  // 4) Token overlap (para casos "Té Chino" vs "Chino Premium")
  const targetTokens = new Set(target.split('-').filter(t => t.length > 2))
  let best: { candidate: ProductMatchCandidate; overlap: number } | null = null
  for (const c of candidates) {
    const cTokens = new Set(slugify(c.name).split('-').filter(t => t.length > 2))
    let overlap = 0
    for (const t of targetTokens) if (cTokens.has(t)) overlap++
    if (overlap > 0 && (!best || overlap > best.overlap)) {
      best = { candidate: c, overlap }
    }
  }
  if (best) {
    const score = Math.min(0.7, best.overlap / Math.max(targetTokens.size, 1))
    if (score >= 0.3) return { candidate: best.candidate, score, strategy: 'overlap' }
  }

  return { candidate: null, score: 0, strategy: 'none' }
}

// ─── Cost tables ────────────────────────────────────────
export const IMAGE_LAB_COSTS = {
  UPSCALE:          0.005,
  REMOVE_BG:        0.008,
  REPLACE_BG:       0.030,
  OVERLAY_TEXT:     0.001,
  OVERLAY_BADGE:    0.001,
  COLOR_ADJUST:     0.001,
  GENERATE_VARIANT: 0.040,
  AUTO_CROP:        0.002,
  WATERMARK:        0.001,
} as const

export const VIDEO_COST_PER_SECOND = {
  FFMPEG_EDIT:  0.0005,
  PIKA_LABS:    0.024,
  RUNWAY_GEN3:  0.100,
  VEO_GOOGLE:   0.100,
  SORA_OPENAI:  0.150,
} as const

// ─── Budget guard (pure) ────────────────────────────────
export interface BudgetState {
  dailyLimitUsd: number
  monthlyLimitUsd: number
  usedTodayUsd: number
  usedMonthUsd: number
  resetDaily: Date
  resetMonthly: Date
}

export interface BudgetCheck {
  allowed: boolean
  reason: string | null
  remainingTodayUsd: number
  remainingMonthUsd: number
  appliedResets: { daily: boolean; monthly: boolean }
}

// Dado un estado + costo estimado, decide si se permite y reporta
// qué resets habría que aplicar si ya pasaron las fechas.
export function evaluateBudget(
  state: BudgetState,
  estimatedCostUsd: number,
  now: Date = new Date(),
): BudgetCheck {
  const dailyReset = state.resetDaily < now
  const monthlyReset = state.resetMonthly < now

  const usedToday = dailyReset ? 0 : state.usedTodayUsd
  const usedMonth = monthlyReset ? 0 : state.usedMonthUsd

  const remainingTodayUsd = state.dailyLimitUsd - usedToday
  const remainingMonthUsd = state.monthlyLimitUsd - usedMonth

  if (estimatedCostUsd < 0) {
    return {
      allowed: false,
      reason: 'NEGATIVE_COST',
      remainingTodayUsd,
      remainingMonthUsd,
      appliedResets: { daily: dailyReset, monthly: monthlyReset },
    }
  }

  if (estimatedCostUsd > remainingTodayUsd) {
    return {
      allowed: false,
      reason: `DAILY_LIMIT_EXCEEDED: $${estimatedCostUsd.toFixed(2)} > $${remainingTodayUsd.toFixed(2)}`,
      remainingTodayUsd,
      remainingMonthUsd,
      appliedResets: { daily: dailyReset, monthly: monthlyReset },
    }
  }

  if (estimatedCostUsd > remainingMonthUsd) {
    return {
      allowed: false,
      reason: `MONTHLY_LIMIT_EXCEEDED: $${estimatedCostUsd.toFixed(2)} > $${remainingMonthUsd.toFixed(2)}`,
      remainingTodayUsd,
      remainingMonthUsd,
      appliedResets: { daily: dailyReset, monthly: monthlyReset },
    }
  }

  return {
    allowed: true,
    reason: null,
    remainingTodayUsd,
    remainingMonthUsd,
    appliedResets: { daily: dailyReset, monthly: monthlyReset },
  }
}

// ─── Asset quality grading ──────────────────────────────
// A_PREMIUM si tiene buena resolución + altText + angle asignado.
// Sirve para auto-grading inicial antes de revisión admin.
export function autoGradeAsset(asset: {
  width?: number | null
  height?: number | null
  altText?: string | null
  angle?: SalesAngle | null
  type: AssetType
  fileSizeBytes?: number | null
}): 'A_PREMIUM' | 'B_STANDARD' | 'C_ACCEPTABLE' | 'UNRATED' {
  // PDFs se rankean solo por tamaño — no tienen width/height relevantes.
  if (asset.type === 'EBOOK' || asset.type === 'BRAND_MANUAL' || asset.type === 'CERTIFICATE') {
    if (!asset.fileSizeBytes) return 'UNRATED'
    return asset.fileSizeBytes > 100_000 ? 'B_STANDARD' : 'C_ACCEPTABLE'
  }

  if (!asset.width || !asset.height) return 'UNRATED'
  const minSide = Math.min(asset.width, asset.height)
  const hasMeta = Boolean(asset.altText && asset.angle)

  if (minSide >= 1080 && hasMeta) return 'A_PREMIUM'
  if (minSide >= 800) return 'B_STANDARD'
  if (minSide >= 500) return 'C_ACCEPTABLE'
  return 'UNRATED'
}
