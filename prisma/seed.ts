// ── Seed Vitalcom — Datos iniciales de producción ────────
// Ejecutar: npx prisma db seed
// Crea: productos reales, stock CO, CEO, empleados, dropshippers test

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Catálogo completo Vitalcom — 75 productos con imágenes ──
// Importado de src/lib/catalog/products.ts (mismo catálogo oficial)
const CATALOG = [
  // ── POLVOS (25) ──
  { sku: 'VC-POL-001', name: 'Bayas de Goji', category: 'Polvos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['antioxidante', 'energía', 'inmunidad'], image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-002', name: 'Calostro Bovino', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: true, tags: ['inmunidad', 'digestión', 'proteína'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-003', name: 'Citrato de Magnesio', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['magnesio', 'sueño', 'estrés', 'relajación'], image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-004', name: 'Colágeno Marino', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: true, tags: ['colágeno', 'piel', 'articulaciones', 'belleza'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-005', name: 'Match Maca', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['maca', 'energía', 'hormonas', 'matcha'], image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-006', name: 'Ossteos D', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['huesos', 'vitamina d', 'calcio'], image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-007', name: 'Deluxe Collagen', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: true, tags: ['colágeno', 'premium', 'piel', 'cabello'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-008', name: 'T-Green', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['té verde', 'metabolismo', 'antioxidante'], image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-009', name: 'Multicollagen', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['colágeno', 'multi-tipo', 'articulaciones'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-010', name: 'Yerba Magic', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['yerba mate', 'energía', 'digestión'], image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-011', name: 'Bloom', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['belleza', 'piel', 'flora'], image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-012', name: 'Ryze', category: 'Polvos', precioPublico: 32400, precioComunidad: 29900, precioPrivado: 31150, bestseller: true, tags: ['hongos', 'café', 'energía', 'concentración'], image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-013', name: 'Dayaral', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: false, tags: ['premium', 'bienestar', 'integral'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-014', name: '3 Calostros', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: false, tags: ['calostro', 'inmunidad', 'triple'], image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-015', name: '12 Colágenos', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: true, tags: ['colágeno', '12 tipos', 'premium', 'completo'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-016', name: 'Natu Children', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: false, tags: ['niños', 'infantil', 'vitaminas', 'natural'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-017', name: 'Wellfless', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: false, tags: ['bienestar', 'integral', 'premium'], image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-018', name: 'Creatine for Women', category: 'Polvos', precioPublico: 28400, precioComunidad: 23900, precioPrivado: 26400, bestseller: false, tags: ['creatina', 'mujer', 'fitness', 'rendimiento'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-019', name: 'Pump It', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['pre-entreno', 'energía', 'fitness'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-020', name: 'Peach Perfect', category: 'Polvos', precioPublico: 29900, precioComunidad: 26400, precioPrivado: 28900, bestseller: false, tags: ['durazno', 'colágeno', 'belleza'], image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-021', name: 'Inositol Microingredients', category: 'Polvos', precioPublico: 30000, precioComunidad: 25000, precioPrivado: 27500, bestseller: false, tags: ['inositol', 'hormonal', 'fertilidad'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-022', name: 'Col-Nclin', category: 'Polvos', precioPublico: 22900, precioComunidad: 18400, precioPrivado: 20900, bestseller: false, tags: ['colágeno', 'económico'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-023', name: 'Té Matcha', category: 'Polvos', precioPublico: 26900, precioComunidad: 22400, precioPrivado: 24900, bestseller: false, tags: ['matcha', 'té', 'antioxidante'], image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-024', name: 'Citramag', category: 'Polvos', precioPublico: 24900, precioComunidad: 22900, precioPrivado: 18400, bestseller: false, tags: ['magnesio', 'citrato'], image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop' },
  { sku: 'VC-POL-025', name: 'Bacillus Coagulans', category: 'Polvos', precioPublico: 32500, precioComunidad: 27500, precioPrivado: 30000, bestseller: false, tags: ['probiótico', 'digestión', 'flora intestinal'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  // ── LÍQUIDOS (26) ──
  { sku: 'VC-LIQ-001', name: 'Citrato de Magnesio Líquido', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['magnesio', 'líquido', 'relajación'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-002', name: 'Colágeno Marino Líquido', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: true, tags: ['colágeno', 'marino', 'líquido', 'piel'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-003', name: 'Cranberry', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['arándano', 'urinario', 'antioxidante'], image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-004', name: 'FBMax', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['fibra', 'digestión', 'peso'], image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-005', name: 'Fle-Za 1000', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['articulaciones', 'flexibilidad'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-006', name: 'Multibrina X6', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['multivitamínico', 'energía'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-007', name: 'Clorofila Vitalcom', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: true, tags: ['clorofila', 'detox', 'vitalcom'], image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-008', name: 'Resveratrol Nath', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['resveratrol', 'antioxidante', 'anti-edad'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-009', name: 'Multimaxx Fresa', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['multivitamínico', 'fresa'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-010', name: 'Multimaxx Mango', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['multivitamínico', 'mango'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-011', name: 'Multimaxx Coco', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['multivitamínico', 'coco'], image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-012', name: 'Shilajit', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['shilajit', 'minerales', 'energía'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-013', name: 'Ouhoe', category: 'Líquidos', precioPublico: 11500, precioComunidad: 9500, precioPrivado: 10300, bestseller: false, tags: ['aceite', 'tópico'], image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-014', name: 'Fumarex', category: 'Líquidos', precioPublico: 14900, precioComunidad: 12200, precioPrivado: 13500, bestseller: false, tags: ['respiratorio', 'pulmones'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-015', name: 'Bichota Sachets', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: true, tags: ['belleza', 'colágeno', 'sachets'], image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-016', name: 'Bichota 500ml', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['belleza', 'colágeno', 'líquido'], image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-017', name: 'Erqmaxx 500ml', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['energía', 'rendimiento'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-018', name: 'Erqmaxx Sachets', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['energía', 'sachets'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-019', name: 'Mary Ruth Fresa', category: 'Líquidos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['multivitamínico', 'fresa', 'orgánico'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-020', name: 'Mary Ruth Dragon Fruit', category: 'Líquidos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['multivitamínico', 'pitaya', 'orgánico'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-021', name: 'Mary Ruth Orégano', category: 'Líquidos', precioPublico: 26900, precioComunidad: 22400, precioPrivado: 24900, bestseller: false, tags: ['orégano', 'inmunidad', 'orgánico'], image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-022', name: 'Clorofila Benevolet', category: 'Líquidos', precioPublico: 26900, precioComunidad: 22400, precioPrivado: 24900, bestseller: false, tags: ['clorofila', 'detox'], image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-023', name: 'Vascu Glow', category: 'Líquidos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['vascular', 'circulación', 'piel'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-024', name: 'Colagenvit', category: 'Líquidos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['colágeno', 'vitaminas'], image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-025', name: 'Ilcesan', category: 'Líquidos', precioPublico: 22900, precioComunidad: 18400, precioPrivado: 20900, bestseller: false, tags: ['digestión', 'estómago'], image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop' },
  { sku: 'VC-LIQ-026', name: 'Carnitine', category: 'Líquidos', precioPublico: 30000, precioComunidad: 25000, precioPrivado: 27500, bestseller: false, tags: ['carnitina', 'quema grasa', 'fitness'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  // ── GUMMIS (9) ──
  { sku: 'VC-GUM-001', name: 'Vinagre de Manzana NH', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: false, tags: ['vinagre manzana', 'digestión', 'peso'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-002', name: 'Vitamina C Gummies', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: true, tags: ['vitamina c', 'inmunidad', 'gummies'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-003', name: 'Nicotinamide', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: false, tags: ['vitamina b3', 'piel', 'anti-edad'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-004', name: 'Vinagre de Manzana', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: false, tags: ['vinagre', 'manzana', 'metabolismo'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-005', name: 'Probióticos Gummies', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: true, tags: ['probióticos', 'digestión', 'gummies'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-006', name: 'Citrato de Magnesio Gummies', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: false, tags: ['magnesio', 'gummies', 'sueño'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-007', name: 'Borojó y Guaraná', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: false, tags: ['borojó', 'guaraná', 'energía', 'colombiano'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-008', name: 'Gomikids', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: false, tags: ['niños', 'vitaminas', 'infantil'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-GUM-009', name: 'Resveratrol Gummies', category: 'Gummis', precioPublico: 28900, precioComunidad: 24400, precioPrivado: 26900, bestseller: false, tags: ['resveratrol', 'antioxidante', 'gummies'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  // ── CÁPSULAS (16) ──
  { sku: 'VC-CAP-001', name: 'Melena de León', category: 'Cápsulas', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: true, tags: ['lions mane', 'memoria', 'concentración', 'cerebro'], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-002', name: 'Ashwagandha', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: true, tags: ['ashwagandha', 'estrés', 'cortisol', 'sueño'], image: 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-003', name: 'Aguaje', category: 'Cápsulas', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['aguaje', 'hormonas', 'mujer', 'curvas'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-004', name: 'XSLine', category: 'Cápsulas', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['peso', 'quema grasa', 'metabolismo'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-005', name: 'Circlen', category: 'Cápsulas', precioPublico: 15900, precioComunidad: 11900, precioPrivado: 13900, bestseller: false, tags: ['circulación', 'vascular'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-006', name: 'Candida', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['candida', 'hongos', 'flora'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-007', name: 'Enzimas + Probiotic', category: 'Cápsulas', precioPublico: 40000, precioComunidad: 35000, precioPrivado: 37500, bestseller: true, tags: ['enzimas', 'probióticos', 'digestión', 'premium'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-008', name: 'Preggo', category: 'Cápsulas', precioPublico: 30000, precioComunidad: 25000, precioPrivado: 27500, bestseller: false, tags: ['embarazo', 'prenatal', 'ácido fólico'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-009', name: 'Lions Mane', category: 'Cápsulas', precioPublico: 30650, precioComunidad: 25650, precioPrivado: 28150, bestseller: false, tags: ['lions mane', 'hongo', 'neuronas'], image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-010', name: 'Oil of Oregano', category: 'Cápsulas', precioPublico: 35000, precioComunidad: 30000, precioPrivado: 32500, bestseller: false, tags: ['orégano', 'antibacteriano', 'inmunidad'], image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-011', name: 'Hair Growth', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['cabello', 'crecimiento', 'biotina'], image: 'https://images.unsplash.com/photo-1596360644544-02e218704bf6?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-012', name: 'URO', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['urinario', 'cranberry', 'mujer'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-013', name: 'Meno', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['menopausia', 'hormonas', 'mujer'], image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-014', name: '60 Billion Probiotic', category: 'Cápsulas', precioPublico: 25000, precioComunidad: 20000, precioPrivado: 22500, bestseller: true, tags: ['probióticos', '60 billones', 'digestión'], image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-015', name: 'Turkesterone', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['turkesterone', 'músculo', 'fitness'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  { sku: 'VC-CAP-016', name: 'Nitric Oxide', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['óxido nítrico', 'circulación', 'fitness'], image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop' },
  // ── CREMAS (3) ──
  { sku: 'VC-CRE-001', name: 'Evil Goods', category: 'Cremas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: true, tags: ['crema', 'skincare', 'natural'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=400&h=400&fit=crop' },
  { sku: 'VC-CRE-002', name: 'Tallow Honey', category: 'Cremas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['sebo', 'miel', 'hidratante', 'natural'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=400&h=400&fit=crop' },
  { sku: 'VC-CRE-003', name: 'URO Desodorante', category: 'Cremas', precioPublico: 13500, precioComunidad: 13500, precioPrivado: 13500, bestseller: false, tags: ['desodorante', 'natural', 'uro'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=400&h=400&fit=crop' },
  // ── LÍNEA MASCOTAS (3) ──
  { sku: 'VC-PET-001', name: '3 en 1 Mascotas', category: 'Línea Mascotas', precioPublico: 27900, precioComunidad: 22900, precioPrivado: 25900, bestseller: true, tags: ['mascotas', 'perros', 'gatos', '3 en 1'], image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop' },
  { sku: 'VC-PET-002', name: 'Pet Omega', category: 'Línea Mascotas', precioPublico: 27900, precioComunidad: 22900, precioPrivado: 25900, bestseller: false, tags: ['mascotas', 'omega', 'pelo', 'articulaciones'], image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop' },
  { sku: 'VC-PET-003', name: 'Pet Hemp', category: 'Línea Mascotas', precioPublico: 27900, precioComunidad: 22900, precioPrivado: 25900, bestseller: false, tags: ['mascotas', 'hemp', 'cáñamo', 'ansiedad'], image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop' },
]

// ── Hash simple para seed (no usar en producción — usar hashPassword de lib/security) ──
// En producción el auth usa PBKDF2-SHA512, pero para seed usamos bcrypt-like placeholder
// que NextAuth credentials provider verificará con verifyPassword()
async function simpleHash(password: string): Promise<string> {
  // Formato compatible con lib/security/password.ts
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-512' },
    keyMaterial,
    512
  )
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2$100000$${saltHex}$${hashHex}`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  console.log('🌱 Seeding Vitalcom database...\n')

  // ── 1. Crear productos ──
  console.log('📦 Creando productos...')
  for (const item of CATALOG) {
    await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        precioPublico: item.precioPublico,
        precioComunidad: item.precioComunidad,
        precioPrivado: item.precioPrivado,
        bestseller: item.bestseller,
        tags: item.tags,
        images: (item as any).image ? [(item as any).image] : [],
        category: item.category,
      },
      create: {
        sku: item.sku,
        name: item.name,
        slug: slugify(item.name) + '-' + item.sku.toLowerCase(),
        category: item.category,
        tags: item.tags,
        precioPublico: item.precioPublico,
        precioComunidad: item.precioComunidad,
        precioPrivado: item.precioPrivado,
        active: true,
        bestseller: item.bestseller,
        images: (item as any).image ? [(item as any).image] : [],
      },
    })
  }
  console.log(`  ✅ ${CATALOG.length} productos creados\n`)

  // ── 2. Crear stock para Colombia ──
  console.log('📊 Creando stock Colombia...')
  const products = await prisma.product.findMany()
  for (const product of products) {
    await prisma.stock.upsert({
      where: { productId_country: { productId: product.id, country: 'CO' } },
      update: { quantity: 100 },
      create: { productId: product.id, country: 'CO', quantity: 100, warehouse: 'Bogotá Central' },
    })
  }
  console.log(`  ✅ Stock creado para ${products.length} productos en CO\n`)

  // ── 3. Crear usuario CEO ──
  console.log('👤 Creando usuarios...')
  const ceoPassword = await simpleHash('Vitalcom2026!')
  await prisma.user.upsert({
    where: { email: 'ceo@vitalcom.co' },
    update: {},
    create: {
      email: 'ceo@vitalcom.co',
      name: 'CEO Vitalcom',
      password: ceoPassword,
      role: 'SUPERADMIN',
      country: 'CO',
      area: 'DIRECCION',
      active: true,
      verified: true,
      level: 9,
      points: 99999,
    },
  })
  console.log('  ✅ CEO: ceo@vitalcom.co')

  // ── 4. Crear empleados (1 por área) ──
  const areas = [
    { area: 'MARKETING' as const, name: 'Ana Marketing', email: 'marketing@vitalcom.co' },
    { area: 'COMERCIAL' as const, name: 'Carlos Comercial', email: 'comercial@vitalcom.co' },
    { area: 'ADMINISTRATIVA' as const, name: 'Diana Administrativa', email: 'admin@vitalcom.co' },
    { area: 'LOGISTICA' as const, name: 'Luis Logística', email: 'logistica@vitalcom.co' },
    { area: 'CONTABILIDAD' as const, name: 'Sandra Contabilidad', email: 'contabilidad@vitalcom.co' },
  ]

  const staffPassword = await simpleHash('Staff2026!')
  for (const emp of areas) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        name: emp.name,
        password: staffPassword,
        role: 'EMPLOYEE',
        country: 'CO',
        area: emp.area,
        active: true,
        verified: true,
      },
    })
    console.log(`  ✅ ${emp.area}: ${emp.email}`)
  }

  // ── 5. Crear dropshippers de prueba ──
  const dropPassword = await simpleHash('Drop2026!')
  const dropshippers = [
    { name: 'María Restrepo', email: 'maria@vitalcommers.com', level: 4, points: 2240 },
    { name: 'Andrés Gómez', email: 'andres@vitalcommers.com', level: 5, points: 3800 },
    { name: 'Carlos Duarte', email: 'carlos@vitalcommers.com', level: 6, points: 7500 },
  ]

  for (const drop of dropshippers) {
    await prisma.user.upsert({
      where: { email: drop.email },
      update: {},
      create: {
        email: drop.email,
        name: drop.name,
        password: dropPassword,
        role: 'DROPSHIPPER',
        country: 'CO',
        active: true,
        verified: true,
        level: drop.level,
        points: drop.points,
      },
    })
    console.log(`  ✅ DROPSHIPPER: ${drop.email} (Nivel ${drop.level})`)
  }

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📋 Credenciales de prueba:')
  console.log('  CEO:         ceo@vitalcom.co          / Vitalcom2026!')
  console.log('  Staff:       marketing@vitalcom.co     / Staff2026!')
  console.log('  Dropshipper: maria@vitalcommers.com    / Drop2026!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
