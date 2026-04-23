// V36 — Helpers puros para la página de detalle de producto community-facing.
// Agrupan assets Drive por tipo/ángulo, construyen manifiestos de descarga
// para Shopify, calculan stats y seleccionan hero. Todo sin I/O para que sea
// trivialmente testeable.

export type AssetLike = {
  id: string
  type: string
  angle: string | null
  cloudinaryUrl: string | null
  originalMime: string
  title: string | null
  altText: string | null
  caption: string | null
  heroRank: number | null
  status: string
  quality: string
  width: number | null
  height: number | null
  durationSec: number | null
}

export type ProductLike = {
  id: string
  sku: string
  name: string
  slug: string
  description: string | null
  category: string | null
  images: string[]
  precioComunidad: number
  precioPublico: number
  precioPrivado: number
  ingredients: unknown
  benefits: unknown
  howToUse: string | null
  testimonials: unknown
}

export type AssetGroup = {
  label: string
  description: string
  assets: AssetLike[]
}

export type DownloadManifest = {
  sku: string
  slug: string
  productName: string
  generatedAt: string
  description: string
  category: string | null
  sections: Array<{
    name: string
    items: Array<{ url: string; filename: string; type: string }>
  }>
  totals: { images: number; videos: number; docs: number }
}

// ── Grupos de visualización por tipo ──────────────────
// La comunidad piensa en carpetas: "Fotos producto", "Lifestyle",
// "Videos para ads", "Documentos". Agrupamos los tipos de ProductAsset
// (16 tipos) en 4 categorías reconocibles.

const PHOTO_TYPES = ['HERO', 'GALLERY', 'PRODUCT_ONLY', 'PACK_SHOT', 'MOCKUP']
const LIFESTYLE_TYPES = ['LIFESTYLE', 'REVIEW_PHOTO', 'BEFORE_AFTER']
const VIDEO_TYPES = ['UGC_CLIP', 'REEL_MASTER', 'VIDEO_CUT']
const DOC_TYPES = ['EBOOK', 'BRAND_MANUAL', 'CERTIFICATE', 'INGREDIENT_INFO', 'LANDING_HERO']

export function isImageAsset(a: AssetLike): boolean {
  return a.originalMime.startsWith('image/') && Boolean(a.cloudinaryUrl)
}

export function isVideoAsset(a: AssetLike): boolean {
  return a.originalMime.startsWith('video/') && Boolean(a.cloudinaryUrl)
}

export function filterApprovedAssets(assets: AssetLike[]): AssetLike[] {
  return assets.filter((a) => a.status === 'APPROVED' || a.status === 'FEATURED')
}

export function selectHeroImage(assets: AssetLike[], fallbackImages: string[] = []): string | null {
  const images = assets.filter(isImageAsset)
  // Preferencia: FEATURED por heroRank asc, luego APPROVED por heroRank asc
  const featured = images
    .filter((a) => a.status === 'FEATURED')
    .sort((a, b) => (a.heroRank ?? 999) - (b.heroRank ?? 999))
  if (featured[0]?.cloudinaryUrl) return featured[0].cloudinaryUrl

  const approved = images
    .filter((a) => a.status === 'APPROVED')
    .sort((a, b) => (a.heroRank ?? 999) - (b.heroRank ?? 999))
  if (approved[0]?.cloudinaryUrl) return approved[0].cloudinaryUrl

  return fallbackImages[0] ?? null
}

export function groupAssetsByCategory(assets: AssetLike[]): AssetGroup[] {
  const approved = filterApprovedAssets(assets)

  const photos = approved.filter((a) => PHOTO_TYPES.includes(a.type) && isImageAsset(a))
  const lifestyle = approved.filter((a) => LIFESTYLE_TYPES.includes(a.type) && isImageAsset(a))
  const videos = approved.filter((a) => VIDEO_TYPES.includes(a.type) && isVideoAsset(a))
  const docs = approved.filter((a) => DOC_TYPES.includes(a.type))

  return [
    {
      label: 'Fotos del producto',
      description: 'Pack shots, hero, galería lista para tu Shopify y redes',
      assets: photos,
    },
    {
      label: 'Lifestyle y reseñas',
      description: 'Imágenes de uso real, antes/después y reseñas de clientes',
      assets: lifestyle,
    },
    {
      label: 'Videos para ads',
      description: 'Reels, UGC y cortes listos para Meta Ads, TikTok y Shorts',
      assets: videos,
    },
    {
      label: 'Documentos y recursos',
      description: 'E-books, manual de marca, ingredientes, certificados',
      assets: docs,
    },
  ].filter((g) => g.assets.length > 0)
}

export function countAssetsByQuality(assets: AssetLike[]): Record<string, number> {
  const out: Record<string, number> = { A_PREMIUM: 0, B_STANDARD: 0, C_ACCEPTABLE: 0, UNRATED: 0 }
  for (const a of assets) {
    const q = a.quality in out ? a.quality : 'UNRATED'
    out[q]++
  }
  return out
}

export function countAssetsByType(assets: AssetLike[]): { images: number; videos: number; docs: number } {
  let images = 0
  let videos = 0
  let docs = 0
  for (const a of filterApprovedAssets(assets)) {
    if (isImageAsset(a)) images++
    else if (isVideoAsset(a)) videos++
    else if (DOC_TYPES.includes(a.type)) docs++
  }
  return { images, videos, docs }
}

// ── Pricing derivations ──────────────────────────────
// Cálculos puros sin tocar BD. Reutilizables en cualquier vista.

export function calculateMargin(precioPublico: number, precioComunidad: number): {
  ganancia: number
  marginPercent: number
} {
  if (precioPublico <= 0) return { ganancia: 0, marginPercent: 0 }
  const ganancia = precioPublico - precioComunidad
  const marginPercent = Math.round((ganancia / precioPublico) * 100)
  return { ganancia, marginPercent }
}

// ── Download manifest ───────────────────────────────
// Dropshipper solicita "todo el material del producto" para subir a Shopify.
// Devuelve estructura serializable que el frontend puede ofrecer como
// descarga (zip en el futuro; por ahora lista de links).

export function buildDownloadManifest(
  product: ProductLike,
  assets: AssetLike[],
  nowIso: string = new Date().toISOString(),
): DownloadManifest {
  const groups = groupAssetsByCategory(assets)
  const totals = countAssetsByType(assets)

  const sanitize = (s: string): string =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  const sections = groups.map((g) => ({
    name: g.label,
    items: g.assets
      .filter((a) => a.cloudinaryUrl)
      .map((a, idx) => ({
        url: a.cloudinaryUrl!,
        filename: `${sanitize(product.name)}-${sanitize(g.label)}-${idx + 1}.${extensionFor(a.originalMime)}`,
        type: a.type,
      })),
  }))

  return {
    sku: product.sku,
    slug: product.slug,
    productName: product.name,
    generatedAt: nowIso,
    description: product.description ?? '',
    category: product.category,
    sections,
    totals,
  }
}

function extensionFor(mime: string): string {
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('avif')) return 'avif'
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('pdf')) return 'pdf'
  return 'bin'
}

// ── Sales angles estáticos ───────────────────────────
// 8 ángulos psicológicos que el agente IA puede sugerir. Los dejamos como
// constante para que el UI los pinte y el endpoint de "suggest-angles"
// devuelva la misma taxonomía.

export type SalesAngleHint = {
  key: string
  title: string
  hook: string
  whenToUse: string
}

export const SALES_ANGLE_HINTS: readonly SalesAngleHint[] = [
  {
    key: 'BENEFIT',
    title: 'Beneficio directo',
    hook: 'Cómo este producto mejora la vida del cliente en una frase',
    whenToUse: 'Cuando el producto tiene un resultado claro y medible',
  },
  {
    key: 'PAIN_POINT',
    title: 'Dolor del cliente',
    hook: 'Pone en palabras el problema que el cliente vive hoy',
    whenToUse: 'Cuando el cliente aún no asocia el producto con su necesidad',
  },
  {
    key: 'SOCIAL_PROOF',
    title: 'Prueba social',
    hook: 'Testimonios reales, números de comunidad Vitalcom',
    whenToUse: 'Cuando necesitas credibilidad para audiencia fría',
  },
  {
    key: 'URGENCY',
    title: 'Urgencia + escasez',
    hook: 'Stock limitado, oferta por tiempo, acción inmediata',
    whenToUse: 'Retargeting de audiencia caliente, lanzamientos',
  },
  {
    key: 'LIFESTYLE',
    title: 'Lifestyle aspiracional',
    hook: 'Cómo se siente la vida con el producto integrado',
    whenToUse: 'Audiencia que busca transformación personal',
  },
  {
    key: 'TESTIMONIAL',
    title: 'Testimonio en primera persona',
    hook: 'Frase real de alguien que ya obtuvo el resultado',
    whenToUse: 'Contenido UGC, reels de clientes reales',
  },
  {
    key: 'BEFORE_AFTER',
    title: 'Antes / Después',
    hook: 'Contraste visual o narrativo de la transformación',
    whenToUse: 'Cuando el producto genera cambio observable',
  },
  {
    key: 'PROBLEM_SOLUTION',
    title: 'Problema → Solución',
    hook: '2 frases: problema específico + producto como respuesta',
    whenToUse: 'Anuncios cortos, audiencias frías en scroll',
  },
] as const

export function suggestAnglesForProduct(product: ProductLike, limit = 3): SalesAngleHint[] {
  // Heurística determinista: escoge 3 ángulos basados en señales del producto.
  // El cliente puede pedir "regenerar" para traer otros 3 diferentes. Esto
  // hace que el botón sea útil incluso sin LLM activo.
  const scored = SALES_ANGLE_HINTS.map((a) => {
    let score = 0
    const desc = (product.description ?? '').toLowerCase()
    const name = product.name.toLowerCase()

    if (a.key === 'BEFORE_AFTER' && /transform|antes|despu[eé]s|cambio/.test(desc + name)) score += 3
    if (a.key === 'PAIN_POINT' && /dolor|insomnio|ansiedad|cansan|fatiga|estr[eé]s/.test(desc)) score += 3
    if (a.key === 'LIFESTYLE' && /energ[ií]a|vital|d[ií]a|rutina|bienestar/.test(desc + name)) score += 2
    if (a.key === 'SOCIAL_PROOF' && Array.isArray(product.testimonials) && product.testimonials.length > 0) score += 2
    if (a.key === 'BENEFIT') score += 1 // siempre útil como base
    if (a.key === 'PROBLEM_SOLUTION') score += 1
    return { angle: a, score: score + Math.random() * 0.5 }
  })

  return scored
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((s) => s.angle)
}
