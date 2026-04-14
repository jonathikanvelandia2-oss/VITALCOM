'use client'

import { useState } from 'react'
import {
  Heart, MessageCircle, Share2, Sparkles, Image as ImageIcon,
  Pin, TrendingUp, ShoppingBag, Award, Flame, Target,
  ArrowUpRight, BookOpen,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// ── Feed VITALCOMMERS — comunidad de dropshippers ────────
// Contenido enfocado en: resultados reales, tips de venta,
// casos de éxito, y aprendizaje colectivo.

const POSTS = [
  {
    id: '1',
    author: 'Juan Carlos · CEO Vitalcom',
    level: 'Vital 🌳',
    avatar: 'JC',
    time: 'hace 2 h',
    pinned: true,
    category: 'anuncio',
    body: '🚀 VITALCOMMERS: Ya pueden conectar su Shopify directamente desde la plataforma. Vayan a "Mi Tienda" en el menú. Los que no tienen tienda, hay plantillas listas para montar en 30 min. A vender.',
    likes: 247,
    comments: 58,
    hasStats: false,
  },
  {
    id: '2',
    author: 'María Restrepo',
    level: 'Tallo 🌱',
    avatar: 'MR',
    time: 'hace 4 h',
    pinned: false,
    category: 'resultado',
    body: 'Semana 3 con Vitalcom. Resultados de esta semana con mi tienda de Shopify:\n\n• 23 pedidos facturados\n• 19 despachados (83% tasa de despacho)\n• $1.2M en ventas\n• $485K de ganancia neta\n\nEl Colágeno Marino sigue siendo el rey. La clave fue usar los textos del generador de marketing + historias con resultados reales de clientas.',
    likes: 156,
    comments: 34,
    hasStats: true,
    stats: { orders: 23, revenue: 1_200_000, profit: 485_000 },
  },
  {
    id: '3',
    author: 'Andrés Gómez',
    level: 'Rama 🌿',
    avatar: 'AG',
    time: 'hace 7 h',
    pinned: false,
    category: 'tip',
    body: 'TIP para los que venden en Instagram:\n\nNo pongan precio en las publicaciones. Pongan "Escríbeme DM" y usen el flujo de Luzitbot para responder automático.\n\nMi tasa de conversión subió de 2.1% a 4.8% con este cambio. El secreto es la conversación 1-a-1, no el catálogo.',
    likes: 89,
    comments: 22,
    hasStats: false,
  },
  {
    id: '4',
    author: 'Verónica Salas',
    level: 'Hoja 🍃',
    avatar: 'VS',
    time: 'ayer',
    pinned: false,
    category: 'pregunta',
    body: 'Pregunta para los que ya conectaron Shopify: ¿cuál tema están usando? Empecé con Dawn pero siento que no se ve profesional para suplementos. ¿Sense es mejor?',
    likes: 34,
    comments: 18,
    hasStats: false,
  },
  {
    id: '5',
    author: 'Carlos Duarte',
    level: 'Árbol 🌳',
    avatar: 'CD',
    time: 'ayer',
    pinned: false,
    category: 'resultado',
    body: 'Mes de marzo cerrado:\n\n• 112 pedidos · $4.85M en ventas\n• $2.14M de ganancia neta\n• TOP 15% de VITALCOMMERS\n\nLo que más me funcionó: meter Ryze y 12 Colágenos como bundle premium. El ticket promedio subió de $35K a $58K. Menos pedidos pero más rentables.',
    likes: 213,
    comments: 41,
    hasStats: true,
    stats: { orders: 112, revenue: 4_850_000, profit: 2_140_000 },
  },
]

const CATEGORIES = ['Todos', 'Resultados', 'Tips', 'Preguntas', 'Anuncios', 'Mindset', 'Ventas']

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState('Todos')

  const filtered = activeCategory === 'Todos'
    ? POSTS
    : POSTS.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase().replace('resultados', 'resultado').replace('preguntas', 'pregunta').replace('anuncios', 'anuncio'))

  return (
    <>
      <CommunityTopbar
        title="Feed VITALCOMMERS"
        subtitle="Lo que pasa en la comunidad de dropshipping #1 de LATAM"
      />
      <div className="flex-1">
        <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
          {/* Resumen rápido de la comunidad */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickStat icon={ShoppingBag} label="Tiendas activas" value="347" />
            <QuickStat icon={TrendingUp} label="Ventas hoy" value="$12.4M" highlight />
            <QuickStat icon={Flame} label="Posts esta semana" value="89" />
            <QuickStat icon={Award} label="Tu ranking" value="#142" />
          </div>

          {/* Composer */}
          <div className="vc-card">
            <div className="flex gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: 'var(--vc-gradient-primary)',
                  color: 'var(--vc-black)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                MR
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="Comparte tu resultado, tip o pregunta con la comunidad..."
                  rows={3}
                  className="w-full resize-none rounded-lg p-3 text-sm outline-none"
                  style={{
                    background: 'var(--vc-black-soft)',
                    border: '1px solid var(--vc-gray-dark)',
                    color: 'var(--vc-white-soft)',
                  }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-3">
                    <button className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                      <ImageIcon size={14} /> Imagen
                    </button>
                    <button className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
                      <TrendingUp size={14} /> Resultados
                    </button>
                  </div>
                  <button className="vc-btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  background: activeCategory === c ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                  color: activeCategory === c ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                  border: activeCategory === c ? 'none' : '1px solid var(--vc-gray-dark)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Posts */}
          {filtered.map((p) => (
            <article key={p.id} className="vc-card">
              {p.pinned && (
                <div className="-mt-2 mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                  <Pin size={11} /> Anclado por el equipo
                </div>
              )}
              <header className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: 'var(--vc-gradient-primary)',
                    color: 'var(--vc-black)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {p.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                    {p.author}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--vc-lime-main)' }}>
                    {p.level} · <span style={{ color: 'var(--vc-gray-mid)' }}>{p.time}</span>
                  </p>
                </div>
                <CategoryBadge category={p.category} />
              </header>

              <div className="mb-4 whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--vc-white-soft)' }}>
                {p.body}
              </div>

              {/* Card de resultados si tiene stats */}
              {p.hasStats && p.stats && (
                <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg p-3"
                  style={{ background: 'rgba(198,255,60,0.06)', border: '1px solid rgba(198,255,60,0.2)' }}>
                  <div className="text-center">
                    <p className="text-[9px] uppercase" style={{ color: 'var(--vc-gray-mid)' }}>Pedidos</p>
                    <p className="font-mono text-sm font-bold" style={{ color: 'var(--vc-white-soft)' }}>{p.stats.orders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase" style={{ color: 'var(--vc-gray-mid)' }}>Ventas</p>
                    <p className="font-mono text-sm font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                      ${(p.stats.revenue / 1_000_000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase" style={{ color: 'var(--vc-gray-mid)' }}>Ganancia</p>
                    <p className="font-mono text-sm font-bold" style={{ color: 'var(--vc-lime-main)' }}>
                      ${(p.stats.profit / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              )}

              <footer className="flex items-center gap-6 pt-3 text-xs" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
                <button className="flex items-center gap-1.5 transition-colors hover:text-[--vc-lime-main]" style={{ color: 'var(--vc-white-dim)' }}>
                  <Heart size={14} /> {p.likes}
                </button>
                <button className="flex items-center gap-1.5" style={{ color: 'var(--vc-white-dim)' }}>
                  <MessageCircle size={14} /> {p.comments}
                </button>
                <button className="ml-auto flex items-center gap-1.5" style={{ color: 'var(--vc-white-dim)' }}>
                  <Share2 size={14} /> Compartir
                </button>
              </footer>
            </article>
          ))}

          {/* CTA de la comunidad */}
          <div className="vc-card text-center" style={{ borderColor: 'rgba(198,255,60,0.3)' }}>
            <Sparkles size={24} color="var(--vc-lime-main)" className="mx-auto mb-2" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              Comparte tus resultados y sube de nivel
            </h3>
            <p className="mx-auto mt-1 max-w-md text-[11px]" style={{ color: 'var(--vc-white-dim)' }}>
              Cada post con resultados te da +10 puntos. Los tips útiles +5. Llega a Nivel 5 (Rama) y desbloquea herramientas Pro.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Componentes auxiliares ────────────────────────────────

function QuickStat({ icon: Icon, label, value, highlight }: {
  icon: typeof ShoppingBag; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className="vc-card text-center" style={{ padding: '0.75rem' }}>
      <Icon size={14} className="mx-auto mb-1" style={{ color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-gray-mid)' }} />
      <p className="text-sm font-black" style={{ color: highlight ? 'var(--vc-lime-main)' : 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--vc-gray-mid)' }}>{label}</p>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const config: Record<string, { bg: string; color: string }> = {
    anuncio: { bg: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)' },
    resultado: { bg: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)' },
    tip: { bg: 'rgba(60,198,255,0.15)', color: 'var(--vc-info)' },
    pregunta: { bg: 'rgba(255,184,0,0.15)', color: 'var(--vc-warning)' },
    mindset: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    ventas: { bg: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-deep)' },
  }
  const c = config[category] || config.tip
  return (
    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}33` }}>
      {category}
    </span>
  )
}
