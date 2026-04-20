'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Copy, Check, RefreshCw, Send, Instagram,
  MessageCircle, Video, Calendar, Target, TrendingUp,
  Megaphone, ChevronDown, ChevronUp, Zap, Star, AlertCircle,
} from 'lucide-react'
import { CommunityTopbar } from '@/components/community/CommunityTopbar'

// ── Marketing VITALCOMMER ───────────────────────────────
// Estrategias de referencia + generador de contenido AI
// conectado a /api/marketing/generate (OpenAI).
// Los 6 planes de estrategia son contenido educativo estático
// (guías de proceso) — para flujos automatizados, ir a /automatizaciones.

type ContentTab = 'posts' | 'stories' | 'tiktok' | 'whatsapp'

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

const WEEKLY_CALENDAR = [
  { day: 'Lunes', type: '📸 Post', content: 'Beneficios del producto estrella', hashtags: '#BienestarNatural #Tips', time: '10:00 AM' },
  { day: 'Martes', type: '📱 Story', content: 'Detrás de cámaras: tu rutina con productos', hashtags: '#RutinaVitalcom', time: '12:00 PM' },
  { day: 'Miércoles', type: '🎬 Reel', content: 'Antes/después o testimonio de cliente', hashtags: '#Transformación #Real', time: '6:00 PM' },
  { day: 'Jueves', type: '💬 WhatsApp', content: 'Mensaje a leads calientes de la semana', hashtags: '', time: '9:00 AM' },
  { day: 'Viernes', type: '📸 Carrusel', content: '5 razones para elegir productos naturales', hashtags: '#SaludNatural #Vitalcom', time: '11:00 AM' },
  { day: 'Sábado', type: '🎬 TikTok', content: 'Trend viral adaptado a bienestar', hashtags: '#Trending #Bienestar', time: '3:00 PM' },
  { day: 'Domingo', type: '📱 Story', content: 'Reflexión + meta de la semana', hashtags: '#Motivación #Emprender', time: '8:00 PM' },
]

const INSIGHTS = [
  { icon: Star, title: 'Mejor horario', text: 'Publicar entre 10am y 6pm duplica el engagement en LATAM', color: 'var(--vc-lime-main)' },
  { icon: Calendar, title: 'Frecuencia ideal', text: '3-5 publicaciones por semana mantienen audiencia activa', color: 'var(--vc-info)' },
  { icon: TrendingUp, title: 'Formatos top', text: 'Reels y carruseles tienen 2-3x más alcance que fotos estáticas', color: 'var(--vc-warning)' },
  { icon: Megaphone, title: 'Siguiente paso', text: 'Activa "Seguimiento postventa" en Automatizaciones para pedir reseñas', color: 'var(--vc-lime-main)' },
]

const TABS: { key: ContentTab; label: string; icon: any }[] = [
  { key: 'posts', label: 'Posts', icon: Instagram },
  { key: 'stories', label: 'Stories', icon: Send },
  { key: 'tiktok', label: 'TikTok', icon: Video },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
]

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('posts')
  const [copied, setCopied] = useState(false)
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  function copyContent(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleGenerate() {
    const trimmed = topic.trim()
    if (!trimmed) return
    setGenerating(true)
    setGenError(null)
    setWarning(null)
    try {
      const res = await fetch('/api/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, topic: trimmed }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Error generando contenido')
      setContent(json.data.content)
      if (json.data.warning) setWarning(json.data.warning)
    } catch (err) {
      setGenError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <CommunityTopbar title="Marketing" subtitle="Genera contenido y acciona estrategias" />
      <div className="flex-1 space-y-6 p-4 md:p-6">

        {/* ── Estrategias ────────────────────────────── */}
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
                    <span
                      className="text-[9px] font-bold uppercase"
                      style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}
                    >
                      {s.target}
                    </span>
                  </div>
                  <h3
                    className="mb-1 text-sm font-bold"
                    style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                  >
                    {s.name}
                  </h3>
                  <p className="mb-3 flex-1 text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                    {s.description}
                  </p>
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
                        <div
                          key={i}
                          className="flex items-start gap-2 text-[10px]"
                          style={{ color: 'var(--vc-white-dim)' }}
                        >
                          <span
                            className="shrink-0 font-mono font-bold"
                            style={{ color: 'var(--vc-lime-main)' }}
                          >
                            {i + 1}.
                          </span>
                          {step}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/automatizaciones"
                    className="vc-btn-primary flex w-full items-center justify-center gap-1 py-2 text-xs"
                  >
                    <Zap size={12} /> Ir a Automatizaciones
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Generador de contenido AI ────────────── */}
        <div className="vc-card">
          <h2 className="heading-sm mb-4 flex items-center gap-2">
            <Sparkles size={16} color="var(--vc-lime-main)" /> Generador de contenido AI
          </h2>

          <div className="mb-4 flex gap-1 rounded-lg p-1" style={{ background: 'var(--vc-black-soft)' }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key)
                  setContent('')
                  setGenError(null)
                  setWarning(null)
                }}
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

          <div className="mb-4 flex flex-wrap gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: colágeno hidrolizado, kit detox, proteína vegana..."
              maxLength={200}
              className="flex-1 min-w-[240px] rounded-lg px-4 py-3 text-sm outline-none"
              style={{
                background: 'var(--vc-black-soft)',
                border: '1px solid var(--vc-gray-dark)',
                color: 'var(--vc-white-soft)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="vc-btn-primary flex items-center gap-2 px-5 text-xs disabled:opacity-50"
            >
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? 'Generando...' : 'Generar'}
            </button>
          </div>

          {warning && (
            <div
              className="mb-3 flex items-center gap-2 rounded-lg p-3 text-[11px]"
              style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)', color: 'var(--vc-warning)' }}
            >
              <AlertCircle size={14} />
              {warning}
            </div>
          )}

          {genError && (
            <p className="mb-3 text-xs" style={{ color: 'var(--vc-error)' }}>
              {genError}
            </p>
          )}

          <div
            className="relative rounded-xl p-4"
            style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)', minHeight: 180 }}
          >
            {content ? (
              <>
                <pre
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-body)' }}
                >
                  {content}
                </pre>
                <button
                  onClick={() => copyContent(content)}
                  className="absolute right-3 top-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all"
                  style={{
                    background: copied ? 'rgba(198,255,60,0.15)' : 'var(--vc-black-mid)',
                    color: copied ? 'var(--vc-lime-main)' : 'var(--vc-white-dim)',
                    border: '1px solid var(--vc-gray-dark)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={12} /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copiar
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Sparkles size={24} className="mb-2 opacity-30" style={{ color: 'var(--vc-white-dim)' }} />
                <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                  Escribe un producto o tema arriba y genera {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Calendario ─────────────────────────────── */}
        <div className="vc-card">
          <h2 className="heading-sm mb-4 flex items-center gap-2">
            <Calendar size={16} color="var(--vc-lime-main)" /> Calendario semanal sugerido
          </h2>
          <div className="space-y-2">
            {WEEKLY_CALENDAR.map((day) => (
              <div
                key={day.day}
                className="flex items-center gap-4 rounded-lg p-3"
                style={{ background: 'var(--vc-black-soft)', border: '1px solid var(--vc-gray-dark)' }}
              >
                <div className="w-20 shrink-0">
                  <p
                    className="text-xs font-bold"
                    style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}
                  >
                    {day.day}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                  >
                    {day.time}
                  </p>
                </div>
                <span className="shrink-0 text-sm">{day.type.split(' ')[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--vc-white-soft)' }}>
                    {day.content}
                  </p>
                  {day.hashtags && (
                    <p
                      className="mt-0.5 text-[10px]"
                      style={{ color: 'var(--vc-lime-deep)', fontFamily: 'var(--font-mono)' }}
                    >
                      {day.hashtags}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => copyContent(`${day.content}\n${day.hashtags}`)}
                  aria-label="Copiar"
                  style={{ color: 'var(--vc-gray-mid)' }}
                >
                  <Copy size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Insights ───────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {INSIGHTS.map((ins) => (
            <div key={ins.title} className="vc-card">
              <ins.icon size={18} style={{ color: ins.color }} className="mb-2" />
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: ins.color, fontFamily: 'var(--font-heading)' }}
              >
                {ins.title}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                {ins.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
