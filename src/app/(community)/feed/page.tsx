import { Heart, MessageCircle, Share2, Sparkles, Image as ImageIcon, Pin } from 'lucide-react'

// Feed estilo Skool — corazón de la comunidad Vitalcom
const POSTS = [
  {
    id: '1',
    author: 'Juan Carlos · CEO Vitalcom',
    level: 'Vital 🌳',
    avatar: 'JC',
    time: 'hace 2 h',
    pinned: true,
    category: 'anuncio',
    body: '🚀 Comunidad, esta semana lanzamos el nuevo módulo de finanzas en el panel y la calculadora de precios ya está lista para todos los dropshippers. Cuéntenme qué les parece.',
    likes: 184,
    comments: 32,
  },
  {
    id: '2',
    author: 'María Restrepo',
    level: 'Tallo 🌱',
    avatar: 'MR',
    time: 'hace 4 h',
    pinned: false,
    category: 'caso de éxito',
    body: '¡Cerré 18 ventas de Colágeno este fin de semana usando el flujo de Luzitbot que compartieron acá! Margen del 47%. Gracias gracias gracias 🙌',
    likes: 96,
    comments: 14,
  },
  {
    id: '3',
    author: 'Andrés Gómez',
    level: 'Rama 🌿',
    avatar: 'AG',
    time: 'hace 7 h',
    pinned: false,
    category: 'duda',
    body: '¿Alguien ha probado vender Ashwagandha en Medellín? Me interesa pero no tengo claro el público. ¿Recomendaciones de cómo posicionarlo?',
    likes: 23,
    comments: 18,
  },
  {
    id: '4',
    author: 'Verónica Salas',
    level: 'Hoja 🍃',
    avatar: 'VS',
    time: 'ayer',
    pinned: false,
    category: 'tip',
    body: 'Tip rápido: si sus clientes pagan por Nequi, denles SIEMPRE comprobante con sello Vitalcom. Subió mi tasa de recompra un 30%.',
    likes: 67,
    comments: 9,
  },
]

const CATEGORIES = ['Todos', 'Anuncios', 'Tips', 'Casos de éxito', 'Dudas', 'Mindset', 'Ventas']

export default function FeedPage() {
  return (
    <div className="flex-1">
      {/* Topbar comunidad */}
      <header
        className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-6"
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(198, 255, 60, 0.18)',
        }}
      >
        <div>
          <h1
            className="text-lg font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Feed
          </h1>
          <p
            className="text-[11px]"
            style={{
              color: 'var(--vc-gray-mid)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Lo que está pasando en Vitalcom · 🇨🇴
          </p>
        </div>
        <div
          className="hidden items-center gap-2 rounded-full px-4 py-2 md:flex"
          style={{
            background: 'rgba(198, 255, 60, 0.12)',
            border: '1px solid rgba(198, 255, 60, 0.3)',
          }}
        >
          <Sparkles size={14} color="var(--vc-lime-main)" />
          <span
            className="text-xs font-bold"
            style={{
              color: 'var(--vc-lime-main)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            +120 puntos esta semana
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 p-6">
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
                placeholder="¿Qué quieres compartir con la comunidad?"
                rows={3}
                className="w-full resize-none rounded-lg p-3 text-sm outline-none"
                style={{
                  background: 'var(--vc-black-soft)',
                  border: '1px solid var(--vc-gray-dark)',
                  color: 'var(--vc-white-soft)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <div className="mt-3 flex items-center justify-between">
                <button
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--vc-white-dim)' }}
                >
                  <ImageIcon size={14} /> Imagen
                </button>
                <button className="vc-btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros de categoría */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                background: i === 0 ? 'var(--vc-lime-main)' : 'var(--vc-black-mid)',
                color: i === 0 ? 'var(--vc-black)' : 'var(--vc-white-dim)',
                border: i === 0 ? 'none' : '1px solid var(--vc-gray-dark)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Posts */}
        {POSTS.map((p) => (
          <article key={p.id} className="vc-card">
            {p.pinned && (
              <div
                className="-mt-2 mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color: 'var(--vc-lime-main)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
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
                <p
                  className="text-sm font-bold"
                  style={{
                    color: 'var(--vc-white-soft)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {p.author}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--vc-lime-main)' }}>
                  {p.level} · <span style={{ color: 'var(--vc-gray-mid)' }}>{p.time}</span>
                </p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                style={{
                  background: 'var(--vc-black-soft)',
                  color: 'var(--vc-lime-main)',
                  border: '1px solid rgba(198, 255, 60, 0.3)',
                }}
              >
                {p.category}
              </span>
            </header>
            <p
              className="mb-4 text-sm leading-relaxed"
              style={{ color: 'var(--vc-white-soft)' }}
            >
              {p.body}
            </p>
            <footer
              className="flex items-center gap-6 pt-3 text-xs"
              style={{ borderTop: '1px solid var(--vc-gray-dark)' }}
            >
              <button
                className="flex items-center gap-1.5 transition-colors hover:text-[--vc-lime-main]"
                style={{ color: 'var(--vc-white-dim)' }}
              >
                <Heart size={14} /> {p.likes}
              </button>
              <button
                className="flex items-center gap-1.5"
                style={{ color: 'var(--vc-white-dim)' }}
              >
                <MessageCircle size={14} /> {p.comments}
              </button>
              <button
                className="ml-auto flex items-center gap-1.5"
                style={{ color: 'var(--vc-white-dim)' }}
              >
                <Share2 size={14} /> Compartir
              </button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}
