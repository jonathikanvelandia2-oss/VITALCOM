// ── Integración Shopify para VITALCOMMERS ──────────────
// Tipos, constantes y helpers para conectar tiendas Shopify
// de los dropshippers con el catálogo Vitalcom.
//
// Fase actual: tipos + mock. Fase siguiente: Shopify API real.

// ── Tipos ────────────────────────────────────────────────

export type ShopifyStoreStatus = 'not_connected' | 'connecting' | 'active' | 'paused' | 'error'

export type ShopifyStore = {
  id: string
  shopDomain: string           // ej: "mi-tienda.myshopify.com"
  storeName: string
  ownerEmail: string
  status: ShopifyStoreStatus
  plan: 'Basic' | 'Shopify' | 'Advanced'
  productsCount: number
  syncedProducts: number       // productos Vitalcom sincronizados
  pendingOrders: number
  totalRevenue: number         // ingresos totales COP
  currency: string
  connectedAt: string | null
  lastSyncAt: string | null
}

export type SyncedProduct = {
  sku: string
  name: string
  shopifyProductId: string
  shopifyVariantId: string
  sellingPrice: number         // precio que el dropshipper puso en su tienda
  costPrice: number            // precio comunidad Vitalcom
  margin: number               // porcentaje de ganancia
  status: 'active' | 'draft' | 'archived'
  inventory: number
  soldTotal: number
  lastSyncAt: string
}

export type StoreOrder = {
  id: string
  shopifyOrderId: string
  orderNumber: string          // #1001, #1002...
  customerName: string
  customerCity: string
  items: { name: string; qty: number; price: number }[]
  subtotal: number
  shipping: number
  total: number
  profit: number               // ganancia del dropshipper
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled'
  dropiTrackingCode: string | null
  createdAt: string
}

export type StoreMetrics = {
  totalRevenue: number
  totalProfit: number
  totalOrders: number
  avgOrderValue: number
  conversionRate: number       // %
  returnRate: number           // %
  topProducts: { name: string; sold: number; revenue: number }[]
  revenueByDay: { date: string; revenue: number; profit: number }[]
  ordersByStatus: Record<string, number>
}

// ── Guías de creación de tienda ──────────────────────────

export type StoreCreationStep = {
  step: number
  title: string
  description: string
  action: string
  completed: boolean
}

export const STORE_CREATION_GUIDE: StoreCreationStep[] = [
  {
    step: 1,
    title: 'Crear cuenta en Shopify',
    description: 'Regístrate en shopify.com con tu email. Obtén 3 días gratis para configurar todo antes de pagar.',
    action: 'Ir a Shopify',
    completed: false,
  },
  {
    step: 2,
    title: 'Elegir nombre y dominio',
    description: 'Escoge un nombre para tu tienda que refleje tu nicho. Shopify te da un dominio .myshopify.com gratis.',
    action: 'Tips de nombres',
    completed: false,
  },
  {
    step: 3,
    title: 'Instalar tema optimizado',
    description: 'Usa un tema gratuito como Dawn o Sense. Nosotros te damos plantillas de diseño probadas para suplementos.',
    action: 'Ver temas recomendados',
    completed: false,
  },
  {
    step: 4,
    title: 'Conectar pasarela de pagos',
    description: 'Configura Wompi, MercadoPago o Nequi según tu país. En Colombia recomendamos Wompi + contra entrega.',
    action: 'Guía de pasarelas',
    completed: false,
  },
  {
    step: 5,
    title: 'Importar productos Vitalcom',
    description: 'Desde el catálogo Vitalcom, selecciona los productos que quieres vender. Los importamos directo a tu tienda.',
    action: 'Ir al catálogo',
    completed: false,
  },
  {
    step: 6,
    title: 'Conectar tu tienda a Vitalcom',
    description: 'Pega tu dominio .myshopify.com aquí para sincronizar pedidos automáticamente con Dropi.',
    action: 'Conectar tienda',
    completed: false,
  },
]

// ── Plantillas de tienda ─────────────────────────────────

export type StoreTemplate = {
  id: string
  name: string
  niche: string
  description: string
  previewImage: string
  productsIncluded: number
  estimatedSetupTime: string
  features: string[]
}

export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: 'salud-general',
    name: 'Vida Natural',
    niche: 'Salud general y bienestar',
    description: 'Tienda enfocada en suplementos de bienestar general: colágenos, vitaminas, minerales. Ideal para empezar.',
    previewImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=400&fit=crop',
    productsIncluded: 15,
    estimatedSetupTime: '30 min',
    features: ['15 productos seleccionados', 'Banners listos', 'Textos de venta', 'SEO básico'],
  },
  {
    id: 'fitness-mujer',
    name: 'Fitness Femenino',
    niche: 'Fitness y belleza para mujeres',
    description: 'Colágenos, creatina para mujeres, productos de belleza. Enfocada en el público femenino fitness.',
    previewImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop',
    productsIncluded: 12,
    estimatedSetupTime: '25 min',
    features: ['12 productos fitness', 'Copy enfocado en mujeres', 'Paleta rosa/verde', 'Instagram ready'],
  },
  {
    id: 'mascotas',
    name: 'Peludos Sanos',
    niche: 'Suplementos para mascotas',
    description: 'Línea completa de productos para mascotas. Nicho en crecimiento con menos competencia.',
    previewImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop',
    productsIncluded: 8,
    estimatedSetupTime: '20 min',
    features: ['8 productos mascotas', 'Fotos optimizadas', 'Target pet owners', 'Alta retención'],
  },
  {
    id: 'premium',
    name: 'Elite Wellness',
    niche: 'Suplementos premium / alto ticket',
    description: 'Productos de mayor valor: Ryze, 12 Colágenos, Dayaral. Menos volumen, más margen por venta.',
    previewImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop',
    productsIncluded: 10,
    estimatedSetupTime: '35 min',
    features: ['10 productos premium', 'Diseño luxury', 'Alto margen (40%+)', 'Upsells configurados'],
  },
]

// ── Mock data para desarrollo ────────────────────────────

export const MOCK_STORE: ShopifyStore = {
  id: 'store_001',
  shopDomain: 'vitalshop-maria.myshopify.com',
  storeName: 'VitalShop María',
  ownerEmail: 'maria@vitalcommers.com',
  status: 'active',
  plan: 'Basic',
  productsCount: 18,
  syncedProducts: 14,
  pendingOrders: 3,
  totalRevenue: 4_850_000,
  currency: 'COP',
  connectedAt: '2026-03-15T10:00:00Z',
  lastSyncAt: '2026-04-14T08:30:00Z',
}

export const MOCK_SYNCED_PRODUCTS: SyncedProduct[] = [
  { sku: 'VC-POL-004', name: 'Colágeno Marino', shopifyProductId: 'sp_001', shopifyVariantId: 'sv_001', sellingPrice: 45900, costPrice: 23400, margin: 49, status: 'active', inventory: 0, soldTotal: 47, lastSyncAt: '2026-04-14T08:30:00Z' },
  { sku: 'VC-POL-002', name: 'Calostro Bovino', shopifyProductId: 'sp_002', shopifyVariantId: 'sv_002', sellingPrice: 42900, costPrice: 23400, margin: 45, status: 'active', inventory: 0, soldTotal: 31, lastSyncAt: '2026-04-14T08:30:00Z' },
  { sku: 'VC-POL-012', name: 'Ryze', shopifyProductId: 'sp_003', shopifyVariantId: 'sv_003', sellingPrice: 54900, costPrice: 29900, margin: 45, status: 'active', inventory: 0, soldTotal: 22, lastSyncAt: '2026-04-14T08:30:00Z' },
  { sku: 'VC-POL-015', name: '12 Colágenos', shopifyProductId: 'sp_004', shopifyVariantId: 'sv_004', sellingPrice: 64900, costPrice: 35400, margin: 45, status: 'active', inventory: 0, soldTotal: 18, lastSyncAt: '2026-04-14T08:30:00Z' },
  { sku: 'VC-GUM-001', name: 'Gummis Vitamina C', shopifyProductId: 'sp_005', shopifyVariantId: 'sv_005', sellingPrice: 34900, costPrice: 18400, margin: 47, status: 'active', inventory: 0, soldTotal: 35, lastSyncAt: '2026-04-14T08:30:00Z' },
]

export const MOCK_ORDERS: StoreOrder[] = [
  { id: 'ord_001', shopifyOrderId: 'sh_4521', orderNumber: '#1047', customerName: 'Laura Mendoza', customerCity: 'Bogotá', items: [{ name: 'Colágeno Marino', qty: 2, price: 45900 }], subtotal: 91800, shipping: 12000, total: 103800, profit: 45000, status: 'delivered', fulfillmentStatus: 'fulfilled', dropiTrackingCode: 'DRP-2026-8834', createdAt: '2026-04-12T14:22:00Z' },
  { id: 'ord_002', shopifyOrderId: 'sh_4522', orderNumber: '#1048', customerName: 'Carlos Ruiz', customerCity: 'Medellín', items: [{ name: 'Ryze', qty: 1, price: 54900 }, { name: 'Calostro Bovino', qty: 1, price: 42900 }], subtotal: 97800, shipping: 12000, total: 109800, profit: 44500, status: 'processing', fulfillmentStatus: 'unfulfilled', dropiTrackingCode: null, createdAt: '2026-04-13T09:15:00Z' },
  { id: 'ord_003', shopifyOrderId: 'sh_4523', orderNumber: '#1049', customerName: 'Ana Martínez', customerCity: 'Cali', items: [{ name: 'Gummis Vitamina C', qty: 3, price: 34900 }], subtotal: 104700, shipping: 12000, total: 116700, profit: 49500, status: 'confirmed', fulfillmentStatus: 'unfulfilled', dropiTrackingCode: null, createdAt: '2026-04-14T07:45:00Z' },
  { id: 'ord_004', shopifyOrderId: 'sh_4524', orderNumber: '#1050', customerName: 'Diego Vargas', customerCity: 'Barranquilla', items: [{ name: '12 Colágenos', qty: 1, price: 64900 }], subtotal: 64900, shipping: 15000, total: 79900, profit: 29500, status: 'pending', fulfillmentStatus: 'unfulfilled', dropiTrackingCode: null, createdAt: '2026-04-14T10:30:00Z' },
]

export const MOCK_METRICS: StoreMetrics = {
  totalRevenue: 4_850_000,
  totalProfit: 2_140_000,
  totalOrders: 112,
  avgOrderValue: 43_304,
  conversionRate: 3.2,
  returnRate: 8.5,
  topProducts: [
    { name: 'Colágeno Marino', sold: 47, revenue: 2_157_300 },
    { name: 'Gummis Vitamina C', sold: 35, revenue: 1_221_500 },
    { name: 'Calostro Bovino', sold: 31, revenue: 1_329_900 },
    { name: 'Ryze', sold: 22, revenue: 1_207_800 },
    { name: '12 Colágenos', sold: 18, revenue: 1_168_200 },
  ],
  revenueByDay: [
    { date: '2026-04-08', revenue: 543_000, profit: 238_000 },
    { date: '2026-04-09', revenue: 687_000, profit: 302_000 },
    { date: '2026-04-10', revenue: 412_000, profit: 181_000 },
    { date: '2026-04-11', revenue: 891_000, profit: 392_000 },
    { date: '2026-04-12', revenue: 756_000, profit: 333_000 },
    { date: '2026-04-13', revenue: 624_000, profit: 275_000 },
    { date: '2026-04-14', revenue: 937_000, profit: 419_000 },
  ],
  ordersByStatus: { pending: 4, confirmed: 8, processing: 12, shipped: 15, delivered: 68, cancelled: 5 },
}

// ── Helpers ──────────────────────────────────────────────

export function getStoreHealth(store: ShopifyStore): 'excellent' | 'good' | 'needs_attention' | 'critical' {
  if (store.status !== 'active') return 'critical'
  if (store.pendingOrders > 10) return 'needs_attention'
  if (store.syncedProducts < 5) return 'needs_attention'
  if (store.totalRevenue > 3_000_000) return 'excellent'
  return 'good'
}

export function formatCOP(value: number): string {
  return `$ ${value.toLocaleString('es-CO')}`
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'var(--vc-warning)',
    confirmed: 'var(--vc-info)',
    processing: 'var(--vc-lime-main)',
    shipped: 'var(--vc-lime-electric)',
    delivered: 'var(--vc-lime-deep)',
    cancelled: 'var(--vc-error)',
  }
  return map[status] || 'var(--vc-white-dim)'
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    unfulfilled: 'Sin despachar',
    partial: 'Parcial',
    fulfilled: 'Despachado',
  }
  return map[status] || status
}
