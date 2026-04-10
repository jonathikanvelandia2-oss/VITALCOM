// ── Catálogo real Vitalcom — Datos del catálogo oficial ──
// PRECIOS REALES en COP. 3 niveles de precio:
// - Público: precio al consumidor final
// - Comunidad: precio para miembros de la comunidad (costo dropshipper)
// - Privado: precio para miembros VIP/privados

export type ProductCategory =
  | 'Polvos'
  | 'Líquidos'
  | 'Gummis'
  | 'Cápsulas'
  | 'Cremas'
  | 'Línea Mascotas'

export type Product = {
  sku: string
  name: string
  category: ProductCategory
  /** Precio público (consumidor final) — COP */
  precioPublico: number
  /** Precio comunidad (miembros / dropshippers) — COP */
  precioComunidad: number
  /** Precio privado (VIP) — COP */
  precioPrivado: number
  active: boolean
  bestseller: boolean
  tags: string[]
  image?: string
}

// ═══════════════════════════════════════════════════════════
// CATÁLOGO COMPLETO — Productos reales Vitalcom Colombia
// ═══════════════════════════════════════════════════════════

export const CATALOG: Product[] = [
  // ── POLVOS ──────────────────────────────────────────────
  { sku: 'VC-POL-001', name: 'Bayas de Goji', category: 'Polvos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['antioxidante', 'energía', 'inmunidad'], image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-002', name: 'Calostro Bovino', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: true, tags: ['inmunidad', 'digestión', 'proteína'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-003', name: 'Citrato de Magnesio', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: false, tags: ['magnesio', 'sueño', 'estrés', 'relajación'], image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-004', name: 'Colágeno Marino', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: true, tags: ['colágeno', 'piel', 'articulaciones', 'belleza'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-005', name: 'Match Maca', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: false, tags: ['maca', 'energía', 'hormonas', 'matcha'], image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-006', name: 'Ossteos D', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: false, tags: ['huesos', 'vitamina d', 'calcio'], image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-007', name: 'Deluxe Collagen', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: true, tags: ['colágeno', 'premium', 'piel', 'cabello'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-008', name: 'T-Green', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: false, tags: ['té verde', 'metabolismo', 'antioxidante'], image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-009', name: 'Multicollagen', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: false, tags: ['colágeno', 'multi-tipo', 'articulaciones'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-010', name: 'Yerba Magic', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['yerba mate', 'energía', 'digestión'], image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-011', name: 'Bloom', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['belleza', 'piel', 'flora'], image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-012', name: 'Ryze', category: 'Polvos', precioPublico: 32400, precioComunidad: 29900, precioPrivado: 31150, active: true, bestseller: true, tags: ['hongos', 'café', 'energía', 'concentración'], image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-013', name: 'Dayaral', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, active: true, bestseller: false, tags: ['premium', 'bienestar', 'integral'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-014', name: '3 Calostros', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, active: true, bestseller: false, tags: ['calostro', 'inmunidad', 'triple'], image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-015', name: '12 Colágenos', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, active: true, bestseller: true, tags: ['colágeno', '12 tipos', 'premium', 'completo'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-016', name: 'Natu Children', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, active: true, bestseller: false, tags: ['niños', 'infantil', 'vitaminas', 'natural'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-017', name: 'Wellfless', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, active: true, bestseller: false, tags: ['bienestar', 'integral', 'premium'], image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-018', name: 'Creatine for Women', category: 'Polvos', precioPublico: 28400, precioComunidad: 23900, precioPrivado: 26400, active: true, bestseller: false, tags: ['creatina', 'mujer', 'fitness', 'rendimiento'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-019', name: 'Pump It', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['pre-entreno', 'energía', 'fitness'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-020', name: 'Peach Perfect', category: 'Polvos', precioPublico: 29900, precioComunidad: 26400, precioPrivado: 28900, active: true, bestseller: false, tags: ['durazno', 'colágeno', 'belleza'], image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-021', name: 'Inositol Microingredients', category: 'Polvos', precioPublico: 30000, precioComunidad: 25000, precioPrivado: 27500, active: true, bestseller: false, tags: ['inositol', 'hormonal', 'fertilidad'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-022', name: 'Col-Nclin', category: 'Polvos', precioPublico: 22900, precioComunidad: 18400, precioPrivado: 20900, active: true, bestseller: false, tags: ['colágeno', 'económico'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-023', name: 'Té Matcha', category: 'Polvos', precioPublico: 26900, precioComunidad: 22400, precioPrivado: 24900, active: true, bestseller: false, tags: ['matcha', 'té', 'antioxidante', 'energía'], image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-024', name: 'Citramag', category: 'Polvos', precioPublico: 24900, precioComunidad: 22900, precioPrivado: 18400, active: true, bestseller: false, tags: ['magnesio', 'citrato'], image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-025', name: 'Bacillus Coagulans', category: 'Polvos', precioPublico: 32500, precioComunidad: 27500, precioPrivado: 30000, active: true, bestseller: false, tags: ['probiótico', 'digestión', 'flora intestinal'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },

  // ── LÍQUIDOS ────────────────────────────────────────────
  { sku: 'VC-LIQ-001', name: 'Citrato de Magnesio Líquido', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['magnesio', 'líquido', 'relajación'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-002', name: 'Colágeno Marino Líquido', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: true, tags: ['colágeno', 'marino', 'líquido', 'piel'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-003', name: 'Cranberry', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['arándano', 'urinario', 'antioxidante'], image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-004', name: 'FBMax', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['fibra', 'digestión', 'peso'], image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-005', name: 'Fle-Za 1000', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['articulaciones', 'flexibilidad'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-006', name: 'Multibrina X6', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['multivitamínico', 'energía'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-007', name: 'Clorofila Vitalcom', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: true, tags: ['clorofila', 'detox', 'vitalcom'], image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-008', name: 'Resveratrol Nath', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['resveratrol', 'antioxidante', 'anti-edad'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-009', name: 'Multimaxx Fresa', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['multivitamínico', 'fresa'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-010', name: 'Multimaxx Mango', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['multivitamínico', 'mango'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-011', name: 'Multimaxx Coco', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['multivitamínico', 'coco'], image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-012', name: 'Shilajit', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['shilajit', 'minerales', 'energía'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-013', name: 'Ouhoe', category: 'Líquidos', precioPublico: 11500, precioComunidad: 9500, precioPrivado: 10300, active: true, bestseller: false, tags: ['aceite', 'tópico'], image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-014', name: 'Fumarex', category: 'Líquidos', precioPublico: 14900, precioComunidad: 12200, precioPrivado: 13500, active: true, bestseller: false, tags: ['respiratorio', 'pulmones'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-015', name: 'Bichota Sachets', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: true, tags: ['belleza', 'colágeno', 'sachets'], image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-016', name: 'Bichota 500ml', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['belleza', 'colágeno', 'líquido'], image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-017', name: 'Erqmaxx 500ml', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['energía', 'rendimiento'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-018', name: 'Erqmaxx Sachets', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['energía', 'sachets'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-019', name: 'Mary Ruth Fresa', category: 'Líquidos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: false, tags: ['multivitamínico', 'fresa', 'orgánico'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-020', name: 'Mary Ruth Dragon Fruit', category: 'Líquidos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, active: true, bestseller: false, tags: ['multivitamínico', 'pitaya', 'orgánico'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-021', name: 'Mary Ruth Orégano', category: 'Líquidos', precioPublico: 26900, precioComunidad: 22400, precioPrivado: 24900, active: true, bestseller: false, tags: ['orégano', 'inmunidad', 'orgánico'], image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-022', name: 'Clorofila Benevolet', category: 'Líquidos', precioPublico: 26900, precioComunidad: 22400, precioPrivado: 24900, active: true, bestseller: false, tags: ['clorofila', 'detox'], image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-023', name: 'Vascu Glow', category: 'Líquidos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['vascular', 'circulación', 'piel'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-024', name: 'Colagenvit', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['colágeno', 'vitaminas'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-025', name: 'Ilcesan', category: 'Líquidos', precioPublico: 22900, precioComunidad: 18400, precioPrivado: 20900, active: true, bestseller: false, tags: ['digestión', 'estómago'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-026', name: 'Carnitine', category: 'Líquidos', precioPublico: 30000, precioComunidad: 25000, precioPrivado: 27500, active: true, bestseller: false, tags: ['carnitina', 'quema grasa', 'fitness'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },

  // ── GUMMIS ──────────────────────────────────────────────
  { sku: 'VC-GUM-001', name: 'Vinagre de Manzana NH', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: false, tags: ['vinagre manzana', 'digestión', 'peso'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-002', name: 'Vitamina C Gummies', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: true, tags: ['vitamina c', 'inmunidad', 'gummies'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-003', name: 'Nicotinamide', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: false, tags: ['vitamina b3', 'piel', 'anti-edad'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-004', name: 'Vinagre de Manzana', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: false, tags: ['vinagre', 'manzana', 'metabolismo'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-005', name: 'Probióticos Gummies', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: true, tags: ['probióticos', 'digestión', 'gummies'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-006', name: 'Citrato de Magnesio Gummies', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: false, tags: ['magnesio', 'gummies', 'sueño'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-007', name: 'Borojó y Guaraná', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: false, tags: ['borojó', 'guaraná', 'energía', 'colombiano'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-008', name: 'Gomikids', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: false, tags: ['niños', 'vitaminas', 'infantil'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-009', name: 'Resveratrol Gummies', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, active: true, bestseller: false, tags: ['resveratrol', 'antioxidante', 'gummies'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },

  // ── CÁPSULAS ────────────────────────────────────────────
  { sku: 'VC-CAP-001', name: 'Melena de León', category: 'Cápsulas', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: true, tags: ['lions mane', 'memoria', 'concentración', 'cerebro'], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-002', name: 'Ashwagandha', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: true, tags: ['ashwagandha', 'estrés', 'cortisol', 'sueño'], image: 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-003', name: 'Aguaje', category: 'Cápsulas', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['aguaje', 'hormonas', 'mujer', 'curvas'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-004', name: 'XSLine', category: 'Cápsulas', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, active: true, bestseller: false, tags: ['peso', 'quema grasa', 'metabolismo'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-005', name: 'Circlen', category: 'Cápsulas', precioPublico: 15900, precioComunidad: 11900, precioPrivado: 13900, active: true, bestseller: false, tags: ['circulación', 'vascular'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-006', name: 'Candida', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['candida', 'hongos', 'flora'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-007', name: 'Enzimas + Probiotic', category: 'Cápsulas', precioPublico: 40000, precioComunidad: 35000, precioPrivado: 37500, active: true, bestseller: true, tags: ['enzimas', 'probióticos', 'digestión', 'premium'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-008', name: 'Preggo', category: 'Cápsulas', precioPublico: 30000, precioComunidad: 25000, precioPrivado: 27500, active: true, bestseller: false, tags: ['embarazo', 'prenatal', 'ácido fólico'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-009', name: 'Lions Mane', category: 'Cápsulas', precioPublico: 30650, precioComunidad: 25650, precioPrivado: 28150, active: true, bestseller: false, tags: ['lions mane', 'hongo', 'neuronas'], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-010', name: 'Oil of Oregano', category: 'Cápsulas', precioPublico: 35000, precioComunidad: 30000, precioPrivado: 32500, active: true, bestseller: false, tags: ['orégano', 'antibacteriano', 'inmunidad'], image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-011', name: 'Hair Growth', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['cabello', 'crecimiento', 'biotina'], image: 'https://images.unsplash.com/photo-1596360644544-02e218704bf6?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-012', name: 'URO', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['urinario', 'cranberry', 'mujer'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-013', name: 'Meno', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['menopausia', 'hormonas', 'mujer'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-014', name: '60 Billion Probiotic', category: 'Cápsulas', precioPublico: 25000, precioComunidad: 20000, precioPrivado: 22500, active: true, bestseller: true, tags: ['probióticos', '60 billones', 'digestión'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-015', name: 'Turkesterone', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['turkesterone', 'músculo', 'fitness'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-016', name: 'Nitric Oxide', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['óxido nítrico', 'circulación', 'fitness'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },

  // ── CREMAS ──────────────────────────────────────────────
  { sku: 'VC-CRE-001', name: 'Evil Goods', category: 'Cremas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: true, tags: ['crema', 'skincare', 'natural'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=400&h=400&fit=crop' },
  { sku: 'VC-CRE-002', name: 'Tallow Honey', category: 'Cremas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, active: true, bestseller: false, tags: ['sebo', 'miel', 'hidratante', 'natural'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=400&h=400&fit=crop' },
  { sku: 'VC-CRE-003', name: 'URO Desodorante', category: 'Cremas', precioPublico: 13500, precioComunidad: 13500, precioPrivado: 13500, active: true, bestseller: false, tags: ['desodorante', 'natural', 'uro'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=400&h=400&fit=crop' },

  // ── LÍNEA MASCOTAS ──────────────────────────────────────
  { sku: 'VC-PET-001', name: '3 en 1 Mascotas', category: 'Línea Mascotas', precioPublico: 27900, precioComunidad: 22900, precioPrivado: 25900, active: true, bestseller: true, tags: ['mascotas', 'perros', 'gatos', '3 en 1'], image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop' },
  { sku: 'VC-PET-002', name: 'Pet Omega', category: 'Línea Mascotas', precioPublico: 27900, precioComunidad: 22900, precioPrivado: 25900, active: true, bestseller: false, tags: ['mascotas', 'omega', 'pelo', 'articulaciones'], image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop' },
  { sku: 'VC-PET-003', name: 'Pet Hemp', category: 'Línea Mascotas', precioPublico: 27900, precioComunidad: 22900, precioPrivado: 25900, active: true, bestseller: false, tags: ['mascotas', 'hemp', 'cáñamo', 'ansiedad'], image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop' },
]

// ── Helpers ─────────────────────────────────────────────

export const CATEGORIES: ProductCategory[] = [
  'Polvos', 'Líquidos', 'Gummis', 'Cápsulas', 'Cremas', 'Línea Mascotas',
]

export function getMargin(product: Product): { value: number; percent: number } {
  const value = product.precioPublico - product.precioComunidad
  const percent = Math.round((value / product.precioPublico) * 100)
  return { value, percent }
}

export function getCatalogStats() {
  const active = CATALOG.filter(p => p.active)
  return {
    totalProducts: active.length,
    totalBestsellers: active.filter(p => p.bestseller).length,
    categories: CATEGORIES.length,
    avgPublicPrice: Math.round(active.reduce((a, p) => a + p.precioPublico, 0) / active.length),
    avgCommunityPrice: Math.round(active.reduce((a, p) => a + p.precioComunidad, 0) / active.length),
  }
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

export function getBestsellers(): Product[] {
  return CATALOG.filter(p => p.bestseller && p.active)
}
