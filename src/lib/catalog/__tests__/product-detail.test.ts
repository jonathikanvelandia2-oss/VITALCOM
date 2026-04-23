// V36 — Tests helpers página de detalle de producto.
// Validan filtrado, agrupación, manifestos de descarga y sugerencias de
// ángulos. Todo puro, sin Prisma ni LLM.

import { describe, it, expect } from 'vitest'
import {
  filterApprovedAssets,
  selectHeroImage,
  groupAssetsByCategory,
  countAssetsByQuality,
  countAssetsByType,
  calculateMargin,
  buildDownloadManifest,
  suggestAnglesForProduct,
  isImageAsset,
  isVideoAsset,
  SALES_ANGLE_HINTS,
  type AssetLike,
  type ProductLike,
} from '../product-detail'

// ── Factory helpers ──────────────────────────────────
function makeAsset(overrides: Partial<AssetLike> = {}): AssetLike {
  // Usamos spread para que `null` explícito del caller prevalezca sobre el default.
  const base: AssetLike = {
    id: 'a1',
    type: 'GALLERY',
    angle: null,
    cloudinaryUrl: 'https://cdn.example.com/img.jpg',
    originalMime: 'image/jpeg',
    title: null,
    altText: null,
    caption: null,
    heroRank: null,
    status: 'APPROVED',
    quality: 'B_STANDARD',
    width: 1080,
    height: 1080,
    durationSec: null,
  }
  return { ...base, ...overrides }
}

function makeProduct(overrides: Partial<ProductLike> = {}): ProductLike {
  return {
    id: 'p1',
    sku: 'VIT-001',
    name: 'Colágeno Marino Premium',
    slug: 'colageno-marino-premium',
    description: 'Colágeno para mejorar piel y articulaciones',
    category: 'Polvos',
    images: ['https://fallback.com/img1.jpg'],
    precioComunidad: 45000,
    precioPublico: 90000,
    precioPrivado: 60000,
    ingredients: [],
    benefits: [],
    howToUse: null,
    testimonials: [],
    ...overrides,
  }
}

// ── filterApprovedAssets ──────────────────────────────
describe('filterApprovedAssets', () => {
  it('deja pasar APPROVED y FEATURED', () => {
    const assets = [
      makeAsset({ id: 'a', status: 'APPROVED' }),
      makeAsset({ id: 'b', status: 'FEATURED' }),
      makeAsset({ id: 'c', status: 'DRAFT' }),
    ]
    const filtered = filterApprovedAssets(assets)
    expect(filtered.map((a) => a.id)).toEqual(['a', 'b'])
  })

  it('excluye DRAFT, REJECTED, ARCHIVED', () => {
    const assets = [
      makeAsset({ id: 'd', status: 'DRAFT' }),
      makeAsset({ id: 'r', status: 'REJECTED' }),
      makeAsset({ id: 'x', status: 'ARCHIVED' }),
    ]
    expect(filterApprovedAssets(assets)).toEqual([])
  })

  it('array vacío devuelve array vacío', () => {
    expect(filterApprovedAssets([])).toEqual([])
  })
})

// ── isImageAsset / isVideoAsset ──────────────────────
describe('isImageAsset / isVideoAsset', () => {
  it('detecta imagen por mime y URL presentes', () => {
    const asset = makeAsset({ originalMime: 'image/png', cloudinaryUrl: 'https://x/y.png' })
    expect(isImageAsset(asset)).toBe(true)
    expect(isVideoAsset(asset)).toBe(false)
  })

  it('detecta video por mime', () => {
    const asset = makeAsset({ originalMime: 'video/mp4', cloudinaryUrl: 'https://x/v.mp4' })
    expect(isVideoAsset(asset)).toBe(true)
    expect(isImageAsset(asset)).toBe(false)
  })

  it('rechaza imagen sin cloudinaryUrl', () => {
    const asset = makeAsset({ originalMime: 'image/jpeg', cloudinaryUrl: null })
    expect(isImageAsset(asset)).toBe(false)
  })
})

// ── selectHeroImage ──────────────────────────────────
describe('selectHeroImage', () => {
  it('prefiere FEATURED con heroRank menor', () => {
    const assets = [
      makeAsset({ id: 'a', status: 'APPROVED', heroRank: 1, cloudinaryUrl: 'approved-1' }),
      makeAsset({ id: 'f', status: 'FEATURED', heroRank: 5, cloudinaryUrl: 'featured-5' }),
      makeAsset({ id: 'g', status: 'FEATURED', heroRank: 2, cloudinaryUrl: 'featured-2' }),
    ]
    expect(selectHeroImage(assets)).toBe('featured-2')
  })

  it('cae a APPROVED si no hay FEATURED', () => {
    const assets = [
      makeAsset({ id: 'a', status: 'APPROVED', heroRank: 3, cloudinaryUrl: 'approved-3' }),
      makeAsset({ id: 'b', status: 'APPROVED', heroRank: 1, cloudinaryUrl: 'approved-1' }),
    ]
    expect(selectHeroImage(assets)).toBe('approved-1')
  })

  it('usa fallbackImages si no hay assets', () => {
    expect(selectHeroImage([], ['fallback-1.jpg'])).toBe('fallback-1.jpg')
  })

  it('devuelve null si no hay nada', () => {
    expect(selectHeroImage([])).toBeNull()
  })

  it('ignora videos al escoger hero', () => {
    const assets = [
      makeAsset({ id: 'v', status: 'FEATURED', originalMime: 'video/mp4', cloudinaryUrl: 'video.mp4' }),
      makeAsset({ id: 'i', status: 'APPROVED', originalMime: 'image/jpeg', cloudinaryUrl: 'photo.jpg' }),
    ]
    expect(selectHeroImage(assets)).toBe('photo.jpg')
  })
})

// ── groupAssetsByCategory ────────────────────────────
describe('groupAssetsByCategory', () => {
  it('agrupa en las 4 categorías conocidas', () => {
    const assets = [
      makeAsset({ id: '1', type: 'HERO', status: 'APPROVED' }),
      makeAsset({ id: '2', type: 'GALLERY', status: 'APPROVED' }),
      makeAsset({ id: '3', type: 'LIFESTYLE', status: 'APPROVED' }),
      makeAsset({ id: '4', type: 'REEL_MASTER', status: 'APPROVED', originalMime: 'video/mp4', cloudinaryUrl: 'https://x.mp4' }),
      makeAsset({ id: '5', type: 'EBOOK', status: 'APPROVED', originalMime: 'application/pdf' }),
    ]
    const groups = groupAssetsByCategory(assets)
    expect(groups).toHaveLength(4)
    expect(groups[0].label).toBe('Fotos del producto')
    expect(groups[0].assets).toHaveLength(2)
    expect(groups[1].label).toBe('Lifestyle y reseñas')
    expect(groups[2].label).toBe('Videos para ads')
    expect(groups[3].label).toBe('Documentos y recursos')
  })

  it('filtra categorías vacías', () => {
    const assets = [makeAsset({ id: '1', type: 'HERO', status: 'APPROVED' })]
    const groups = groupAssetsByCategory(assets)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Fotos del producto')
  })

  it('excluye DRAFT automáticamente', () => {
    const assets = [
      makeAsset({ id: '1', type: 'HERO', status: 'DRAFT' }),
      makeAsset({ id: '2', type: 'GALLERY', status: 'APPROVED' }),
    ]
    const groups = groupAssetsByCategory(assets)
    expect(groups[0].assets).toHaveLength(1)
    expect(groups[0].assets[0].id).toBe('2')
  })
})

// ── countAssetsByQuality ─────────────────────────────
describe('countAssetsByQuality', () => {
  it('cuenta assets por cada tier de calidad', () => {
    const assets = [
      makeAsset({ id: '1', quality: 'A_PREMIUM' }),
      makeAsset({ id: '2', quality: 'A_PREMIUM' }),
      makeAsset({ id: '3', quality: 'B_STANDARD' }),
      makeAsset({ id: '4', quality: 'UNRATED' }),
    ]
    const counts = countAssetsByQuality(assets)
    expect(counts.A_PREMIUM).toBe(2)
    expect(counts.B_STANDARD).toBe(1)
    expect(counts.UNRATED).toBe(1)
    expect(counts.C_ACCEPTABLE).toBe(0)
  })

  it('mapea calidades desconocidas a UNRATED', () => {
    const assets = [makeAsset({ quality: 'WEIRD_TIER' as AssetLike['quality'] })]
    const counts = countAssetsByQuality(assets)
    expect(counts.UNRATED).toBe(1)
  })
})

// ── countAssetsByType ────────────────────────────────
describe('countAssetsByType', () => {
  it('cuenta imágenes, videos y docs aprobados', () => {
    const assets = [
      makeAsset({ id: '1', type: 'HERO', status: 'APPROVED', originalMime: 'image/jpeg' }),
      makeAsset({ id: '2', type: 'REEL_MASTER', status: 'APPROVED', originalMime: 'video/mp4' }),
      makeAsset({ id: '3', type: 'EBOOK', status: 'APPROVED', originalMime: 'application/pdf', cloudinaryUrl: 'https://x.pdf' }),
      makeAsset({ id: '4', type: 'HERO', status: 'DRAFT' }),
    ]
    const totals = countAssetsByType(assets)
    expect(totals.images).toBe(1)
    expect(totals.videos).toBe(1)
    expect(totals.docs).toBe(1)
  })

  it('devuelve ceros con array vacío', () => {
    expect(countAssetsByType([])).toEqual({ images: 0, videos: 0, docs: 0 })
  })
})

// ── calculateMargin ──────────────────────────────────
describe('calculateMargin', () => {
  it('calcula ganancia y margen correctamente', () => {
    const m = calculateMargin(100000, 60000)
    expect(m.ganancia).toBe(40000)
    expect(m.marginPercent).toBe(40)
  })

  it('redondea margen a entero', () => {
    const m = calculateMargin(90000, 45000)
    expect(m.marginPercent).toBe(50)
  })

  it('precioPublico 0 devuelve ceros', () => {
    expect(calculateMargin(0, 1000)).toEqual({ ganancia: 0, marginPercent: 0 })
  })
})

// ── buildDownloadManifest ────────────────────────────
describe('buildDownloadManifest', () => {
  it('genera manifest con secciones ordenadas', () => {
    const product = makeProduct()
    const assets = [
      makeAsset({ id: '1', type: 'HERO', status: 'APPROVED', cloudinaryUrl: 'https://x/hero.jpg' }),
      makeAsset({
        id: '2',
        type: 'REEL_MASTER',
        status: 'APPROVED',
        originalMime: 'video/mp4',
        cloudinaryUrl: 'https://x/reel.mp4',
      }),
    ]
    const manifest = buildDownloadManifest(product, assets, '2026-04-23T00:00:00.000Z')

    expect(manifest.sku).toBe('VIT-001')
    expect(manifest.slug).toBe('colageno-marino-premium')
    expect(manifest.generatedAt).toBe('2026-04-23T00:00:00.000Z')
    expect(manifest.sections).toHaveLength(2)
    expect(manifest.sections[0].name).toBe('Fotos del producto')
    expect(manifest.sections[0].items[0].filename).toMatch(/colageno-marino-premium.*\.jpg$/)
    expect(manifest.totals.images).toBe(1)
    expect(manifest.totals.videos).toBe(1)
  })

  it('sanitiza acentos en filenames', () => {
    const product = makeProduct({ name: 'Cúrcuma Premium Ñandú' })
    const assets = [makeAsset({ id: '1', type: 'HERO', status: 'APPROVED' })]
    const manifest = buildDownloadManifest(product, assets)
    const filename = manifest.sections[0].items[0].filename
    expect(filename).not.toMatch(/[áéíóúñ]/i)
    expect(filename).toMatch(/curcuma-premium-nandu/)
  })

  it('excluye assets sin cloudinaryUrl', () => {
    const product = makeProduct()
    const assets = [
      makeAsset({ id: '1', type: 'HERO', status: 'APPROVED', cloudinaryUrl: null }),
      makeAsset({ id: '2', type: 'GALLERY', status: 'APPROVED', cloudinaryUrl: 'https://x/g.jpg' }),
    ]
    const manifest = buildDownloadManifest(product, assets)
    expect(manifest.sections[0].items).toHaveLength(1)
    expect(manifest.sections[0].items[0].url).toBe('https://x/g.jpg')
  })

  it('detecta extensiones correctas por mime', () => {
    const product = makeProduct()
    const assets = [
      makeAsset({ id: '1', type: 'HERO', status: 'APPROVED', originalMime: 'image/png', cloudinaryUrl: 'https://x/a.png' }),
      makeAsset({ id: '2', type: 'HERO', status: 'APPROVED', originalMime: 'image/webp', cloudinaryUrl: 'https://x/b.webp' }),
    ]
    const manifest = buildDownloadManifest(product, assets)
    expect(manifest.sections[0].items[0].filename.endsWith('.png')).toBe(true)
    expect(manifest.sections[0].items[1].filename.endsWith('.webp')).toBe(true)
  })

  it('manifest vacío si no hay assets', () => {
    const manifest = buildDownloadManifest(makeProduct(), [])
    expect(manifest.sections).toEqual([])
    expect(manifest.totals).toEqual({ images: 0, videos: 0, docs: 0 })
  })
})

// ── suggestAnglesForProduct ──────────────────────────
describe('suggestAnglesForProduct', () => {
  it('devuelve por defecto 3 ángulos', () => {
    const angles = suggestAnglesForProduct(makeProduct())
    expect(angles).toHaveLength(3)
  })

  it('respeta el limit solicitado', () => {
    const angles = suggestAnglesForProduct(makeProduct(), 5)
    expect(angles).toHaveLength(5)
  })

  it('prioriza BEFORE_AFTER si la descripción habla de transformación', () => {
    const product = makeProduct({
      description: 'Logra una transformación real en tu piel antes y después',
    })
    // Corremos varias veces para mitigar el componente aleatorio de tiebreak
    let hits = 0
    for (let i = 0; i < 20; i++) {
      const angles = suggestAnglesForProduct(product, 3)
      if (angles.some((a) => a.key === 'BEFORE_AFTER')) hits++
    }
    expect(hits).toBeGreaterThan(15)
  })

  it('prioriza PAIN_POINT si la descripción habla de dolor/estrés', () => {
    const product = makeProduct({
      description: 'Alivia el insomnio y reduce el estrés del día a día',
    })
    let hits = 0
    for (let i = 0; i < 20; i++) {
      const angles = suggestAnglesForProduct(product, 3)
      if (angles.some((a) => a.key === 'PAIN_POINT')) hits++
    }
    expect(hits).toBeGreaterThan(15)
  })

  it('cada ángulo devuelto tiene forma válida', () => {
    const angles = suggestAnglesForProduct(makeProduct())
    for (const a of angles) {
      expect(a.key).toBeTruthy()
      expect(a.title).toBeTruthy()
      expect(a.hook).toBeTruthy()
      expect(a.whenToUse).toBeTruthy()
    }
  })
})

// ── SALES_ANGLE_HINTS constante ───────────────────────
describe('SALES_ANGLE_HINTS', () => {
  it('contiene exactamente 8 ángulos', () => {
    expect(SALES_ANGLE_HINTS).toHaveLength(8)
  })

  it('todos los keys son únicos', () => {
    const keys = SALES_ANGLE_HINTS.map((a) => a.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
