// ── Seed Vitalcom — Datos iniciales de producción ────────
// Ejecutar: npx prisma db seed
// Crea: productos reales, stock CO, CEO, empleados, dropshippers test

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Catálogo real (importado directamente para evitar dependencias de path alias) ──
// Estos son los productos reales de Vitalcom Colombia con precios oficiales
const CATALOG = [
  // POLVOS
  { sku: 'VC-POL-001', name: 'Bayas de Goji', category: 'Polvos', precioPublico: 24900, precioComunidad: 18400, precioPrivado: 22900, bestseller: false, tags: ['antioxidante', 'energía', 'inmunidad'] },
  { sku: 'VC-POL-002', name: 'Calostro Bovino', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: true, tags: ['inmunidad', 'digestión', 'proteína'] },
  { sku: 'VC-POL-003', name: 'Citrato de Magnesio', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['magnesio', 'sueño', 'estrés'] },
  { sku: 'VC-POL-004', name: 'Colágeno Marino', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: true, tags: ['colágeno', 'piel', 'belleza'] },
  { sku: 'VC-POL-005', name: 'Match Maca', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['maca', 'energía', 'hormonas'] },
  { sku: 'VC-POL-006', name: 'Ossteos D', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['huesos', 'vitamina d', 'calcio'] },
  { sku: 'VC-POL-007', name: 'Deluxe Collagen', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: true, tags: ['colágeno', 'premium', 'piel'] },
  { sku: 'VC-POL-008', name: 'T-Green', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['té verde', 'metabolismo'] },
  { sku: 'VC-POL-009', name: 'Multicollagen', category: 'Polvos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['colágeno', 'articulaciones'] },
  { sku: 'VC-POL-010', name: 'Yerba Magic', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['yerba mate', 'energía'] },
  { sku: 'VC-POL-011', name: 'Bloom', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['belleza', 'piel'] },
  { sku: 'VC-POL-012', name: 'Ryze', category: 'Polvos', precioPublico: 32400, precioComunidad: 29900, precioPrivado: 31150, bestseller: true, tags: ['hongos', 'café', 'concentración'] },
  { sku: 'VC-POL-013', name: 'Dayaral', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: false, tags: ['premium', 'bienestar'] },
  { sku: 'VC-POL-014', name: '3 Calostros', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: false, tags: ['calostro', 'inmunidad'] },
  { sku: 'VC-POL-015', name: '12 Colágenos', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: true, tags: ['colágeno', '12 tipos', 'premium'] },
  { sku: 'VC-POL-016', name: 'Natu Children', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: false, tags: ['niños', 'vitaminas'] },
  { sku: 'VC-POL-017', name: 'Wellfless', category: 'Polvos', precioPublico: 39900, precioComunidad: 35400, precioPrivado: 37900, bestseller: false, tags: ['bienestar', 'integral'] },
  { sku: 'VC-POL-018', name: 'Creatine for Women', category: 'Polvos', precioPublico: 28400, precioComunidad: 23900, precioPrivado: 26400, bestseller: false, tags: ['creatina', 'mujer', 'fitness'] },
  { sku: 'VC-POL-019', name: 'Pump It', category: 'Polvos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['pre-entreno', 'energía'] },
  { sku: 'VC-POL-020', name: 'Peach Perfect', category: 'Polvos', precioPublico: 29900, precioComunidad: 26400, precioPrivado: 28900, bestseller: false, tags: ['durazno', 'colágeno'] },
  // LÍQUIDOS
  { sku: 'VC-LIQ-001', name: 'Colágeno Marino Líquido', category: 'Líquidos', precioPublico: 23900, precioComunidad: 18400, precioPrivado: 21900, bestseller: true, tags: ['colágeno', 'líquido', 'piel'] },
  { sku: 'VC-LIQ-002', name: 'Clorofila Líquida', category: 'Líquidos', precioPublico: 23900, precioComunidad: 18400, precioPrivado: 21900, bestseller: false, tags: ['clorofila', 'desintoxicación'] },
  { sku: 'VC-LIQ-003', name: 'Resveratrol', category: 'Líquidos', precioPublico: 23900, precioComunidad: 18400, precioPrivado: 21900, bestseller: false, tags: ['antioxidante', 'anti-edad'] },
  { sku: 'VC-LIQ-004', name: 'Multimaxx Fresa', category: 'Líquidos', precioPublico: 23900, precioComunidad: 18400, precioPrivado: 21900, bestseller: false, tags: ['multivitamínico', 'fresa'] },
  { sku: 'VC-LIQ-005', name: 'Multimaxx Mango', category: 'Líquidos', precioPublico: 23900, precioComunidad: 18400, precioPrivado: 21900, bestseller: false, tags: ['multivitamínico', 'mango'] },
  { sku: 'VC-LIQ-006', name: 'Bichota', category: 'Líquidos', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: true, tags: ['belleza', 'cabello', 'uñas'] },
  { sku: 'VC-LIQ-007', name: 'Mary Ruths Multivitamínico', category: 'Líquidos', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['multivitamínico', 'premium'] },
  { sku: 'VC-LIQ-008', name: 'L-Carnitine', category: 'Líquidos', precioPublico: 25900, precioComunidad: 21400, precioPrivado: 23900, bestseller: false, tags: ['carnitina', 'quemagrasas'] },
  // GUMMIS
  { sku: 'VC-GUM-001', name: 'Gummis Vitamina C', category: 'Gummis', precioPublico: 22900, precioComunidad: 18400, precioPrivado: 20900, bestseller: true, tags: ['vitamina c', 'inmunidad'] },
  { sku: 'VC-GUM-002', name: 'Gummis Probióticos', category: 'Gummis', precioPublico: 24900, precioComunidad: 20400, precioPrivado: 22900, bestseller: false, tags: ['probióticos', 'digestión'] },
  { sku: 'VC-GUM-003', name: 'Gummis Apple Cider Vinegar', category: 'Gummis', precioPublico: 22900, precioComunidad: 18400, precioPrivado: 20900, bestseller: false, tags: ['vinagre manzana', 'digestión'] },
  { sku: 'VC-GUM-004', name: 'Gummis Magnesio', category: 'Gummis', precioPublico: 24900, precioComunidad: 20400, precioPrivado: 22900, bestseller: false, tags: ['magnesio', 'relajación'] },
  { sku: 'VC-GUM-005', name: 'Gummis Borojó y Guaraná', category: 'Gummis', precioPublico: 22900, precioComunidad: 18400, precioPrivado: 20900, bestseller: false, tags: ['energía', 'borojó'] },
  // CÁPSULAS
  { sku: 'VC-CAP-001', name: 'Ashwagandha', category: 'Cápsulas', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: true, tags: ['estrés', 'adaptógeno', 'sueño'] },
  { sku: 'VC-CAP-002', name: 'Melena de León', category: 'Cápsulas', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['concentración', 'hongos'] },
  { sku: 'VC-CAP-003', name: 'Omega 3 Fish Oil', category: 'Cápsulas', precioPublico: 25900, precioComunidad: 21400, precioPrivado: 23900, bestseller: false, tags: ['omega 3', 'corazón'] },
  { sku: 'VC-CAP-004', name: 'Probióticos 40 Billion', category: 'Cápsulas', precioPublico: 29900, precioComunidad: 25400, precioPrivado: 27900, bestseller: false, tags: ['probióticos', 'digestión'] },
  // CREMAS
  { sku: 'VC-CRE-001', name: 'Crema Facial Colágeno', category: 'Cremas', precioPublico: 34900, precioComunidad: 29400, precioPrivado: 32400, bestseller: false, tags: ['colágeno', 'facial', 'antiarrugas'] },
  { sku: 'VC-CRE-002', name: 'Crema Corporal Reductora', category: 'Cremas', precioPublico: 32900, precioComunidad: 27400, precioPrivado: 30400, bestseller: false, tags: ['reductora', 'corporal'] },
  // LÍNEA MASCOTAS
  { sku: 'VC-PET-001', name: 'Colágeno para Mascotas', category: 'Línea Mascotas', precioPublico: 27900, precioComunidad: 23400, precioPrivado: 25900, bestseller: false, tags: ['mascotas', 'colágeno', 'articulaciones'] },
  { sku: 'VC-PET-002', name: 'Multivitamínico Canino', category: 'Línea Mascotas', precioPublico: 25900, precioComunidad: 21400, precioPrivado: 23900, bestseller: false, tags: ['mascotas', 'vitaminas', 'perros'] },
  { sku: 'VC-PET-003', name: 'Probióticos para Mascotas', category: 'Línea Mascotas', precioPublico: 24900, precioComunidad: 20400, precioPrivado: 22900, bestseller: false, tags: ['mascotas', 'digestión'] },
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
      },
      create: {
        sku: item.sku,
        name: item.name,
        slug: slugify(item.name),
        category: item.category,
        tags: item.tags,
        precioPublico: item.precioPublico,
        precioComunidad: item.precioComunidad,
        precioPrivado: item.precioPrivado,
        active: true,
        bestseller: item.bestseller,
        images: [],
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
