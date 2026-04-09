'use client'

import { useState } from 'react'
import {
  Sparkles, Copy, Check, RefreshCw, Send, Instagram,
  MessageCircle, Video, Calendar, Target, TrendingUp,
  Megaphone, ChevronDown, ChevronUp, Zap, Star,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// ── Marketing para emprendedores Vitalcom ───────────────
// Generador de contenido, estrategias pre-armadas, calendario
// semanal e insights. Todo enfocado en bienestar + dropshipping.

type ContentTab = 'posts' | 'stories' | 'tiktok' | 'whatsapp'

// ── Estrategias pre-diseñadas ───────────────────────────
const STRATEGIES = [
  {
    id: 'launch', emoji: '🎯', name: 'Campaña de lanzamiento',
    description: 'Para cuando arrancas tu negocio o un nuevo producto. 7 días de contenido progresivo.',
    target: 'Nuevos emprendedores',
    steps: ['Día 1-2: Teaser en stories', 'Día 3: Post de revelación', 'Día 5: Testimonios', 'Día 7: Oferta de lanzamiento'],
  },
  {
    id: 'tiktok-viral', emoji: '📱', name: 'TikTok viral bienestar',
    description: 'Scripts virales de antes/después, rutinas saludables y unboxing de productos.',
    target: 'Audiencia joven 18-35',
    steps: ['Hook en 3 segundos', 'Problema → solución', 'Mostrar producto natural', 'CTA: link en bio'],
  },
  {
    id: 'reactivate', emoji: '💌', name: 'Recuperar clientes inactivos',
    description: 'Secuencia de 3 mensajes por WhatsApp para clientes que no compran hace 30+ días.',
    target: 'Clientes inactivos',
    steps: ['Msg 1: ¿Cómo te fue con el producto?', 'Msg 2: Nuevo catálogo + descuento', 'Msg 3: Última oportunidad'],
  },
  {
    id: 'flash-sale', emoji: '🔥', name: 'Oferta flash 24 horas',
    description: 'Crea urgencia con una oferta limitada. Ideal para mover inventario o cerrar el mes fuerte.',
    target: 'Base de clientes actual',
    steps: ['Anuncio 24h antes en stories', 'Post con cuenta regresiva', 'WhatsApp a clientes VIP', 'Cierre: últimas unidades'],
  },
  {
    id: 'reviews', emoji: '⭐', name: 'Campaña de reseñas',
    description: 'Consigue testimonios reales de clientes satisfechos para generar confianza social.',
    target: 'Clientes con compra reciente',
    steps: ['Mensaje postventa pidiendo feedback', 'Plantilla fácil para reseña', 'Publicar en feed + stories', 'Agradecer públicamente'],
  },
  {
    id: 'wellness-edu', emoji: '🌿', name: 'Contenido educativo bienestar',
    description: 'Posiciónate como experto en bienestar. Tips, datos y beneficios de productos naturales.',
    target: 'Seguidores nuevos',
    steps: ['Carrusel: 5 beneficios del colágeno', 'Reel: rutina diaria de bienestar', 'Story quiz: ¿cuánto sabes?', 'Post: mitos vs realidad'],
  },
]

// ── Contenido generado de demo ──────────────────────────
const DEMO_CONTENT: Record<ContentTab, string> = {
  posts: `🌿 ¿Sabías que el colágeno hidrolizado puede transformar tu piel en solo 30 días?

No es magia, es ciencia. El colágeno tipo I y III ayuda a:
✅ Reducir arrugas y líneas de expresión
✅ Fortalecer uñas y cabello
✅ Mejorar la elasticidad de tu piel

💚 En Vitalcom tenemos colágeno premium con envío a todo Colombia.

¿Ya lo probaste? Cuéntame tu experiencia 👇

#BienestarNatural #Colágeno #VidaSaludable #Vitalcom #DropshippingColombia`,

  stories: `📱 SECUENCIA DE 5 STORIES:

STORY 1 — HOOK
"¿Quieres saber el secreto de las mujeres que no envejecen?"
[Fondo: foto producto + emoji 🤫]

STORY 2 — PROBLEMA
"Después de los 25, pierdes 1% de colágeno cada año"
[Dato impactante con número grande]

STORY 3 — SOLUCIÓN
"Colágeno Hidrolizado Premium — 100% natural, sin azúcar"
[Foto del producto con precio]

STORY 4 — PRUEBA SOCIAL
"Mira lo que dice Carolina después de 30 días →"
[Screenshot de testimonio real]

STORY 5 — CTA
"Escríbeme 'QUIERO' y te envío toda la info 📩"
[Sticker de enlace o DM]`,

  tiktok: `🎬 SCRIPT TIKTOK (45 segundos):

00:00 - 00:03 [HOOK]
"POV: Descubriste el negocio que te da libertad financiera"
(Caminando, mirando el celular con cara de sorpresa)

00:03 - 00:10 [CONTEXTO]
"Vendo productos de bienestar sin inversión, sin bodega, sin riesgo"
(Mostrando la app de pedidos, productos llegando)

00:10 - 00:25 [DESARROLLO]
"Elijo los productos → comparto con mis clientes → Vitalcom envía por mí → yo cobro la ganancia"
(Transiciones rápidas mostrando cada paso)

00:25 - 00:35 [RESULTADO]
"Esta semana: 12 pedidos, $850K de ganancia neta"
(Mostrando pantalla de métricas — pixelar montos si prefieres)

00:35 - 00:45 [CTA]
"¿Quieres empezar? Link en mi bio — es gratis registrarse"
(Señalando hacia arriba, sonrisa)

🎵 Audio sugerido: trending motivacional
#Dropshipping #Emprendimiento #Vitalcom #BienestarQueConecta`,

  whatsapp: `💬 PLANTILLA WHATSAPP:

Hola {nombre} 👋

Soy [tu nombre] de la comunidad Vitalcom 🌿

Vi que te interesó nuestro catálogo de productos de bienestar y quería contarte que esta semana tenemos algo especial:

✨ *Colágeno Hidrolizado Premium*
• 30 sobres para un mes completo
• Sabor neutro, fácil de tomar
• Envío gratis a tu ciudad
• Precio especial: $65.000 (antes $89.000)

📦 Envío en 2-3 días hábiles a todo Colombia con Servientrega.

¿Te gustaría que te reserve uno? Solo dime "SÍ" y te paso el link de pago seguro 🔒

Si tienes dudas, estoy aquí para ayudarte 💚`,
}

// ── Calendario semanal demo ─────────────────────────────
const WEEKLY_CALENDAR = [
  { day: 'Lunes', type: '📸 Post', content: 'Beneficios del producto estrella', hashtags: '#BienestarNatural #Tips', time: '10:00 AM' },
  { day: 'Martes', type: '📱 Story', content: 'Detrás de cámaras: tu rutina con productos', hashtags: '#RutinaVitalcom', time: '12:00 PM' },
  { day: 'Miércoles', type: '🎬 Reel', content: 'Antes/después o testimonio de cliente', hashtags: '#Transformación #Real', time: '6:00 PM' },
  { day: 'Jueves', type: '💬 WhatsApp', content: 'Mensaje a leads calientes de la semana', hashtags: '', time: '9:00 AM' },
  { day: 'Viernes', type: '📸 Carrusel', content: '5 razones para elegir productos naturales', hashtags: '#SaludNatural #Vitalcom', time: '11:00 AM' },
  { day: 'Sábado', type: '🎬 TikTok', content: 'Trend viral adaptado a bienestar', hashtags: '#Trending #Bienestar', time: '3:00 PM' },
  { day: 'Domingo', type: '📱 Story', content: 'Reflexión + meta de la semana', hashtags: '#Motivación #Emprender', time: '8:00 PM' },
]

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('posts')
  const [copied, setCopied] = useState(false)
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [topic, setTopic] = useState('')

  function copyContent(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleGenerate() {
    if (!topic.trim()) return
    setGenerating(true)
    setTimeout(() => setGenerating(false), 1500)
  }

  const TABS: { key: ContentTab; label: string; icon: any }[] = [
    { key: 'posts', label: 'Posts', icon: Instagram },
    { key: 'stories', label: 'Stories', icon: Send },
    { key: 'tiktok', label: 'TikTok', icon: Video },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  ]

  return (
    <>
      <CommunityTopbar title="Marketing" subtitle="Genera contenido y estrategias para tu negocio" />
      <div className="flex-1 space-y-6 p-4 md:p-6">

        {/* ── Estrategias pre-diseñadas ──────────────── */}
        <div>
          <h2 className="heading-sm mb-4 flex items-center gap-2 px-1">
            <Target size={16} color="var(--vc-lime-main)" /> Estrategias listas para usar
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STRATEGIES.map((s) => {
              const isExpanded = expandedStrategy === s.id
              return (
                <div key={s.id} className="vc-card flex flex-col">
                  <div className="mb-2 flex items-start justify-between">
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
                      {s.target}
                    </span>
                  </div>
                  <h3 className="mb-1 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>{s.name}</h3>
                  <p className="mb-3 flex-1 text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>{s.description}</p>
                  <button
                    onClick={() => setExpandedStrategy(isExpanded ? null : s.id)}
                    className="mb-3 flex items-center gap-1 text-[10px] font-semibold"
                    style={{ color: 'var(--vc-lime-deep)', fontFamily: 'var(--font-heading)' }}
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {isExpanded ? 'Ocultar pasos' : 'Ver plan'}
                  </button>
                  {isExpanded && (
                    <div className="mb-3 space-y-1.5">
                      {s.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px]" style={{ color: 'var(--vc-white-dim)' }}>
                          <span className="shrink-0 font-mono font-bold" style={{ color: 'var(--vc-lime-main)' }}>{i + 1}.</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="vc-btn-primary w-full py-2 text-xs">
                    <Zap size={12} className="mr-1 inline" /> Activar estrategia
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Generador de contenido ─────────────────── */}
        <div className="vc-card">
          <h2 className="heading-sm mb-4 flex items-center gap-2">
            <Sparkles size={16} color="var(--vc-lime-main)" /> Generador de contenido
          </h2>

          {/* Tabs de tipo */}
          <div className="mb-4 flex gap-1 rounded-lg p-1" style={{ background: 'var(--vc-black-soft)' }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-all"
                style={{
                  background: activeTab === t.key ? 'var(--vc-black-mid)' : 'transparent',
                  color: activeTab === t.key ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                  border: activeTab === t.key ? '1px solid rgba(198,255,60,0.2)' : '1px solid transparent',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* Input de tema */}
          <div className="mb-4 flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: colágeno hidrolizado, kit detox, proteína vegana..."
              className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', color: 'var(--vc-white-soft)' }}
            />
            <button onClick={handleGenerate} disabled={generating} className="vc-btn-primary flex items-center gap-2 px-5 text-xs disabled:opacity-50">
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generar
            </button>
          </div>

          {/* Contenido generado */}
          <div className="relative rounded-xl p-4" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-body)' }}>
              {DEMO_CONTENT[activeTab]}
            </pre>
            <button
              onClick={() => copyContent(DEMO_CONTENT[activeTab])}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all"
              style={{
                background: copied ? 'rgba(198,255,60,0.15)' : 'var(--vc-black-mid)',
                color: copied ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                border: '1px solid var(--vc-gray-dark)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
        </div>

        {/* ── Calendario semanal ─────────────────────── */}
        <div className="vc-card">
          <h2 className="heading-sm mb-4 flex items-center gap-2">
            <Calendar size={16} color="var(--vc-lime-main)" /> Calendario semanal sugerido
          </h2>
          <div className="space-y-2">
            {WEEKLY_CALENDAR.map((day) => (
              <div key={day.day} className="flex items-center gap-4 rounded-lg p-3" style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}>
                <div className="w-20 shrink-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>{day.day}</p>
                  <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}>{day.time}</p>
                </div>
                <span className="shrink-0 text-sm">{day.type.split(' ')[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--vc-white-soft)' }}>{day.content}</p>
                  {day.hashtags && (
                    <p className="mt-0.5 text-[10px]" style={{ color: 'var(--vc-lime-deep)', fontFamily: 'var(--font-mono)' }}>{day.hashtags}</p>
                  )}
                </div>
                <button onClick={() => copyContent(`${day.content}\n${day.hashtags}`)} style={{ color: 'var(--vc-gray-mid)' }}>
                  <Copy size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Insights ───────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Star, title: 'Mejor producto', text: 'Colágeno Hidrolizado — 43% de ventas', color: 'var(--vc-lime-main)' },
            { icon: Calendar, title: 'Mejor hora', text: 'Publicar a las 10am y 6pm da 2x engagement', color: 'var(--vc-info)' },
            { icon: TrendingUp, title: 'Presupuesto ads', text: 'Con $50K COP/día en Meta Ads alcanzas 5K personas', color: 'var(--vc-warning)' },
            { icon: Megaphone, title: 'Próxima acción', text: 'Publica 3 reels esta semana — es lo que más convierte', color: 'var(--vc-lime-main)' },
          ].map((ins) => (
            <div key={ins.title} className="vc-card">
              <ins.icon size={18} style={{ color: ins.color }} className="mb-2" />
              <p className="mb-1 text-xs font-bold" style={{ color: ins.color, fontFamily: 'var(--font-heading)' }}>{ins.title}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
