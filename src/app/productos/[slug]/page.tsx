'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import {
  ShoppingCart, Star, Truck, Shield, Award, Leaf,
  ChevronDown, Package, Heart, Zap, Check, ArrowRight,
  Loader2, X, Plus, Minus,
} from 'lucide-react'

// ── Landing dinámica de producto Vitalcom ──────────────
// Cada producto tiene su propia landing con video parallax,
// ingredientes, beneficios, testimonios y carrito.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

function cloudImg(url: string, transforms = 'f_auto,q_auto,w_800,c_fill') {
  if (!CLOUD_NAME || !url) return url
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transforms}/${encodeURIComponent(url)}`
}

type Product = {
  id: string; sku: string; name: string; slug: string
  description?: string; category?: string; tags: string[]
  images: string[]; precioPublico: number; precioComunidad: number
  precioPrivado: number; bestseller: boolean; videoUrl?: string
  ingredients?: any[]; benefits?: any[]; howToUse?: string
  testimonials?: any[]; stock: { country: string; quantity: number }[]
}

type CartItem = { name: string; price: number; qty: number }

export default function ProductLandingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    fetch(`/api/products/slug/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setProduct(d.data); else setError('Producto no encontrado') })
      .catch(() => setError('Error al cargar'))
      .finally(() => setLoading(false))
  }, [slug])

  // Video parallax controlado por scroll
  useEffect(() => {
    function onScroll() {
      setScrollY(window.scrollY)
      if (videoRef.current) {
        const maxScroll = window.innerHeight
        const pct = Math.min(window.scrollY / maxScroll, 1)
        videoRef.current.currentTime = pct * (videoRef.current.duration || 8)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function addToCart(name: string, price: number) {
    setCart(prev => {
      const existing = prev.find(i => i.name === name)
      if (existing) return prev.map(i => i.name === name ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { name, price, qty: 1 }]
    })
    setShowCart(true)
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--vc-black)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--vc-lime-main)' }} />
    </div>
  )

  if (error || !product) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: 'var(--vc-black)' }}>
      <Package size={48} style={{ color: 'var(--vc-gray-mid)' }} />
      <p style={{ color: 'var(--vc-white-dim)' }}>{error || 'Producto no encontrado'}</p>
      <a href="/" className="vc-btn-primary px-6 py-2 text-sm">Volver al inicio</a>
    </div>
  )

  const heroImg = product.images?.[0] || ''
  const heroOpacity = Math.max(1 - scrollY / 400, 0)
  const stockCO = product.stock?.find(s => s.country === 'CO')
  const inStock = (stockCO?.quantity ?? 0) > 0
  const margin = product.precioPublico - product.precioComunidad
  const marginPct = Math.round((margin / product.precioPublico) * 100)

  const defaultIngredients = product.ingredients ?? product.tags.slice(0, 6).map(t => ({
    name: t.charAt(0).toUpperCase() + t.slice(1),
    description: `Ingrediente activo de ${product.name}`,
  }))

  const defaultBenefits = product.benefits ?? [
    { title: 'Natural', description: 'Ingredientes de origen natural' },
    { title: 'Calidad Premium', description: 'Formulación avanzada' },
    { title: 'Fácil de consumir', description: product.category === 'Cápsulas' ? 'Cápsulas fáciles de tragar' : `Formato ${product.category?.toLowerCase()}` },
    { title: 'Multi-país', description: 'Disponible en CO, EC, GT, CL' },
  ]

  const defaultTestimonials = product.testimonials ?? [
    { name: 'María R.', text: `Llevo 2 meses con ${product.name} y me encanta. Se nota la diferencia.`, rating: 5 },
    { name: 'Andrés G.', text: 'Excelente calidad, envío rápido. Ya lo recomendé a mi familia.', rating: 5 },
    { name: 'Laura M.', text: 'La mejor relación calidad-precio que he encontrado.', rating: 4 },
  ]

  return (
    <div style={{ background: 'var(--vc-black)' }}>
      {/* ═══ HERO — Video Parallax ═══ */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Video o imagen de fondo */}
        {product.videoUrl ? (
          <video
            ref={videoRef}
            src={product.videoUrl}
            muted playsInline preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0.4 }}
          />
        ) : heroImg ? (
          <div className="absolute inset-0" style={{ opacity: 0.3 }}>
            <Image
              src={cloudImg(heroImg, 'f_auto,q_auto,w_1200,h_800,c_fill')}
              alt={product.name}
              fill className="object-cover"
              priority unoptimized
            />
          </div>
        ) : null}

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.95) 100%)' }} />

        {/* Glow radial */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(198,255,60,0.08) 0%, transparent 60%)' }} />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center" style={{ opacity: heroOpacity, transform: `translateY(${scrollY * 0.3}px)` }}>
          {product.bestseller && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
              style={{ background: 'rgba(198,255,60,0.1)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.3)', fontFamily: 'var(--font-heading)' }}>
              <Star size={12} fill="currentColor" /> Bestseller
            </span>
          )}

          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em]"
            style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
            {product.category} · {product.sku}
          </p>

          <h1 className="mb-6 text-5xl font-black uppercase leading-tight md:text-7xl"
            style={{ fontFamily: 'var(--font-display)', background: 'var(--vc-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {product.name}
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed"
            style={{ color: 'var(--vc-white-dim)' }}>
            {product.description || `Fórmula premium de ${product.category?.toLowerCase()} con ingredientes activos de alta calidad. Bienestar natural para tu día a día.`}
          </p>

          <div className="mb-8 flex items-center justify-center gap-6">
            <div>
              <p className="text-3xl font-black" style={{ color: 'var(--vc-white)', fontFamily: 'var(--font-display)' }}>
                $ {product.precioPublico.toLocaleString('es-CO')}
              </p>
              <p className="text-xs" style={{ color: 'var(--vc-lime-main)' }}>
                Comunidad: $ {product.precioComunidad.toLocaleString('es-CO')} ({marginPct}% margen)
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => addToCart(product.name, product.precioPublico)}
              className="vc-btn-primary flex items-center gap-2 px-8 py-4 text-sm"
            >
              <ShoppingCart size={18} /> Agregar al carrito
            </button>
            <a href="#formula" className="flex items-center gap-2 rounded-xl px-6 py-4 text-sm font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--vc-white-soft)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-heading)' }}>
              Explorar fórmula <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} style={{ color: 'var(--vc-lime-main)', opacity: 0.6 }} />
        </div>
      </section>

      {/* ═══ PRODUCTO DETALLE ═══ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl" style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.15)' }}>
            {heroImg ? (
              <Image
                src={cloudImg(heroImg, 'f_auto,q_auto,w_600,h_600,c_fill,e_improve')}
                alt={product.name} fill className="object-cover p-8"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package size={80} style={{ color: 'var(--vc-gray-dark)' }} />
              </div>
            )}
            {inStock && (
              <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: 'rgba(198,255,60,0.15)', color: 'var(--vc-lime-main)' }}>
                <Check size={12} className="mr-1 inline" /> En stock
              </span>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-3xl font-black uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--vc-white)' }}>
              {product.name}
            </h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
              {product.description || `Suplemento premium de la línea ${product.category} de Vitalcom. Ingredientes naturales seleccionados para tu bienestar diario.`}
            </p>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { val: product.tags.length + '+', label: 'Ingredientes' },
                { val: product.category === 'Cápsulas' ? '60' : '30', label: product.category === 'Cápsulas' ? 'Cápsulas' : 'Porciones' },
                { val: '4', label: 'Países' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
                  <p className="text-xl font-black" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>{s.val}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vc-white-dim)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              {product.tags.map(t => (
                <span key={t} className="rounded-full px-3 py-1 text-xs"
                  style={{ background: 'rgba(198,255,60,0.08)', color: 'var(--vc-lime-main)', border: '1px solid rgba(198,255,60,0.2)' }}>
                  {t}
                </span>
              ))}
            </div>

            {/* Precio + CTA */}
            <div className="rounded-xl p-5" style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.2)' }}>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>Precio público</p>
                  <p className="text-3xl font-black" style={{ color: 'var(--vc-white)', fontFamily: 'var(--font-display)' }}>
                    $ {product.precioPublico.toLocaleString('es-CO')} <span className="text-sm font-normal" style={{ color: 'var(--vc-white-dim)' }}>COP</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--vc-lime-main)' }}>Precio comunidad</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}>
                    $ {product.precioComunidad.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => addToCart(product.name, product.precioPublico)}
                className="vc-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-sm"
              >
                <ShoppingCart size={16} /> Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FÓRMULA — Grid de ingredientes ═══ */}
      <section id="formula" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-2 text-center text-3xl font-black uppercase"
          style={{ fontFamily: 'var(--font-display)', background: 'var(--vc-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Nuestra fórmula
        </h2>
        <p className="mx-auto mb-12 max-w-md text-center text-sm" style={{ color: 'var(--vc-white-dim)' }}>
          Ingredientes activos seleccionados para máxima efectividad
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {defaultIngredients.map((ing: any, i: number) => (
            <div key={i} className="group rounded-xl p-5 transition-all hover:scale-[1.02]"
              style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: 'rgba(198,255,60,0.08)' }}>
                <Leaf size={18} style={{ color: 'var(--vc-lime-main)' }} />
              </div>
              <h3 className="mb-1 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                {ing.name}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                {ing.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ POR QUÉ ELEGIRLO ═══ */}
      <section className="py-20" style={{ background: 'var(--vc-black-mid)' }}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-black uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--vc-white)' }}>
            ¿Por qué {product.name}?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {defaultBenefits.map((b: any, i: number) => {
              const icons = [Zap, Heart, Award, Shield]
              const Icon = icons[i % icons.length]
              return (
                <div key={i} className="rounded-xl p-6 text-center"
                  style={{ background: 'var(--vc-black)', border: '1px solid var(--vc-gray-dark)' }}>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(198,255,60,0.1)', border: '1px solid rgba(198,255,60,0.2)' }}>
                    <Icon size={24} style={{ color: 'var(--vc-lime-main)' }} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
                    {b.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>{b.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIOS ═══ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-black uppercase"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--vc-white)' }}>
          Testimonios
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {defaultTestimonials.map((t: any, i: number) => (
            <div key={i} className="rounded-xl p-6"
              style={{ background: 'var(--vc-black-mid)', border: '1px solid var(--vc-gray-dark)' }}>
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} fill="var(--vc-lime-main)" style={{ color: 'var(--vc-lime-main)' }} />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                &quot;{t.text}&quot;
              </p>
              <p className="text-xs font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
                {t.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ENVÍO Y CONFIANZA ═══ */}
      <section className="py-16" style={{ background: 'var(--vc-black-mid)' }}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-6">
          {[
            { icon: Truck, label: 'Envío a todo Colombia' },
            { icon: Shield, label: 'Pago 100% seguro' },
            { icon: Award, label: 'Calidad garantizada' },
            { icon: Heart, label: 'Soporte humano' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={18} style={{ color: 'var(--vc-lime-main)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--vc-white-dim)' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 text-center" style={{ borderTop: '1px solid var(--vc-gray-dark)' }}>
        <p className="mb-2 text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
          © {new Date().getFullYear()} Vitalcom — Bienestar que conecta
        </p>
        <p className="mx-auto max-w-lg text-[10px] leading-relaxed" style={{ color: 'var(--vc-gray-mid)' }}>
          Este producto no pretende diagnosticar, tratar, curar ni prevenir enfermedades.
          Consulta a tu médico antes de iniciar cualquier suplemento.
        </p>
      </footer>

      {/* ═══ CARRITO FLOTANTE ═══ */}
      {cart.length > 0 && (
        <div className={`fixed bottom-4 right-4 z-50 w-80 rounded-2xl shadow-2xl transition-all duration-300 ${showCart ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-90'}`}
          style={{ background: 'var(--vc-black-mid)', border: '1px solid rgba(198,255,60,0.3)', boxShadow: '0 0 40px rgba(198,255,60,0.1)' }}>
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--vc-gray-dark)' }}>
            <span className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}>
              <ShoppingCart size={16} style={{ color: 'var(--vc-lime-main)' }} /> Carrito
            </span>
            <button onClick={() => setShowCart(!showCart)} style={{ color: 'var(--vc-gray-mid)' }}>
              {showCart ? <X size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          {showCart && (
            <div className="p-4">
              {cart.map((item, i) => (
                <div key={i} className="mb-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: 'var(--vc-white-soft)' }}>{item.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-mono)' }}>
                      $ {item.price.toLocaleString('es-CO')} × {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCart(prev => prev.map(c => c.name === item.name ? { ...c, qty: Math.max(1, c.qty - 1) } : c))}
                      className="rounded p-1" style={{ background: 'var(--vc-black-soft)' }}>
                      <Minus size={12} style={{ color: 'var(--vc-white-dim)' }} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold" style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-mono)' }}>{item.qty}</span>
                    <button onClick={() => setCart(prev => prev.map(c => c.name === item.name ? { ...c, qty: c.qty + 1 } : c))}
                      className="rounded p-1" style={{ background: 'var(--vc-black-soft)' }}>
                      <Plus size={12} style={{ color: 'var(--vc-lime-main)' }} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--vc-gray-dark)', paddingTop: '0.75rem' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--vc-white-dim)' }}>Total</span>
                <span className="text-lg font-black" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>
                  $ {cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString('es-CO')}
                </span>
              </div>
              <button className="vc-btn-primary mt-3 w-full py-3 text-sm">
                Proceder al pago
              </button>
              <button onClick={() => { setCart([]); setShowCart(false) }}
                className="mt-2 w-full py-2 text-center text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
                Vaciar carrito
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
