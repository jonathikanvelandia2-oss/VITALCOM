// ── Catálogo maestro Vitalcom — Fuente única de verdad ──
// CENTRALIZADO: admin y comunidad leen de aquí.
// Cuando se conecte la BD, este archivo se reemplaza con Prisma queries.
// Precios en COP (Colombia). Otros países usan convertCurrency().

export type ProductCategory =
  | 'Suplementos'
  | 'Superalimentos'
  | 'Adaptógenos'
  | 'Cuidado Personal'
  | 'Kits y Packs'
  | 'Bebidas Funcionales'
  | 'Aceites y Extractos'

export type Product = {
  sku: string
  name: string
  category: ProductCategory
  description: string
  /** Precio base Vitalcom (costo dropshipper) — COP */
  basePrice: number
  /** Precio sugerido al consumidor final — COP */
  suggestedPrice: number
  /** Peso en gramos (para cálculo de envío) */
  weightG: number
  /** Stock disponible en Colombia */
  stockCO: number
  /** Activo para venta */
  active: boolean
  /** Producto más vendido */
  bestseller: boolean
  /** Rating promedio (1-5) */
  rating: number
  /** Unidades vendidas históricas */
  sold: number
  /** Tags para búsqueda */
  tags: string[]
  /** URL de imagen (placeholder por ahora) */
  image?: string
}

// ═══════════════════════════════════════════════════════════
// CATÁLOGO COMPLETO — 30 productos organizados por categoría
// ═══════════════════════════════════════════════════════════

export const CATALOG: Product[] = [
  // ── SUPLEMENTOS ─────────────────────────────────────────
  {
    sku: 'VC-COLAGENO-30', name: 'Colágeno Hidrolizado Premium 30 sobres',
    category: 'Suplementos', description: 'Colágeno tipo I y III de origen bovino. Mejora piel, cabello, uñas y articulaciones. Sabor neutro, fácil de mezclar.',
    basePrice: 45_000, suggestedPrice: 89_000, weightG: 300, stockCO: 248, active: true, bestseller: true, rating: 4.9, sold: 3_240,
    tags: ['colágeno', 'piel', 'articulaciones', 'belleza', 'anti-edad'],
  },
  {
    sku: 'VC-OMEGA-60', name: 'Omega 3 + Vitamina D · 60 cápsulas',
    category: 'Suplementos', description: 'EPA/DHA de alta concentración + Vitamina D3. Apoya salud cardiovascular, cerebral y ósea.',
    basePrice: 38_000, suggestedPrice: 75_000, weightG: 120, stockCO: 186, active: true, bestseller: false, rating: 4.8, sold: 1_890,
    tags: ['omega', 'vitamina d', 'corazón', 'cerebro', 'huesos'],
  },
  {
    sku: 'VC-MAGNESIO-90', name: 'Magnesio Bisglicinato 90 cápsulas',
    category: 'Suplementos', description: 'Forma de magnesio de alta biodisponibilidad. Reduce estrés, mejora sueño y función muscular.',
    basePrice: 35_000, suggestedPrice: 72_000, weightG: 130, stockCO: 312, active: true, bestseller: false, rating: 4.7, sold: 1_560,
    tags: ['magnesio', 'sueño', 'estrés', 'músculos', 'relajación'],
  },
  {
    sku: 'VC-ZINC-60', name: 'Zinc Picolinato 60 cápsulas',
    category: 'Suplementos', description: 'Zinc de alta absorción. Fortalece sistema inmune, piel y función hormonal.',
    basePrice: 28_000, suggestedPrice: 58_000, weightG: 80, stockCO: 420, active: true, bestseller: false, rating: 4.6, sold: 980,
    tags: ['zinc', 'inmunidad', 'hormonas', 'piel'],
  },
  {
    sku: 'VC-PROBIO-30', name: 'Probióticos 10 cepas · 30 cápsulas',
    category: 'Suplementos', description: '40 billones CFU. 10 cepas probióticas para salud digestiva e inmunidad. Cápsulas con protección gástrica.',
    basePrice: 42_000, suggestedPrice: 85_000, weightG: 60, stockCO: 156, active: true, bestseller: true, rating: 4.8, sold: 2_100,
    tags: ['probióticos', 'digestión', 'flora intestinal', 'inmunidad'],
  },
  {
    sku: 'VC-BIOTINA-90', name: 'Biotina 10.000 mcg · 90 cápsulas',
    category: 'Suplementos', description: 'Vitamina B7 de alta potencia para cabello, piel y uñas fuertes.',
    basePrice: 30_000, suggestedPrice: 65_000, weightG: 70, stockCO: 280, active: true, bestseller: false, rating: 4.7, sold: 1_340,
    tags: ['biotina', 'cabello', 'uñas', 'piel', 'belleza'],
  },

  // ── SUPERALIMENTOS ──────────────────────────────────────
  {
    sku: 'VC-MACA-200', name: 'Maca Andina Gelatinizada 200g',
    category: 'Superalimentos', description: 'Maca negra y roja gelatinizada. Aumenta energía, resistencia y equilibrio hormonal.',
    basePrice: 32_000, suggestedPrice: 68_000, weightG: 220, stockCO: 198, active: true, bestseller: true, rating: 4.7, sold: 1_760,
    tags: ['maca', 'energía', 'hormonas', 'resistencia', 'libido'],
  },
  {
    sku: 'VC-MORINGA-500', name: 'Moringa Premium en Polvo 500g',
    category: 'Superalimentos', description: 'Hoja de moringa deshidratada. Rica en proteínas, hierro y vitaminas A, C y E.',
    basePrice: 28_000, suggestedPrice: 60_000, weightG: 520, stockCO: 145, active: true, bestseller: false, rating: 4.6, sold: 940,
    tags: ['moringa', 'proteína vegetal', 'hierro', 'vitaminas'],
  },
  {
    sku: 'VC-SPIRU-150', name: 'Espirulina Premium 150g',
    category: 'Superalimentos', description: 'Microalga con 60% proteína completa. Desintoxicante natural, rica en clorofila y hierro.',
    basePrice: 35_000, suggestedPrice: 70_000, weightG: 170, stockCO: 220, active: true, bestseller: false, rating: 4.7, sold: 1_120,
    tags: ['espirulina', 'proteína', 'detox', 'hierro', 'clorofila'],
  },
  {
    sku: 'VC-CHLOR-100', name: 'Chlorella Orgánica 100g',
    category: 'Superalimentos', description: 'Alga verde de agua dulce. Potente desintoxicante de metales pesados. Rica en clorofila.',
    basePrice: 38_000, suggestedPrice: 78_000, weightG: 120, stockCO: 98, active: true, bestseller: false, rating: 4.5, sold: 680,
    tags: ['chlorella', 'detox', 'metales pesados', 'clorofila'],
  },
  {
    sku: 'VC-ACAI-200', name: 'Açaí Liofilizado 200g',
    category: 'Superalimentos', description: 'Polvo de açaí 100% puro. Potente antioxidante, rico en antocianinas y ácidos grasos.',
    basePrice: 48_000, suggestedPrice: 95_000, weightG: 220, stockCO: 76, active: true, bestseller: false, rating: 4.8, sold: 890,
    tags: ['açaí', 'antioxidante', 'energía', 'antocianinas'],
  },

  // ── ADAPTÓGENOS ─────────────────────────────────────────
  {
    sku: 'VC-ASHWA-90', name: 'Ashwagandha KSM-66 · 90 cápsulas',
    category: 'Adaptógenos', description: 'Extracto patentado KSM-66. Reduce cortisol, mejora sueño, energía y rendimiento.',
    basePrice: 52_000, suggestedPrice: 99_000, weightG: 120, stockCO: 167, active: true, bestseller: true, rating: 4.9, sold: 2_890,
    tags: ['ashwagandha', 'estrés', 'cortisol', 'sueño', 'ansiedad'],
  },
  {
    sku: 'VC-RHODIO-60', name: 'Rhodiola Rosea 500mg · 60 cápsulas',
    category: 'Adaptógenos', description: 'Adaptógeno nórdico. Mejora energía mental, concentración y resistencia al estrés.',
    basePrice: 45_000, suggestedPrice: 88_000, weightG: 90, stockCO: 134, active: true, bestseller: false, rating: 4.6, sold: 780,
    tags: ['rhodiola', 'concentración', 'energía mental', 'estrés'],
  },
  {
    sku: 'VC-REISHI-60', name: 'Reishi Orgánico · 60 cápsulas',
    category: 'Adaptógenos', description: 'Hongo medicinal para inmunidad, sueño profundo y equilibrio del sistema nervioso.',
    basePrice: 40_000, suggestedPrice: 82_000, weightG: 100, stockCO: 112, active: true, bestseller: false, rating: 4.7, sold: 920,
    tags: ['reishi', 'inmunidad', 'sueño', 'hongos medicinales'],
  },
  {
    sku: 'VC-LIONS-60', name: 'Lion\'s Mane 500mg · 60 cápsulas',
    category: 'Adaptógenos', description: 'Hongo melena de león. Apoya memoria, concentración y salud neuronal.',
    basePrice: 48_000, suggestedPrice: 92_000, weightG: 95, stockCO: 89, active: true, bestseller: true, rating: 4.8, sold: 1_450,
    tags: ['lions mane', 'memoria', 'concentración', 'cerebro', 'neuronas'],
  },

  // ── CUIDADO PERSONAL ────────────────────────────────────
  {
    sku: 'VC-SKIN-SET', name: 'Pack Skincare Natural · 3 productos',
    category: 'Cuidado Personal', description: 'Limpiador facial + sérum vitamina C + crema hidratante. Ingredientes 100% naturales.',
    basePrice: 65_000, suggestedPrice: 140_000, weightG: 350, stockCO: 78, active: true, bestseller: true, rating: 4.9, sold: 1_680,
    tags: ['skincare', 'vitamina c', 'piel', 'hidratante', 'natural'],
  },
  {
    sku: 'VC-ACEITE-ROSA', name: 'Aceite de Rosa Mosqueta 30ml',
    category: 'Cuidado Personal', description: 'Aceite prensado en frío. Regenera cicatrices, manchas y líneas de expresión.',
    basePrice: 25_000, suggestedPrice: 55_000, weightG: 50, stockCO: 340, active: true, bestseller: false, rating: 4.8, sold: 2_100,
    tags: ['rosa mosqueta', 'cicatrices', 'manchas', 'anti-edad'],
  },
  {
    sku: 'VC-ALOE-GEL', name: 'Gel de Aloe Vera 99% Puro · 250ml',
    category: 'Cuidado Personal', description: 'Aloe vera orgánico sin parabenos. Hidrata, calma y repara la piel.',
    basePrice: 18_000, suggestedPrice: 42_000, weightG: 270, stockCO: 450, active: true, bestseller: false, rating: 4.6, sold: 1_340,
    tags: ['aloe vera', 'hidratante', 'piel', 'orgánico'],
  },
  {
    sku: 'VC-CARBON-ACTIVO', name: 'Carbón Activado Blanqueador Dental',
    category: 'Cuidado Personal', description: 'Polvo de carbón activado de coco. Blanquea dientes naturalmente sin dañar el esmalte.',
    basePrice: 22_000, suggestedPrice: 48_000, weightG: 60, stockCO: 290, active: true, bestseller: false, rating: 4.5, sold: 760,
    tags: ['carbón activado', 'dental', 'blanqueamiento', 'natural'],
  },

  // ── KITS Y PACKS ────────────────────────────────────────
  {
    sku: 'VC-KIT-DETOX', name: 'Kit Detox 30 Días Completo',
    category: 'Kits y Packs', description: 'Espirulina + Chlorella + Té verde + Guía detox digital. Programa de desintoxicación de 30 días.',
    basePrice: 85_000, suggestedPrice: 180_000, weightG: 500, stockCO: 56, active: true, bestseller: true, rating: 4.9, sold: 2_860,
    tags: ['detox', 'desintoxicación', 'kit', 'programa 30 días'],
  },
  {
    sku: 'VC-KIT-INMUNE', name: 'Kit Inmunidad Total',
    category: 'Kits y Packs', description: 'Vitamina C + Zinc + Probióticos + Reishi. Todo lo que necesitas para blindar tu sistema inmune.',
    basePrice: 95_000, suggestedPrice: 195_000, weightG: 400, stockCO: 42, active: true, bestseller: false, rating: 4.8, sold: 1_200,
    tags: ['inmunidad', 'kit', 'vitamina c', 'zinc', 'probióticos'],
  },
  {
    sku: 'VC-KIT-ENERGIA', name: 'Kit Energía y Rendimiento',
    category: 'Kits y Packs', description: 'Maca + Ashwagandha + Rhodiola. Combo adaptógeno para máxima energía sin cafeína.',
    basePrice: 110_000, suggestedPrice: 220_000, weightG: 450, stockCO: 38, active: true, bestseller: true, rating: 4.9, sold: 1_560,
    tags: ['energía', 'rendimiento', 'adaptógenos', 'sin cafeína'],
  },
  {
    sku: 'VC-KIT-BELLEZA', name: 'Kit Belleza Integral',
    category: 'Kits y Packs', description: 'Colágeno + Biotina + Pack Skincare. El combo definitivo para piel, cabello y uñas.',
    basePrice: 120_000, suggestedPrice: 250_000, weightG: 600, stockCO: 34, active: true, bestseller: false, rating: 4.8, sold: 980,
    tags: ['belleza', 'colágeno', 'biotina', 'skincare', 'cabello'],
  },

  // ── BEBIDAS FUNCIONALES ─────────────────────────────────
  {
    sku: 'VC-MATCHA-100', name: 'Matcha Ceremonial Orgánico 100g',
    category: 'Bebidas Funcionales', description: 'Matcha grado ceremonial de Japón. Antioxidante, energía sostenida sin crash de cafeína.',
    basePrice: 55_000, suggestedPrice: 110_000, weightG: 120, stockCO: 92, active: true, bestseller: false, rating: 4.8, sold: 1_340,
    tags: ['matcha', 'antioxidante', 'energía', 'japonés', 'ceremonial'],
  },
  {
    sku: 'VC-TEVERDE-30', name: 'Té Verde Sencha Premium · 30 bolsas',
    category: 'Bebidas Funcionales', description: 'Té verde japonés de primera cosecha. Metabolismo, antioxidantes y concentración.',
    basePrice: 22_000, suggestedPrice: 48_000, weightG: 90, stockCO: 380, active: true, bestseller: false, rating: 4.5, sold: 890,
    tags: ['té verde', 'metabolismo', 'antioxidante', 'concentración'],
  },
  {
    sku: 'VC-GOLD-MILK', name: 'Golden Milk Mix · Cúrcuma Latte 200g',
    category: 'Bebidas Funcionales', description: 'Mezcla de cúrcuma, jengibre, canela y pimienta negra. Antiinflamatorio natural para preparar en leche.',
    basePrice: 30_000, suggestedPrice: 65_000, weightG: 220, stockCO: 165, active: true, bestseller: false, rating: 4.7, sold: 1_020,
    tags: ['cúrcuma', 'golden milk', 'antiinflamatorio', 'jengibre'],
  },

  // ── ACEITES Y EXTRACTOS ─────────────────────────────────
  {
    sku: 'VC-CBD-30', name: 'Aceite CBD Full Spectrum 30ml',
    category: 'Aceites y Extractos', description: 'Cannabidiol de amplio espectro 1000mg. Alivia dolor, ansiedad y mejora el sueño. Con gotero.',
    basePrice: 75_000, suggestedPrice: 160_000, weightG: 50, stockCO: 64, active: true, bestseller: true, rating: 4.9, sold: 1_890,
    tags: ['cbd', 'cannabidiol', 'dolor', 'ansiedad', 'sueño'],
  },
  {
    sku: 'VC-OREGANO-OIL', name: 'Aceite de Orégano 30ml',
    category: 'Aceites y Extractos', description: 'Aceite esencial de orégano silvestre. Antibacteriano natural, apoya inmunidad y digestión.',
    basePrice: 32_000, suggestedPrice: 68_000, weightG: 50, stockCO: 178, active: true, bestseller: false, rating: 4.6, sold: 720,
    tags: ['orégano', 'antibacteriano', 'inmunidad', 'aceite esencial'],
  },
  {
    sku: 'VC-COCO-500', name: 'Aceite de Coco Virgen Extra 500ml',
    category: 'Aceites y Extractos', description: 'Prensado en frío, sin refinar. Cocina saludable, hidratación de piel y cabello.',
    basePrice: 25_000, suggestedPrice: 55_000, weightG: 520, stockCO: 310, active: true, bestseller: false, rating: 4.7, sold: 1_560,
    tags: ['aceite de coco', 'cocina', 'hidratante', 'cabello', 'piel'],
  },
]

// ── Helpers ─────────────────────────────────────────────

export const CATEGORIES: ProductCategory[] = [
  'Suplementos', 'Superalimentos', 'Adaptógenos',
  'Cuidado Personal', 'Kits y Packs', 'Bebidas Funcionales', 'Aceites y Extractos',
]

export function getProductsBySku(skus: string[]): Product[] {
  return CATALOG.filter(p => skus.includes(p.sku))
}

export function getProductsByCategory(cat: ProductCategory): Product[] {
  return CATALOG.filter(p => p.category === cat && p.active)
}

export function getBestsellers(): Product[] {
  return CATALOG.filter(p => p.bestseller && p.active)
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase()
  return CATALOG.filter(p =>
    p.active && (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)) ||
      p.sku.toLowerCase().includes(q)
    )
  )
}

/** Margen de ganancia para el dropshipper */
export function getMargin(product: Product): { value: number; percent: number } {
  const value = product.suggestedPrice - product.basePrice
  const percent = Math.round((value / product.suggestedPrice) * 100)
  return { value, percent }
}

/** Estadísticas generales del catálogo */
export function getCatalogStats() {
  const active = CATALOG.filter(p => p.active)
  return {
    totalProducts: active.length,
    totalBestsellers: active.filter(p => p.bestseller).length,
    avgRating: Math.round(active.reduce((a, p) => a + p.rating, 0) / active.length * 10) / 10,
    totalSold: active.reduce((a, p) => a + p.sold, 0),
    categories: CATEGORIES.length,
    lowStock: active.filter(p => p.stockCO < 50).length,
  }
}
