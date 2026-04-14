'use client'

import { useState, useMemo } from 'react'
import {
  BookOpen, FileText, Video, Image as ImageIcon, Download,
  Search, Star, Clock, Eye, Filter, Bookmark, ExternalLink,
  FileSpreadsheet, Palette, Megaphone, ShoppingCart, Target,
  Users, Lightbulb, PlayCircle, FileDown,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// ── Biblioteca de Recursos VITALCOMMERS ──────────────────
// Materiales descargables, guías, plantillas, videos y
// recursos para que los dropshippers vendan más.

type ResourceCategory =
  | 'Todos'
  | 'Guías'
  | 'Plantillas'
  | 'Videos'
  | 'Creativos'
  | 'Documentos'

type ResourceFormat = 'pdf' | 'video' | 'image' | 'spreadsheet' | 'template' | 'canva'

type Resource = {
  id: string
  title: string
  description: string
  category: ResourceCategory
  format: ResourceFormat
  tags: string[]
  featured: boolean
  downloads: number
  views: number
  addedAt: string
  duration?: string      // para videos
  pages?: number         // para PDFs
  fileSize?: string
  previewImage: string
}

const RESOURCES: Resource[] = [
  // ── Guías ──
  {
    id: 'r-001',
    title: 'Guía completa: Cómo montar tu tienda Shopify desde cero',
    description: 'Paso a paso para crear tu tienda, configurar pagos, importar productos Vitalcom y lanzar tu primera campaña. Ideal para principiantes.',
    category: 'Guías',
    format: 'pdf',
    tags: ['shopify', 'principiante', 'tienda'],
    featured: true,
    downloads: 847,
    views: 2340,
    addedAt: '2026-04-01',
    pages: 32,
    fileSize: '4.2 MB',
    previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  },
  {
    id: 'r-002',
    title: 'Manual de precios y márgenes — Catálogo Vitalcom 2026',
    description: 'Todos los productos con precio comunidad, precio público y margen sugerido. Incluye calculadora de rentabilidad por producto.',
    category: 'Guías',
    format: 'pdf',
    tags: ['precios', 'márgenes', 'catálogo'],
    featured: true,
    downloads: 1203,
    views: 3100,
    addedAt: '2026-03-20',
    pages: 18,
    fileSize: '2.8 MB',
    previewImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
  },
  {
    id: 'r-003',
    title: 'Guía de Facebook Ads para suplementos (Colombia)',
    description: 'Estructura de campañas, públicos objetivo, presupuestos recomendados y ejemplos de anuncios que funcionan para nuestra categoría.',
    category: 'Guías',
    format: 'pdf',
    tags: ['facebook ads', 'publicidad', 'colombia'],
    featured: false,
    downloads: 623,
    views: 1890,
    addedAt: '2026-03-15',
    pages: 24,
    fileSize: '5.1 MB',
    previewImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop',
  },
  {
    id: 'r-004',
    title: 'WhatsApp Business: Configura tu catálogo y respuestas automáticas',
    description: 'Cómo usar WhatsApp Business como canal de ventas. Mensajes automáticos, etiquetas, catálogo de productos y flujos de conversación.',
    category: 'Guías',
    format: 'pdf',
    tags: ['whatsapp', 'ventas', 'automatización'],
    featured: false,
    downloads: 456,
    views: 1250,
    addedAt: '2026-03-10',
    pages: 16,
    fileSize: '3.0 MB',
    previewImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=250&fit=crop',
  },

  // ── Plantillas ──
  {
    id: 'r-005',
    title: 'Plantilla de seguimiento de pedidos y ganancias',
    description: 'Google Sheets listo para registrar tus pedidos diarios, calcular ganancias, tasa de despacho y proyecciones mensuales.',
    category: 'Plantillas',
    format: 'spreadsheet',
    tags: ['seguimiento', 'pedidos', 'excel', 'ganancias'],
    featured: true,
    downloads: 934,
    views: 2100,
    addedAt: '2026-04-05',
    fileSize: '1.2 MB',
    previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
  },
  {
    id: 'r-006',
    title: 'Plantilla de plan de contenidos (30 días)',
    description: 'Calendario editorial con 30 ideas de contenido para Instagram, TikTok y WhatsApp. Incluye copy, hashtags y horarios de publicación.',
    category: 'Plantillas',
    format: 'spreadsheet',
    tags: ['contenido', 'calendario', 'redes sociales'],
    featured: false,
    downloads: 567,
    views: 1680,
    addedAt: '2026-03-25',
    fileSize: '0.8 MB',
    previewImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=250&fit=crop',
  },
  {
    id: 'r-007',
    title: 'Script de ventas por WhatsApp (5 flujos)',
    description: 'Conversaciones completas para: primer contacto, objeción de precio, cierre, postventa y reactivación. Listos para copiar y pegar.',
    category: 'Plantillas',
    format: 'template',
    tags: ['scripts', 'whatsapp', 'ventas', 'objeciones'],
    featured: true,
    downloads: 1089,
    views: 2800,
    addedAt: '2026-04-08',
    fileSize: '0.5 MB',
    previewImage: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=400&h=250&fit=crop',
  },

  // ── Videos ──
  {
    id: 'r-008',
    title: 'Masterclass: De 0 a 100 pedidos mensuales',
    description: 'Carlos Duarte (TOP 15% VITALCOMMERS) comparte su estrategia completa. Producto, ads, cierre y fulfillment.',
    category: 'Videos',
    format: 'video',
    tags: ['masterclass', 'estrategia', 'ventas'],
    featured: true,
    downloads: 0,
    views: 4200,
    addedAt: '2026-04-10',
    duration: '1h 12min',
    previewImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
  },
  {
    id: 'r-009',
    title: 'Tutorial: Conecta tu Shopify con Vitalcom en 10 minutos',
    description: 'Video paso a paso para conectar tu tienda Shopify, importar productos y configurar la sincronización automática.',
    category: 'Videos',
    format: 'video',
    tags: ['tutorial', 'shopify', 'configuración'],
    featured: false,
    downloads: 0,
    views: 1890,
    addedAt: '2026-04-12',
    duration: '12min',
    previewImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop',
  },
  {
    id: 'r-010',
    title: 'Cómo crear contenido en TikTok para suplementos',
    description: 'Formatos que funcionan, hooks de los primeros 3 segundos, música y hashtags. Ejemplos reales con productos Vitalcom.',
    category: 'Videos',
    format: 'video',
    tags: ['tiktok', 'contenido', 'redes sociales'],
    featured: false,
    downloads: 0,
    views: 2450,
    addedAt: '2026-04-06',
    duration: '28min',
    previewImage: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&h=250&fit=crop',
  },

  // ── Creativos ──
  {
    id: 'r-011',
    title: 'Pack de banners para Shopify (12 diseños)',
    description: 'Banners hero, colecciones y promociones listos para tu tienda. Formato Canva editable. Estilo wellness profesional.',
    category: 'Creativos',
    format: 'canva',
    tags: ['banners', 'shopify', 'diseño', 'canva'],
    featured: false,
    downloads: 712,
    views: 1900,
    addedAt: '2026-04-03',
    fileSize: 'Canva',
    previewImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop',
  },
  {
    id: 'r-012',
    title: 'Pack de historias Instagram — Producto del día (20 templates)',
    description: 'Stories editables en Canva con espacio para foto de producto, precio, beneficios y CTA. Diseño Vitalcom.',
    category: 'Creativos',
    format: 'canva',
    tags: ['instagram', 'stories', 'canva', 'diseño'],
    featured: true,
    downloads: 1345,
    views: 3400,
    addedAt: '2026-04-07',
    fileSize: 'Canva',
    previewImage: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=250&fit=crop',
  },
  {
    id: 'r-013',
    title: 'Fichas técnicas de productos (descargables)',
    description: 'Fichas con beneficios, ingredientes, modo de uso y copy de venta para cada producto del catálogo. Ideales para compartir con clientes.',
    category: 'Creativos',
    format: 'image',
    tags: ['fichas', 'productos', 'información'],
    featured: false,
    downloads: 890,
    views: 2100,
    addedAt: '2026-03-28',
    fileSize: '15 MB (ZIP)',
    previewImage: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=250&fit=crop',
  },

  // ── Documentos ──
  {
    id: 'r-014',
    title: 'Contrato de dropshipper — Términos Vitalcom',
    description: 'Documento legal que regula la relación entre Vitalcom y sus dropshippers. Revisado por abogados en CO, EC, GT, CL.',
    category: 'Documentos',
    format: 'pdf',
    tags: ['legal', 'contrato', 'dropshipper'],
    featured: false,
    downloads: 234,
    views: 890,
    addedAt: '2026-02-15',
    pages: 8,
    fileSize: '0.9 MB',
    previewImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
  },
  {
    id: 'r-015',
    title: 'Política de devoluciones y garantía Vitalcom',
    description: 'Proceso completo de devoluciones por país. Plazos, condiciones y formulario de solicitud para tus clientes.',
    category: 'Documentos',
    format: 'pdf',
    tags: ['devoluciones', 'garantía', 'política'],
    featured: false,
    downloads: 189,
    views: 670,
    addedAt: '2026-02-20',
    pages: 6,
    fileSize: '0.6 MB',
    previewImage: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=250&fit=crop',
  },
]

const CATEGORIES: ResourceCategory[] = ['Todos', 'Guías', 'Plantillas', 'Videos', 'Creativos', 'Documentos']

const FORMAT_CONFIG: Record<ResourceFormat, { icon: typeof FileText; label: string; color: string }> = {
  pdf:         { icon: FileText,        label: 'PDF',         color: 'var(--vc-error)' },
  video:       { icon: PlayCircle,      label: 'Video',       color: 'var(--vc-info)' },
  image:       { icon: ImageIcon,       label: 'Imágenes',    color: '#a855f7' },
  spreadsheet: { icon: FileSpreadsheet, label: 'Hoja cálculo', color: 'var(--vc-lime-main)' },
  template:    { icon: FileDown,        label: 'Plantilla',   color: 'var(--vc-warning)' },
  canva:       { icon: Palette,         label: 'Canva',       color: '#00c4cc' },
}

export default function RecursosPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ResourceCategory>('Todos')

  const filtered = useMemo(() => {
    return RESOURCES.filter(r => {
      if (category !== 'Todos' && r.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some(t => t.includes(q))
      }
      return true
    })
  }, [search, category])

  const featured = RESOURCES.filter(r => r.featured)
  const totalDownloads = RESOURCES.reduce((sum, r) => sum + r.downloads, 0)

  return (
    <>
      <CommunityTopbar
        title="Biblioteca de Recursos"
        subtitle={`${RESOURCES.length} recursos · ${totalDownloads.toLocaleString('es-CO')} descargas`}
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats rápidas */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {CATEGORIES.filter(c => c !== 'Todos').map((cat) => {
            const count = RESOURCES.filter(r => r.category === cat).length
            const icons: Record<string, typeof FileText> = {
              Guías: BookOpen, Plantillas: FileSpreadsheet, Videos: PlayCircle, Creativos: Palette, Documentos: FileText,
            }
            const Icon = icons[cat] || FileText
            return (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? 'Todos' : cat)}
                className="vc-card flex items-center gap-3 text-left transition-all"
                style={{
                  padding: '0.75rem',
                  borderColor: category === cat ? 'rgba(198,255,60,0.5)' : undefined,
                  boxShadow: category === cat ? '0 0 16px var(--vc-glow-lime)' : 'none',
                }}
              >
                <Icon size={18} style={{ color: category === cat ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>{count}</p>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)' }}>{cat}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--vc-gray-mid)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar guías, plantillas, videos..."
            className="w-full rounded-lg py-2.5 pl-10 pr-3 text-xs outline-none"
            style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
          />
        </div>

        {/* Destacados — solo si estamos en "Todos" y sin búsqueda */}
        {category === 'Todos' && !search && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              <Star size={14} color="var(--vc-lime-main)" /> Destacados
            </h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featured.slice(0, 3).map((r) => (
                <FeaturedCard key={r.id} resource={r} />
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        <div>
          <p className="mb-3 text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
            {filtered.length} recurso{filtered.length !== 1 ? 's' : ''}
            {category !== 'Todos' ? ` en ${category}` : ''}
          </p>
          <div className="space-y-3">
            {filtered.map((r) => (
              <ResourceRow key={r.id} resource={r} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Card destacada ───────────────────────────────────────
function FeaturedCard({ resource }: { resource: Resource }) {
  const fmt = FORMAT_CONFIG[resource.format]
  const FmtIcon = fmt.icon
  return (
    <article className="vc-card group flex flex-col" style={{ borderColor: 'rgba(198,255,60,0.25)' }}>
      <div
        className="relative mb-3 h-32 overflow-hidden rounded-lg"
        style={{ background: 'var(--vc-black-soft)' }}
      >
        <img src={resource.previewImage} alt={resource.title} className="h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.9) 100%)' }} />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
          style={{ background: 'rgba(10,10,10,0.8)', color: fmt.color }}>
          <FmtIcon size={10} /> {fmt.label}
        </span>
        {resource.duration && (
          <span className="absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ background: 'rgba(10,10,10,0.8)', color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
            {resource.duration}
          </span>
        )}
      </div>
      <h4 className="mb-1 line-clamp-2 text-sm font-bold leading-snug" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
        {resource.title}
      </h4>
      <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
        {resource.description}
      </p>
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-3 text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
          {resource.downloads > 0 && <span className="flex items-center gap-1"><Download size={9} /> {resource.downloads}</span>}
          <span className="flex items-center gap-1"><Eye size={9} /> {resource.views}</span>
        </div>
        <button className="vc-btn-primary flex items-center gap-1.5 text-[10px]" style={{ padding: '0.35rem 0.75rem' }}>
          {resource.format === 'video' ? <><PlayCircle size={11} /> Ver</> : <><Download size={11} /> Descargar</>}
        </button>
      </div>
    </article>
  )
}

// ── Fila de recurso ──────────────────────────────────────
function ResourceRow({ resource }: { resource: Resource }) {
  const fmt = FORMAT_CONFIG[resource.format]
  const FmtIcon = fmt.icon
  return (
    <div className="vc-card flex items-center gap-4">
      {/* Icono de formato */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${fmt.color}15`, border: `1px solid ${fmt.color}30` }}>
        <FmtIcon size={20} style={{ color: fmt.color }} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <h4 className="truncate text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
            {resource.title}
          </h4>
          {resource.featured && (
            <Star size={11} color="var(--vc-lime-main)" className="shrink-0" fill="var(--vc-lime-main)" />
          )}
        </div>
        <p className="line-clamp-1 text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
          {resource.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-bold uppercase" style={{ color: fmt.color }}>{fmt.label}</span>
          {resource.pages && <span className="text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{resource.pages} págs</span>}
          {resource.duration && <span className="text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{resource.duration}</span>}
          {resource.fileSize && <span className="text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{resource.fileSize}</span>}
          <span className="text-[9px]" style={{ color: 'var(--vc-gray-mid)' }}>·</span>
          {resource.downloads > 0 && (
            <span className="flex items-center gap-0.5 text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
              <Download size={8} /> {resource.downloads}
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[9px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>
            <Eye size={8} /> {resource.views}
          </span>
          {resource.tags.slice(0, 2).map(t => (
            <span key={t} className="rounded-full px-1.5 py-0.5 text-[8px]" style={{ background: 'var(--vc-black-soft)', color: 'var(--vc-white-dim)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Acción */}
      <button className="vc-btn-primary flex shrink-0 items-center gap-1.5 text-[10px]" style={{ padding: '0.4rem 0.85rem' }}>
        {resource.format === 'video' ? <><PlayCircle size={12} /> Ver</> : <><Download size={12} /> Descargar</>}
      </button>
    </div>
  )
}
