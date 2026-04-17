// ── Seed Vitalcom — Carga desde Excel real ───────────────
// Lee las bases de inventario + precios de docs/
// Ejecutar: npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Hash compatible con lib/security/password.ts ──
async function simpleHash(password: string): Promise<string> {
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

// Mapeo de categorías del Excel → categorías de la app
const CAT_MAP: Record<string, string> = {
  'Suplementos Nutricionales': 'Suplementos Nutricionales',
  'Extractos Naturales': 'Extractos Naturales',
  'Control de Peso / Detox': 'Control de Peso',
  'Salud Femenina': 'Salud Femenina',
  'Salud Masculina': 'Salud Masculina',
  'Suplementos Deportivos': 'Suplementos Deportivos',
  'Belleza & Cuidado Personal': 'Belleza & Cuidado',
  'Mascotas': 'Mascotas',
  'Infantil': 'Infantil',
}

const PRES_MAP: Record<string, string> = {
  'Capsulas': 'Cápsulas',
  'Liquido': 'Líquidos',
  'Polvos': 'Polvos',
  'Gummies': 'Gummis',
  'Cremas': 'Cremas',
  'Jalea': 'Jalea',
  'Accesorios': 'Accesorios',
}

async function main() {
  console.log('🌱 Seeding Vitalcom desde bases Excel...\n')

  // ── Cargar Excel con xlsx ──
  const XLSX = require('xlsx')

  // Base de inventario
  const invWb = XLSX.readFile('docs/base de productos vitalcom colombia.xlsx')
  const invData = XLSX.utils.sheet_to_json(invWb.Sheets['Inv LT']) as any[]

  // Base de precios
  const priceWb = XLSX.readFile('docs/lista de precios vitalcom.xlsx')
  const priceRows = XLSX.utils.sheet_to_json(priceWb.Sheets['PRECIOS ACTUALIZADO'], { header: 1 }) as any[][]

  // ── Extraer precios en un mapa por nombre normalizado ──
  let currentCat = ''
  const preciosMap = new Map<string, any>()

  for (let i = 8; i < priceRows.length; i++) {
    const row = priceRows[i]
    if (!row || row.length < 2) continue
    if (row[0]) currentCat = String(row[0])
    if (row[1] && typeof row[2] === 'number') {
      const nombre = String(row[1]).trim().toUpperCase()
      preciosMap.set(nombre, {
        costo: row[2] || 0,
        mayorProv: row[4] || 0,
        mayorContado: row[5] || 0,
        mayorCredito: row[6] || 0,
        maquilla: row[7] || 0,
        comunidad: row[8] || 0,
        privado: row[10] || 0,
        publico: row[12] || 0,
      })
    }
    // Productos privados (maquilas)
    if (row[15] && typeof row[17] === 'number') {
      const nombre = String(row[15]).trim().toUpperCase()
      preciosMap.set(nombre, {
        costo: row[17] || 0,
        mayorProv: 0,
        mayorContado: row[18] || 0,
        mayorCredito: row[19] || 0,
        maquilla: row[20] || 0,
        comunidad: row[21] || 0,
        privado: row[23] || 0,
        publico: row[25] || 0,
        pertenece: row[16] ? String(row[16]).trim() : undefined,
        esMaquila: true,
      })
    }
  }

  console.log(`📊 ${preciosMap.size} precios cargados del Excel`)

  // ── Función para buscar precio por nombre ──
  function findPrice(nombre: string): any {
    const n = nombre.toUpperCase()
    // Match exacto
    if (preciosMap.has(n)) return preciosMap.get(n)
    // Match parcial: buscar por palabras clave
    const words = n.split(/\s+/).filter(w => w.length > 3)
    for (const [key, val] of preciosMap.entries()) {
      const matchCount = words.filter(w => key.includes(w)).length
      if (matchCount >= 2) return val
    }
    return null
  }

  // ── 1. Limpiar productos existentes ──
  console.log('🗑️  Limpiando productos existentes...')
  await prisma.productSync.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.product.deleteMany()
  console.log('  ✅ Limpieza completada\n')

  // ── 2. Cargar productos desde inventario ──
  console.log('📦 Creando productos desde inventario...')
  const invReal = invData.filter((r: any) => r['Categoria'] !== 'Packaging / Accesorios')

  let conPrecio = 0
  let sinPrecio = 0
  const usedSlugs = new Set<string>()

  for (const item of invReal) {
    const nombre = String(item['NOMBRE_PRDUCTO']).trim()
    const sku = String(item['SKU']).trim()
    const categoria = CAT_MAP[item['Categoria']] || item['Categoria']
    const presentacion = PRES_MAP[item['Presentación']] || item['Presentación']
    const marca = item['Marca'] ? String(item['Marca']).trim() : null
    const contenido = item['Contenido'] ? String(item['Contenido']).trim() : null
    const sabor = item['Sabor'] ? String(item['Sabor']).trim() : null
    const bodega = item['Bodega'] ? String(item['Bodega']).trim() : null
    const codigo = item['CODIGO'] ? String(item['CODIGO']).trim() : null

    // Buscar precio
    const precio = findPrice(nombre)

    // Generar slug único
    let baseSlug = slugify(nombre)
    if (usedSlugs.has(baseSlug)) {
      baseSlug = baseSlug + '-' + slugify(sku.slice(-8))
    }
    usedSlugs.add(baseSlug)

    // Tags desde categoría + presentación + sabor + marca
    const tags: string[] = []
    if (categoria) tags.push(categoria.toLowerCase())
    if (presentacion) tags.push(presentacion.toLowerCase())
    if (sabor && sabor !== 'Natural') tags.push(sabor.toLowerCase())
    if (marca) tags.push(marca.toLowerCase())

    await prisma.product.create({
      data: {
        sku,
        name: nombre,
        slug: baseSlug,
        category: categoria,
        subcategory: presentacion,
        tags,
        images: [],
        precioPublico: precio?.publico || 0,
        precioComunidad: precio?.comunidad || 0,
        precioPrivado: precio?.privado || 0,
        precioCosto: precio?.costo || null,
        precioMayorProv: precio?.mayorProv || null,
        precioMayorContado: precio?.mayorContado || null,
        precioMayorCredito: precio?.mayorCredito || null,
        precioMaquilla: precio?.maquilla || null,
        marca,
        contenido,
        presentacion,
        sabor,
        bodega,
        codigoInterno: codigo,
        pertenece: precio?.pertenece || null,
        active: true,
        bestseller: false,
      },
    })

    if (precio) conPrecio++
    else sinPrecio++
  }

  // ── 3. Cargar productos maquilas (privados) que no están en inventario ──
  console.log('\n🏭 Creando productos maquilas...')
  let maquilasCreadas = 0

  for (const [nombre, precio] of preciosMap.entries()) {
    if (!precio.esMaquila) continue
    // Verificar si ya se creó desde el inventario
    const exists = await prisma.product.findFirst({ where: { name: { contains: nombre.slice(0, 10), mode: 'insensitive' } } })
    if (exists) continue

    const sku = `MQ-${String(maquilasCreadas + 1).padStart(3, '0')}`
    let baseSlug = slugify(nombre)
    if (usedSlugs.has(baseSlug)) baseSlug = baseSlug + '-mq'
    usedSlugs.add(baseSlug)

    await prisma.product.create({
      data: {
        sku,
        name: nombre,
        slug: baseSlug,
        category: 'Maquilas',
        tags: ['maquila', 'privado'],
        images: [],
        precioPublico: precio.publico || 0,
        precioComunidad: precio.comunidad || 0,
        precioPrivado: precio.privado || 0,
        precioCosto: precio.costo || null,
        precioMayorContado: precio.mayorContado || null,
        precioMayorCredito: precio.mayorCredito || null,
        precioMaquilla: precio.maquilla || null,
        pertenece: precio.pertenece || null,
        active: true,
        bestseller: false,
      },
    })
    maquilasCreadas++
  }

  const totalProducts = await prisma.product.count()
  console.log(`  ✅ ${invReal.length} productos del inventario (${conPrecio} con precio, ${sinPrecio} sin precio)`)
  console.log(`  ✅ ${maquilasCreadas} maquilas creadas`)
  console.log(`  📊 Total: ${totalProducts} productos en BD\n`)

  // ── 4. Crear stock por bodega ──
  console.log('📊 Creando stock...')
  const products = await prisma.product.findMany({ select: { id: true, bodega: true } })

  for (const product of products) {
    await prisma.stock.create({
      data: {
        productId: product.id,
        country: 'CO',
        quantity: 100,
        warehouse: product.bodega || 'VITALCOM',
      },
    })
  }
  console.log(`  ✅ Stock creado para ${products.length} productos en CO\n`)

  // ── 5. Crear usuarios ──
  console.log('👤 Creando usuarios...')
  const ceoPassword = await simpleHash('Vitalcom2026!')
  await prisma.user.upsert({
    where: { email: 'ceo@vitalcom.co' },
    update: {},
    create: {
      email: 'ceo@vitalcom.co', name: 'CEO Vitalcom', password: ceoPassword,
      role: 'SUPERADMIN', country: 'CO', area: 'DIRECCION',
      active: true, verified: true, level: 9, points: 99999,
    },
  })
  console.log('  ✅ CEO: ceo@vitalcom.co')

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
        email: emp.email, name: emp.name, password: staffPassword,
        role: 'EMPLOYEE', country: 'CO', area: emp.area,
        active: true, verified: true,
      },
    })
    console.log(`  ✅ ${emp.area}: ${emp.email}`)
  }

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
        email: drop.email, name: drop.name, password: dropPassword,
        role: 'DROPSHIPPER', country: 'CO',
        active: true, verified: true, level: drop.level, points: drop.points,
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
