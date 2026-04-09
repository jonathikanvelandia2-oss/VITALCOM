'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Users, TrendingUp, ShoppingBag, CheckCircle } from 'lucide-react'

// ── Métricas animadas con contadores, partículas y glow ──
// Se activa cuando la sección entra en viewport (IntersectionObserver)

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
      aria-label="Estadísticas de Vitalcom"
    >
      {/* Línea scan animada */}
      <div className="vc-scan-line" />

      {/* Partículas flotantes */}
      <FloatingParticles />

      {/* Glow central pulsante */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 600,
          height: 300,
          borderRadius: '50%',
          background: 'var(--vc-lime-main)',
          filter: 'blur(180px)',
          opacity: isVisible ? 0.08 : 0,
          transition: 'opacity 1.5s ease-out',
        }}
      />

      {/* Grid de métricas */}
      <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4 md:gap-12">
        {METRICS.map((m, i) => (
          <MetricCard key={m.label} metric={m} index={i} animate={isVisible} />
        ))}
      </div>

      {/* Línea decorativa inferior */}
      <div className="mx-auto mt-16 flex max-w-3xl items-center gap-4 px-6">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(198,255,60,0.3), transparent)' }} />
        <span
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--vc-lime-deep)', fontFamily: 'var(--font-mono)' }}
        >
          Datos en tiempo real
        </span>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(198,255,60,0.3), transparent)' }} />
      </div>
    </section>
  )
}

// ── Tarjeta individual con contador animado ──────────────

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
        // Easing: ease-out cubic
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
      className="group relative text-center"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
      }}
    >
      {/* Glow detrás del ícono al completar */}
      <div
        className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2"
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'var(--vc-lime-main)',
          filter: 'blur(60px)',
          opacity: done ? 0.15 : 0,
          transition: 'opacity 0.8s ease-out',
        }}
      />

      {/* Ícono con borde animado */}
      <div
        className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110"
        style={{
          background: done
            ? 'rgba(198, 255, 60, 0.12)'
            : 'rgba(198, 255, 60, 0.04)',
          border: done
            ? '1px solid rgba(198, 255, 60, 0.4)'
            : '1px solid rgba(198, 255, 60, 0.15)',
          boxShadow: done
            ? '0 0 30px rgba(198, 255, 60, 0.15), inset 0 0 20px rgba(198, 255, 60, 0.05)'
            : 'none',
          transition: 'all 0.6s ease-out',
        }}
      >
        <Icon
          size={24}
          style={{
            color: 'var(--vc-lime-main)',
            filter: done ? 'drop-shadow(0 0 8px rgba(198,255,60,0.5))' : 'none',
            transition: 'filter 0.6s ease-out',
          }}
        />
      </div>

      {/* Número animado */}
      <div className="relative">
        <p
          className="text-4xl font-black md:text-5xl lg:text-6xl"
          style={{
            fontFamily: 'var(--font-display)',
            background: done
              ? 'linear-gradient(135deg, #A8FF00 0%, #C6FF3C 40%, #DFFF80 100%)'
              : 'linear-gradient(135deg, #4A6B00 0%, #7FB800 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            transition: 'all 0.5s ease-out',
            filter: done ? 'drop-shadow(0 0 20px rgba(198,255,60,0.3))' : 'none',
          }}
        >
          {count.toLocaleString('es-CO')}{metric.suffix}
        </p>

        {/* Flash al completar */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'var(--vc-lime-main)',
            opacity: 0,
            borderRadius: 8,
            animation: done ? 'metric-flash 0.6s ease-out forwards' : 'none',
          }}
        />
      </div>

      {/* Label */}
      <p
        className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{
          color: done ? 'var(--vc-white-soft)' : 'var(--vc-white-dim)',
          fontFamily: 'var(--font-heading)',
          transition: 'color 0.5s ease-out',
        }}
      >
        {metric.label}
      </p>

      {/* Barra de progreso mini debajo del label */}
      <div className="mx-auto mt-2 h-0.5 overflow-hidden rounded-full" style={{ width: 40, background: 'var(--vc-gray-dark)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: done ? '100%' : '0%',
            background: 'var(--vc-lime-main)',
            boxShadow: '0 0 6px var(--vc-glow-lime)',
            transition: `width ${metric.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
          }}
        />
      </div>
    </div>
  )
}

// ── Partículas flotantes de fondo ────────────────────────

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            left: `${8 + (i * 7.5) % 90}%`,
            top: `${10 + (i * 13) % 80}%`,
            background: 'var(--vc-lime-main)',
            opacity: 0.15 + (i % 4) * 0.08,
            animation: `particle-float-${(i % 3) + 1} ${6 + (i % 5) * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  )
}
