// ── Seed V12 — Workflow Templates + Resources + Documents
// Ejecutar: npx tsx prisma/seed-v12.ts
// Idempotente: usa upserts por slug/title para no duplicar.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Workflow Templates (6 oficiales) ─────────────────
const WORKFLOW_TEMPLATES = [
  {
    slug: 'confirm-order',
    name: 'Confirmar pedido',
    emoji: '📦',
    description:
      'Envía confirmación automática por WhatsApp cuando recibes un pedido nuevo',
    category: 'pedidos',
    target: 'Nuevos pedidos',
    impact: '↑ 35% satisfacción',
    steps: [
      { type: 'auto', text: 'Detectar nuevo pedido en Dropi' },
      { type: 'auto', text: 'Enviar mensaje de confirmación por WhatsApp' },
      { type: 'auto', text: 'Compartir link de seguimiento' },
      { type: 'manual', text: 'Verificar datos de envío si hay dudas' },
    ],
  },
  {
    slug: 'cart-recovery',
    name: 'Recuperar carrito',
    emoji: '🛒',
    description:
      'Recontacta clientes que preguntaron pero no compraron. Espera 2 horas y envía recordatorio',
    category: 'ventas',
    target: 'Leads sin compra',
    impact: '↑ 22% conversión',
    steps: [
      { type: 'auto', text: 'Detectar lead sin compra en 2 horas' },
      { type: 'auto', text: 'Enviar recordatorio por WhatsApp con oferta' },
      { type: 'auto', text: 'Si no responde en 24h, segundo mensaje' },
      { type: 'manual', text: 'Llamar si el lead es de alto valor' },
    ],
  },
  {
    slug: 'post-sale',
    name: 'Seguimiento postventa',
    emoji: '⭐',
    description:
      'Pide reseña y feedback 48 horas después de la entrega. Genera confianza y repetición',
    category: 'postventa',
    target: 'Pedidos entregados',
    impact: '↑ 40% recompra',
    steps: [
      { type: 'auto', text: 'Esperar 48h después de entrega confirmada' },
      { type: 'auto', text: 'Enviar mensaje pidiendo experiencia' },
      { type: 'auto', text: 'Si positiva: pedir reseña en redes' },
      { type: 'auto', text: 'Si negativa: escalar a soporte Vitalcom' },
    ],
  },
  {
    slug: 'welcome-lead',
    name: 'Bienvenida a leads',
    emoji: '👋',
    description:
      'Cualifica y da bienvenida a nuevos contactos que llegan por redes o WhatsApp',
    category: 'ventas',
    target: 'Leads nuevos',
    impact: '↑ 28% calificación',
    steps: [
      { type: 'auto', text: 'Detectar nuevo contacto en WhatsApp' },
      { type: 'auto', text: 'Enviar saludo + catálogo de productos' },
      { type: 'auto', text: 'Preguntar qué producto le interesa' },
      { type: 'manual', text: 'Asesorar según respuesta del lead' },
    ],
  },
  {
    slug: 'reactivate',
    name: 'Reactivar inactivos',
    emoji: '💌',
    description: 'Envía oferta especial a clientes que no compran hace 30 días',
    category: 'retencion',
    target: 'Clientes inactivos 30d',
    impact: '↑ 15% reactivación',
    steps: [
      { type: 'auto', text: 'Identificar clientes sin compra en 30 días' },
      { type: 'auto', text: 'Enviar mensaje con descuento exclusivo' },
      { type: 'auto', text: 'Si responde: generar pedido rápido' },
      { type: 'manual', text: 'Seguimiento personalizado si es VIP' },
    ],
  },
  {
    slug: 'weekly-report',
    name: 'Reporte semanal',
    emoji: '📊',
    description:
      'Recibe cada lunes un resumen de tu semana: ventas, pedidos, devoluciones, ganancia',
    category: 'reportes',
    target: 'Tu negocio',
    impact: 'Control total',
    steps: [
      { type: 'auto', text: 'Calcular métricas de la semana' },
      { type: 'auto', text: 'Generar reporte con gráficos' },
      { type: 'auto', text: 'Enviar por WhatsApp cada lunes 8am' },
      { type: 'auto', text: 'Incluir comparación vs semana anterior' },
    ],
  },
]

// ─── Resources (15 recursos iniciales) ────────────────
const RESOURCES = [
  {
    title: 'Guía completa: Cómo montar tu tienda Shopify desde cero',
    description:
      'Paso a paso para crear tu tienda, configurar pagos, importar productos Vitalcom y lanzar tu primera campaña. Ideal para principiantes.',
    category: 'Guías',
    type: 'file',
    url: 'https://vitalcom.vercel.app/resources/shopify-desde-cero.pdf',
    thumbnail:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  },
  {
    title: 'Manual de precios y márgenes — Catálogo Vitalcom 2026',
    description:
      'Todos los productos con precio comunidad, precio público y margen sugerido. Incluye calculadora de rentabilidad por producto.',
    category: 'Guías',
    type: 'file',
    url: 'https://vitalcom.vercel.app/resources/manual-precios-2026.pdf',
    thumbnail:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
  },
  {
    title: 'Guía de Facebook Ads para suplementos (Colombia)',
    description:
      'Estructura de campañas, públicos objetivo, presupuestos recomendados y ejemplos de anuncios que funcionan para nuestra categoría.',
    category: 'Guías',
    type: 'file',
    url: 'https://vitalcom.vercel.app/resources/facebook-ads-suplementos.pdf',
    thumbnail:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop',
  },
  {
    title: 'WhatsApp Business: Configura tu catálogo y respuestas automáticas',
    description:
      'Cómo usar WhatsApp Business como canal de ventas. Mensajes automáticos, etiquetas, catálogo de productos y flujos de conversación.',
    category: 'Guías',
    type: 'file',
    url: 'https://vitalcom.vercel.app/resources/whatsapp-business.pdf',
    thumbnail:
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=250&fit=crop',
  },
  {
    title: 'Plantilla de seguimiento de pedidos y ganancias',
    description:
      'Google Sheets listo para registrar tus pedidos diarios, calcular ganancias, tasa de despacho y proyecciones mensuales.',
    category: 'Plantillas',
    type: 'link',
    url: 'https://docs.google.com/spreadsheets/d/seguimiento-pedidos-vitalcom',
    thumbnail:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
  },
  {
    title: 'Plantilla de plan de contenidos (30 días)',
    description:
      'Calendario editorial con 30 ideas de contenido para Instagram, TikTok y WhatsApp. Incluye copy, hashtags y horarios de publicación.',
    category: 'Plantillas',
    type: 'link',
    url: 'https://docs.google.com/spreadsheets/d/plan-contenidos-30d',
    thumbnail:
      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=250&fit=crop',
  },
  {
    title: 'Script de ventas por WhatsApp (5 flujos)',
    description:
      'Conversaciones completas para: primer contacto, objeción de precio, cierre, postventa y reactivación. Listos para copiar y pegar.',
    category: 'Plantillas',
    type: 'file',
    url: 'https://vitalcom.vercel.app/resources/scripts-whatsapp.pdf',
    thumbnail:
      'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=400&h=250&fit=crop',
  },
  {
    title: 'Masterclass: De 0 a 100 pedidos mensuales',
    description:
      'Carlos Duarte (TOP 15% VITALCOMMERS) comparte su estrategia completa. Producto, ads, cierre y fulfillment.',
    category: 'Videos',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=masterclass-100-pedidos',
    thumbnail:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
  },
  {
    title: 'Tutorial: Conecta tu Shopify con Vitalcom en 10 minutos',
    description:
      'Video paso a paso para conectar tu tienda Shopify, importar productos y configurar la sincronización automática.',
    category: 'Videos',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=shopify-vitalcom-setup',
    thumbnail:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop',
  },
  {
    title: 'Cómo crear contenido en TikTok para suplementos',
    description:
      'Formatos que funcionan, hooks de los primeros 3 segundos, música y hashtags. Ejemplos reales con productos Vitalcom.',
    category: 'Videos',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=tiktok-suplementos',
    thumbnail:
      'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&h=250&fit=crop',
  },
  {
    title: 'Pack de banners para Shopify (12 diseños)',
    description:
      'Banners hero, colecciones y promociones listos para tu tienda. Formato Canva editable. Estilo wellness profesional.',
    category: 'Creativos',
    type: 'link',
    url: 'https://www.canva.com/design/vitalcom-banners-shopify',
    thumbnail:
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop',
  },
  {
    title: 'Pack de historias Instagram — Producto del día (20 templates)',
    description:
      'Stories editables en Canva con espacio para foto de producto, precio, beneficios y CTA. Diseño Vitalcom.',
    category: 'Creativos',
    type: 'link',
    url: 'https://www.canva.com/design/vitalcom-stories-producto',
    thumbnail:
      'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=250&fit=crop',
  },
  {
    title: 'Fichas técnicas de productos (descargables)',
    description:
      'Fichas con beneficios, ingredientes, modo de uso y copy de venta para cada producto del catálogo. Ideales para compartir con clientes.',
    category: 'Creativos',
    type: 'file',
    url: 'https://vitalcom.vercel.app/resources/fichas-tecnicas.zip',
    thumbnail:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=250&fit=crop',
  },
  {
    title: 'Contrato de dropshipper — Términos Vitalcom',
    description:
      'Documento legal que regula la relación entre Vitalcom y sus dropshippers. Revisado por abogados en CO, EC, GT, CL.',
    category: 'Documentos',
    type: 'file',
    url: 'https://vitalcom.vercel.app/resources/contrato-dropshipper.pdf',
    thumbnail:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
  },
  {
    title: 'Política de devoluciones y garantía Vitalcom',
    description:
      'Proceso completo de devoluciones por país. Plazos, condiciones y formulario de solicitud para tus clientes.',
    category: 'Documentos',
    type: 'file',
    url: 'https://vitalcom.vercel.app/resources/politica-devoluciones.pdf',
    thumbnail:
      'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=250&fit=crop',
  },
]

// ─── Documents (admin internos) ───────────────────────
const DOCUMENTS = [
  {
    name: 'Contrato dropshipper v3.docx',
    folder: 'Contratos',
    type: 'doc',
    url: 'https://vitalcom.vercel.app/internal/contrato-dropshipper-v3.docx',
    size: 251904,
  },
  {
    name: 'Proceso despacho Dropi.pdf',
    folder: 'Procesos',
    type: 'pdf',
    url: 'https://vitalcom.vercel.app/internal/proceso-despacho-dropi.pdf',
    size: 1258291,
  },
  {
    name: 'Plantilla factura COP.xlsx',
    folder: 'Plantillas',
    type: 'excel',
    url: 'https://vitalcom.vercel.app/internal/plantilla-factura-cop.xlsx',
    size: 91136,
  },
  {
    name: 'Política privacidad CO.pdf',
    folder: 'Legal',
    type: 'pdf',
    url: 'https://vitalcom.vercel.app/internal/politica-privacidad-co.pdf',
    size: 348160,
  },
  {
    name: 'Manual onboarding comunidad.pdf',
    folder: 'Procesos',
    type: 'pdf',
    url: 'https://vitalcom.vercel.app/internal/manual-onboarding.pdf',
    size: 2202009,
  },
  {
    name: 'Acuerdo proveedor Ecuador.docx',
    folder: 'Contratos',
    type: 'doc',
    url: 'https://vitalcom.vercel.app/internal/acuerdo-ec.docx',
    size: 202752,
  },
]

async function main() {
  // Workflows
  console.log('Sembrando workflow templates...')
  for (const tpl of WORKFLOW_TEMPLATES) {
    await prisma.workflowTemplate.upsert({
      where: { slug: tpl.slug },
      create: { ...tpl, isPublic: true, steps: tpl.steps as any },
      update: {
        name: tpl.name,
        emoji: tpl.emoji,
        description: tpl.description,
        category: tpl.category,
        target: tpl.target,
        impact: tpl.impact,
        steps: tpl.steps as any,
        isPublic: true,
      },
    })
  }
  console.log(`  ✓ ${WORKFLOW_TEMPLATES.length} templates`)

  // Resources — usar title como identificador natural
  console.log('Sembrando resources...')
  for (const r of RESOURCES) {
    const existing = await prisma.resource.findFirst({ where: { title: r.title } })
    if (existing) {
      await prisma.resource.update({
        where: { id: existing.id },
        data: {
          description: r.description,
          category: r.category,
          type: r.type,
          url: r.url,
          thumbnail: r.thumbnail,
          published: true,
        },
      })
    } else {
      await prisma.resource.create({ data: { ...r, published: true } })
    }
  }
  console.log(`  ✓ ${RESOURCES.length} resources`)

  // Documents — requieren uploader, usar el primer SUPERADMIN
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['SUPERADMIN', 'ADMIN'] } },
    orderBy: { createdAt: 'asc' },
  })
  if (!admin) {
    console.log('  ⚠ No hay SUPERADMIN/ADMIN — se omite seed de documents')
  } else {
    console.log('Sembrando documents...')
    for (const d of DOCUMENTS) {
      const existing = await prisma.document.findFirst({ where: { name: d.name } })
      if (existing) {
        await prisma.document.update({
          where: { id: existing.id },
          data: { folder: d.folder, type: d.type, url: d.url, size: d.size },
        })
      } else {
        await prisma.document.create({ data: { ...d, uploadedBy: admin.id } })
      }
    }
    console.log(`  ✓ ${DOCUMENTS.length} documents`)
  }

  console.log('Seed V12 completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
