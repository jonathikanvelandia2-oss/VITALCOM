// ─── Intérprete de palabras clave para VITA ───
// Enriquece el mensaje del usuario con contexto antes de enviarlo al LLM
// Detecta intención + entidades para que el modelo responda con precisión

type KeywordContext = {
  enrichedPrompt: string | null
  detectedEntities: {
    categories: string[]
    brands: string[]
    countries: string[]
    priceRelated: boolean
    orderRelated: boolean
    communityRelated: boolean
  }
  suggestedTools: string[]
}

// Mapeo de palabras coloquiales/abreviadas a términos del catálogo
const CATEGORY_ALIASES: Record<string, string> = {
  'suplemento': 'Suplementos Nutricionales',
  'suplementos': 'Suplementos Nutricionales',
  'proteina': 'Suplementos Deportivos',
  'proteínas': 'Suplementos Deportivos',
  'deporte': 'Suplementos Deportivos',
  'deportivo': 'Suplementos Deportivos',
  'extracto': 'Extractos Naturales',
  'extractos': 'Extractos Naturales',
  'natural': 'Extractos Naturales',
  'bajar de peso': 'Control de Peso',
  'adelgazar': 'Control de Peso',
  'detox': 'Control de Peso',
  'dieta': 'Control de Peso',
  'peso': 'Control de Peso',
  'mujer': 'Salud Femenina',
  'femenino': 'Salud Femenina',
  'femenina': 'Salud Femenina',
  'hombre': 'Salud Masculina',
  'masculino': 'Salud Masculina',
  'belleza': 'Belleza & Cuidado',
  'piel': 'Belleza & Cuidado',
  'cabello': 'Belleza & Cuidado',
  'pelo': 'Belleza & Cuidado',
  'mascota': 'Mascotas',
  'perro': 'Mascotas',
  'gato': 'Mascotas',
  'niño': 'Infantil',
  'niños': 'Infantil',
  'infantil': 'Infantil',
  'bebé': 'Infantil',
  'bebe': 'Infantil',
  'maquila': 'Maquilas',
  'marca propia': 'Maquilas',
  'marca blanca': 'Maquilas',
}

const COUNTRY_ALIASES: Record<string, string> = {
  'colombia': 'CO',
  'colombiano': 'CO',
  'bogota': 'CO',
  'bogotá': 'CO',
  'medellín': 'CO',
  'medellin': 'CO',
  'cali': 'CO',
  'ecuador': 'EC',
  'ecuatoriano': 'EC',
  'quito': 'EC',
  'guayaquil': 'EC',
  'guatemala': 'GT',
  'guatemalteco': 'GT',
  'chile': 'CL',
  'chileno': 'CL',
  'santiago': 'CL',
}

const PRESENTATION_ALIASES: Record<string, string> = {
  'capsula': 'Cápsulas',
  'capsulas': 'Cápsulas',
  'pastilla': 'Cápsulas',
  'pastillas': 'Cápsulas',
  'liquido': 'Líquidos',
  'líquido': 'Líquidos',
  'jarabe': 'Líquidos',
  'gotas': 'Líquidos',
  'polvo': 'Polvos',
  'polvos': 'Polvos',
  'gomita': 'Gummis',
  'gomitas': 'Gummis',
  'gummy': 'Gummis',
  'gummies': 'Gummis',
  'crema': 'Cremas',
  'cremas': 'Cremas',
}

const INTENT_KEYWORDS: Record<string, { tools: string[]; contextHint: string }> = {
  'más vendido': { tools: ['searchCatalog'], contextHint: 'Ordena por ventas (salesCount desc)' },
  'top': { tools: ['searchCatalog'], contextHint: 'Los productos con más ventas' },
  'popular': { tools: ['searchCatalog'], contextHint: 'Productos populares por ventas' },
  'barato': { tools: ['searchCatalog'], contextHint: 'Ordena por precio menor' },
  'económico': { tools: ['searchCatalog'], contextHint: 'Productos con precio accesible' },
  'caro': { tools: ['searchCatalog'], contextHint: 'Productos premium / precio alto' },
  'nuevo': { tools: ['searchCatalog'], contextHint: 'Productos recientes' },
  'envío': { tools: ['calculatePrice'], contextHint: 'Incluye costos de envío por país' },
  'enviar': { tools: ['getStock'], contextHint: 'Verifica stock disponible para despacho' },
  'vender': { tools: ['calculatePrice'], contextHint: 'Calcula margen de ganancia' },
  'ganar': { tools: ['calculatePrice'], contextHint: 'Calcula ganancia neta (sin prometer cifras)' },
  'stock': { tools: ['getStock'], contextHint: 'Consulta disponibilidad' },
  'agotado': { tools: ['getStock'], contextHint: 'Busca productos con stock 0' },
  'pedido': { tools: ['getMyOrders'], contextHint: 'Estado de pedidos del usuario' },
  'compré': { tools: ['getMyOrders'], contextHint: 'Historial de compras' },
  'ranking': { tools: ['getCommunityRanking'], contextHint: 'Tabla de posiciones' },
  'nivel': { tools: ['getMyStats'], contextHint: 'Nivel y puntos del usuario' },
  'bodega': { tools: ['getStock'], contextHint: 'Stock por bodega (BIOBEL/VITALCOM)' },
}

export function interpretKeywords(message: string): KeywordContext {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const words = lower.split(/\s+/)

  const categories: string[] = []
  const brands: string[] = []
  const countries: string[] = []
  const suggestedTools: string[] = []
  const contextHints: string[] = []
  let priceRelated = false
  let orderRelated = false
  let communityRelated = false

  // Detectar categorías
  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    if (lower.includes(alias)) {
      categories.push(category)
    }
  }

  // Detectar países
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    if (lower.includes(alias)) {
      countries.push(code)
    }
  }

  // Detectar intenciones por keyword
  for (const [keyword, info] of Object.entries(INTENT_KEYWORDS)) {
    if (lower.includes(keyword)) {
      suggestedTools.push(...info.tools)
      contextHints.push(info.contextHint)
    }
  }

  // Detectar temas
  if (/precio|margen|ganancia|costo|vale|cuesta|calcul/i.test(lower)) priceRelated = true
  if (/pedido|orden|envi|despach|tracking|compra/i.test(lower)) orderRelated = true
  if (/ranking|nivel|punto|comunidad|miembro|logro/i.test(lower)) communityRelated = true

  // Construir prompt enriquecido solo si hay contexto útil
  let enrichedPrompt: string | null = null
  const enrichments: string[] = []

  if (categories.length > 0) {
    enrichments.push(`[Categorías detectadas: ${[...new Set(categories)].join(', ')}]`)
  }
  if (countries.length > 0) {
    enrichments.push(`[Países mencionados: ${[...new Set(countries)].join(', ')}]`)
  }
  if (contextHints.length > 0) {
    enrichments.push(`[Contexto: ${[...new Set(contextHints)].join('. ')}]`)
  }

  if (enrichments.length > 0) {
    enrichedPrompt = enrichments.join(' ')
  }

  return {
    enrichedPrompt,
    detectedEntities: {
      categories: [...new Set(categories)],
      brands: [...new Set(brands)],
      countries: [...new Set(countries)],
      priceRelated,
      orderRelated,
      communityRelated,
    },
    suggestedTools: [...new Set(suggestedTools)],
  }
}
