'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, TrendingUp, ShoppingBag, CheckCircle } from 'lucide-react'

const METRICS = [
  { end: 1500, suffix: '+', label: 'Emprendedores activos', icon: Users, duration: 2000 },
  { end: 4, suffix: '', label: 'Países en LATAM', icon: TrendingUp, duration: 1200 },
  { end: 140, suffix: '+', label: 'Productos premium', icon: ShoppingBag, duration: 1800 },
  { end: 50, suffix: 'K+', label: 'Pedidos entregados', icon: CheckCircle, duration: 2200 },
]

export function AnimatedMetrics() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden py-24"
      style={{
        background: 'linear-gradient(180deg, rgba(198,255,60,0.04) 0%, rgba(10,10,10,0.95) 50%, rgba(198,255,60,0.03) 100%)',
        borderTop: '1px solid rgba(198, 255, 60, 0.08)',
        borderBottom: '1px solid rgba(198, 255, 60, 0.08)',
      }}
    >
      {/* Scan line */}
      <div className="vc-scan-line" />

      {/* Partículas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              left: `${10 + (i * 11) % 80}%`,
              top: `${15 + (i * 17) % 70}%`,
              background: 'var(--vc-lime-main)',
              opacity: 0.12 + (i % 3) * 0.06,
              animation: `particle-float-${(i % 3) + 1} ${7 + (i % 4) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Glow central */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 500, height: 250,
          background: 'var(--vc-lime-main)',
          filter: 'blur(160px)',
          opacity: isVisible ? 0.06 : 0,
          transition: 'opacity 2s ease-out',
        }}
      />

      {/* Métricas */}
      <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4 md:gap-12">
        {METRICS.map((m, i) => (
          <MetricCard key={m.label} metric={m} index={i} animate={isVisible} />
        ))}
      </div>

      {/* Línea inferior */}
      <div className="mx-auto mt-16 flex max-w-3xl items-center gap-4 px-6">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(198,255,60,0.3), transparent)' }} />
        <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--vc-lime-deep)', fontFamily: 'var(--font-mono)' }}>
          Datos en tiempo real
        </span>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(198,255,60,0.3), transparent)' }} />
      </div>
    </section>
  )
}

function MetricCard({ metric, index, animate }: {
  metric: typeof METRICS[0]; index: number; animate: boolean
}) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const Icon = metric.icon

  useEffect(() => {
    if (!animate) return
    const delay = index * 200
    const timer = setTimeout(() => {
      const startTime = Date.now()
      const step = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / metric.duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(eased * metric.end))
        if (progress < 1) {
          requestAnimationFrame(step)
        } else {
          setDone(true)
        }
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timer)
  }, [animate, metric.end, metric.duration, index])

  return (
    <div
      className="group text-center"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.8s ease-out ${index * 0.15}s, transform 0.8s ease-out ${index * 0.15}s`,
      }}
    >
      {/* Ícono */}
      <div
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110"
        style={{
          background: 'rgba(198, 255, 60, 0.08)',
          border: '1px solid rgba(198, 255, 60, 0.25)',
          boxShadow: done ? '0 0 20px rgba(198, 255, 60, 0.12)' : 'none',
        }}
      >
        <Icon size={22} color="var(--vc-lime-main)" />
      </div>

      {/* Número — SIN background-clip, SIN filter, color directo */}
      <p
        className="vc-text-gradient text-4xl font-black md:text-5xl lg:text-6xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {count.toLocaleString('es-CO')}{metric.suffix}
      </p>

      {/* Label */}
      <p
        className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}
      >
        {metric.label}
      </p>

      {/* Barra de progreso */}
      <div className="mx-auto mt-3 h-0.5 overflow-hidden rounded-full" style={{ width: 40, background: 'var(--vc-gray-dark)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: done ? '100%' : '0%',
            background: 'var(--vc-lime-main)',
            boxShadow: '0 0 6px var(--vc-glow-lime)',
            transition: `width ${metric.duration}ms ease-out ${index * 0.15}s`,
          }}
        />
      </div>
    </div>
  )
}
