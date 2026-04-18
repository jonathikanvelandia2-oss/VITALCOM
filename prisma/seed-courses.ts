// ── Seed de cursos Vitalcom Academy ────────────────────
// Currículum inicial enfocado en vender productos Vitalcom rentablemente.
// Ejecutar: npx tsx prisma/seed-courses.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Lesson = {
  id: string
  title: string
  duration: string
  content: string
  videoUrl?: string
}

type Module = {
  id: string
  title: string
  description?: string
  lessons: Lesson[]
}

const COURSES = [
  {
    title: 'Fundamentos del Dropshipping con Vitalcom',
    slug: 'fundamentos-dropshipping-vitalcom',
    description:
      'Arranca tu primer negocio de bienestar con productos Vitalcom. Aprende el modelo completo: catálogo, tienda, pedidos y tu primer margen.',
    level: 'beginner',
    cover: 'linear-gradient(135deg, #A8FF00 0%, #7FB800 100%)',
    order: 1,
    published: true,
    modules: [
      {
        id: 'm1',
        title: 'Bienvenida a Vitalcom',
        description: 'Entiende el modelo y por qué vender productos de bienestar.',
        lessons: [
          {
            id: 'm1-l1',
            title: '¿Qué es Vitalcom y cómo ganamos juntos?',
            duration: '4 min',
            content: `# Bienvenido a la comunidad Vitalcom

**Vitalcom** es una empresa de proveeduría de productos de bienestar con presencia en Colombia, Ecuador, Guatemala y Chile. Trabajamos con una comunidad de +1.500 dropshippers que venden productos Vitalcom bajo su propia marca.

## Cómo ganamos juntos

- **Tú** creas tu tienda, traes los clientes y defines tu margen.
- **Nosotros** te damos el producto, el stock multi-país, el fulfillment y la academia.
- Crecemos juntos: mientras más vendas tú, más volumen movemos nosotros.

## Qué vas a aprender en esta academia

1. Cómo armar tu catálogo con productos Vitalcom ganadores
2. Cómo calcular precios rentables con nuestra calculadora
3. Cómo gestionar pedidos, stock y pagos
4. Cómo escalar con ads y automatizaciones

Vamos.`,
          },
          {
            id: 'm1-l2',
            title: 'El modelo de dropshipping de bienestar',
            duration: '6 min',
            content: `# Dropshipping de bienestar: por qué funciona

El bienestar es uno de los nichos más grandes del e-commerce en LATAM — **crece 18% año tras año** según Statista. Vitalcom está posicionada con:

- 202 productos en catálogo (suplementos, control de peso, belleza natural, mascotas, infantil)
- Stock real en 4 países
- Fulfillment en menos de 48h en capitales

## Tu rol como dropshipper

Tú no compras inventario. Tú:
1. Eliges los productos que vas a vender (recomendamos empezar con 3-5 ganadores)
2. Creas una tienda (Shopify, landing, redes)
3. Atraes tráfico (ads, contenido, referidos)
4. Cuando llega un pedido, nos lo pasas y nosotros despachamos

## Ejemplo real

Un dropshipper promedio de Vitalcom nivel 4 vende entre **30 y 80 pedidos mensuales** con un margen neto del 28-35% según tu país y precio de venta.`,
          },
          {
            id: 'm1-l3',
            title: 'Tu primera semana: qué hacer',
            duration: '5 min',
            content: `# Plan de primeros 7 días

## Día 1-2: Explora el catálogo
Ve a [Catálogo Vitalcom](/herramientas/catalogo) y revisa los productos con flag "Ganador comunidad" en [Productos Ganadores](/mi-pyg). Esos son los que mejor se venden en este momento.

## Día 3: Elige tu primer producto
Criterios para tu primer producto:
- Margen sugerido mayor a 30%
- Stock disponible en tu país
- Que esté en top-10 de la comunidad

## Día 4-5: Calcula precios
Usa la [Calculadora](/herramientas/calculadora) para definir tu precio de venta público con envío incluido.

## Día 6-7: Lanza
Crea una landing simple o publica en tus redes. Registra tu primer pedido desde [Mis Pedidos](/pedidos).

**Tu meta esta semana:** 1 pedido real. No más.`,
          },
        ],
      },
      {
        id: 'm2',
        title: 'Elegir productos ganadores',
        description: 'Cómo identificar qué productos venden y cuáles no.',
        lessons: [
          {
            id: 'm2-l1',
            title: 'Criterios de un producto ganador',
            duration: '7 min',
            content: `# Qué hace a un producto "ganador"

Un producto ganador en Vitalcom combina 4 señales:

1. **Volumen real en la comunidad** — que otros dropshippers ya lo están vendiendo
2. **Adopción creciente** — flag "Trending" en los últimos 7 días
3. **Margen saludable** — sugerido mayor a 28%
4. **Disponibilidad** — stock en tu país

## Dónde ver esta data

En tu panel de [Productos Ganadores](/mi-pyg) el ranking se calcula automáticamente con datos reales de la comunidad (respetando privacidad de cada dropshipper).

## Trampa común: elegir por emoción

No elijas el producto "que te gusta a ti". Elige el que **la data dice que vende**. El emprendedor promedio tarda 3 meses en aprender esta lección. Apréndela hoy.`,
          },
          {
            id: 'm2-l2',
            title: 'Cómo armar tu mix inicial de 3-5 productos',
            duration: '6 min',
            content: `# El mix perfecto para arrancar

Cuando arrancas, **no vendas 50 productos**. Vende entre 3 y 5, y domínalos.

## Estructura recomendada

- **1 producto "ancla"** — tu bestseller, el que más anuncias
- **2 productos "complemento"** — se venden juntos con el ancla
- **1 producto "premium"** — para upsell y más margen
- **1 producto "oferta"** — para atraer tráfico frío

## Ejemplo práctico

Si tu ancla es un suplemento de control de peso:
- Complementos: detox natural + proteína vegetal
- Premium: pack mensual del suplemento
- Oferta: muestra del detox`,
          },
        ],
      },
    ] as Module[],
  },

  {
    title: 'Marketing para Productos de Bienestar',
    slug: 'marketing-bienestar-vitalcom',
    description:
      'Aprende a vender productos Vitalcom con ads, contenido y copy que convierte. Plantillas listas para Meta, TikTok y WhatsApp.',
    level: 'intermediate',
    cover: 'linear-gradient(135deg, #C6FF3C 0%, #4A6B00 100%)',
    order: 2,
    published: true,
    modules: [
      {
        id: 'm1',
        title: 'Copywriting que vende bienestar',
        lessons: [
          {
            id: 'm1-l1',
            title: 'La fórmula PAS aplicada a Vitalcom',
            duration: '8 min',
            content: `# PAS: Problema - Agitación - Solución

El 80% de tus copy deben seguir esta fórmula.

## Ejemplo real con un producto Vitalcom

**Producto:** Colágeno hidrolizado + biotina

**Problema:** "¿Cansada de ver tu piel apagada y tu cabello quebradizo?"
**Agitación:** "El tiempo pasa y los cuidados de siempre ya no funcionan. Cada día te ves en el espejo y sientes que algo falta."
**Solución:** "Colágeno hidrolizado con biotina Vitalcom — la fórmula que ya usan 3.200 mujeres en LATAM para recuperar brillo desde adentro."

## Claves del copy de bienestar

- Nunca prometas resultados específicos ("bajarás 10kg")
- Siempre enfócate en el cambio emocional
- Usa prueba social ("3.200 mujeres", "más de 10.000 frascos vendidos")`,
          },
          {
            id: 'm1-l2',
            title: 'Títulos que paran el scroll',
            duration: '5 min',
            content: `# Los 7 títulos probados para productos Vitalcom

1. **Pregunta incómoda**: "¿Tu rutina de cuidado ya no te funciona?"
2. **Lista numerada**: "3 razones por las que tu energía está baja"
3. **Contraste**: "Olvídate de las dietas. Esto sí funciona."
4. **Urgencia suave**: "Si tienes más de 30, necesitas leer esto"
5. **Testimonial directo**: "Llevo 3 meses y no puedo creer el cambio"
6. **Curiosidad**: "El ingrediente que cambió mi piel en 21 días"
7. **Específico**: "La fórmula de 4 activos que llevan recomendando dermatólogos"

**Regla de oro:** prueba mínimo 3 títulos antes de decidir cuál escalar.`,
          },
        ],
      },
      {
        id: 'm2',
        title: 'Ads en Meta y TikTok',
        lessons: [
          {
            id: 'm2-l1',
            title: 'Tu primer test de ads con $20/día',
            duration: '10 min',
            content: `# Cómo testear un producto con presupuesto mínimo

## Setup básico

- **Presupuesto:** $20/día por 3 días = $60 total
- **Objetivo:** generar ventas o leads calificados
- **Audiencia:** advantage+ (la IA de Meta hace el trabajo)

## Lo que debes ver en esos 3 días

- **CPM menor a $8** — tu contenido es relevante
- **CTR mayor a 1%** — tu anuncio atrae
- **Al menos 1 venta** — el funnel funciona

## Si no hay ventas en $60

- Cambia el creativo primero (no la audiencia)
- Si 3 creativos diferentes no funcionan → cambia de producto

En la Fase V2 vamos a integrar Meta directo dentro de Vitalcom — pronto no vas a necesitar Business Manager separado.`,
          },
        ],
      },
    ] as Module[],
  },

  {
    title: 'Escalar con Datos: Usa tu P&G como una CEO',
    slug: 'escalar-datos-pyg-vitalcom',
    description:
      'Nivel avanzado: lee tu Mi P&G, identifica fugas de rentabilidad y escala las campañas que sí dan plata. Con el Mentor Financiero IA como copiloto.',
    level: 'advanced',
    cover: 'linear-gradient(135deg, #DFFF80 0%, #A8FF00 100%)',
    order: 3,
    published: true,
    modules: [
      {
        id: 'm1',
        title: 'Leer tu P&G sin ser contador',
        lessons: [
          {
            id: 'm1-l1',
            title: 'Las 4 métricas que importan',
            duration: '7 min',
            content: `# Las únicas 4 métricas que importan al principio

En [Mi P&G](/mi-pyg) ves decenas de números. Ignora la mayoría. Enfócate en 4:

## 1. Ganancia neta
Es lo que queda en tu bolsillo después de todo: producto, envío, ads, comisiones.

## 2. Margen neto %
Ganancia neta / Ingresos. Saludable: mayor a 25%. Excelente: mayor a 35%.

## 3. CPA (costo de adquisición)
Cuánto te cuesta conseguir 1 venta con ads. Saludable: menor al 40% del precio de venta.

## 4. Ticket promedio
Cuánto gastan tus clientes en promedio. Súbelo con bundles, upsells, envío gratis desde X monto.

**El resto de métricas son ruido hasta que domines estas 4.**`,
          },
          {
            id: 'm1-l2',
            title: 'Cómo el MentorFinanciero te ayuda',
            duration: '5 min',
            content: `# Tu agente IA de finanzas

El [MentorFinanciero](/mi-pyg) analiza tu P&G real cada vez que lo consultas y te entrega insights específicos, no genéricos.

## Qué te dice

- "Tu margen neto está en 18%, por debajo del benchmark LATAM (28%). Revisa tu costo de envío o sube tu precio 8%."
- "Producto X genera 40% de tus ingresos pero solo 12% de tu ganancia. Saca margen o reemplázalo."
- "Tu ticket promedio bajó 15% este mes. Considera un bundle de 2x1."

## Cómo usarlo bien

1. Consúltalo semanalmente
2. Aplica **1 sola acción** por semana
3. Mide en la siguiente consulta si mejoró

No pidas 10 consejos y no hagas ninguno. Pide 3 y aplica 1.`,
          },
        ],
      },
    ] as Module[],
  },
]

async function main() {
  console.log('📚 Seed de cursos Vitalcom Academy...\n')

  // Limpiar cursos previos (no borra CourseProgress para no perder el progreso de los dropshippers)
  const deleted = await prisma.course.deleteMany({
    where: { slug: { in: COURSES.map((c) => c.slug) } },
  })
  if (deleted.count > 0) console.log(`🗑️  ${deleted.count} cursos previos removidos\n`)

  for (const course of COURSES) {
    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
    await prisma.course.create({
      data: {
        title: course.title,
        slug: course.slug,
        description: course.description,
        cover: course.cover,
        level: course.level,
        modules: course.modules as any,
        published: course.published,
        order: course.order,
      },
    })
    console.log(`  ✅ ${course.title} — ${course.modules.length} módulos · ${totalLessons} lecciones`)
  }

  console.log(`\n🎉 ${COURSES.length} cursos seedeados.`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
