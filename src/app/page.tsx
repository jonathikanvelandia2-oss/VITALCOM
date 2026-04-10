import Image from 'next/image'
import Link from 'next/link'
import {
  Users,
  ShoppingBag,
  GraduationCap,
  Zap,
  ArrowRight,
  Rocket,
  Star,
  CheckCircle,
  TrendingUp,
  MessageCircle,
  Shield,
  Heart,
} from 'lucide-react'
import { CountryFlag } from '@/components/shared/CountryFlag'
import { AnimatedMetrics } from '@/components/marketing/AnimatedMetrics'

// Homepage Vitalcom v3 — máximo impacto visual + SEO + conversión
// Keywords: productos de bienestar, dropshipping Colombia, vender sin inversión,
// comunidad de emprendedores, suplementos naturales, ganar dinero desde casa
export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ── MATRIX RAIN — CSS puro, sin JS ── */}
      <div className="vc-matrix-rain pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
        <div className="vc-matrix-col" style={{ left: '5%', animationDuration: '18s', animationDelay: '0s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '12%', animationDuration: '22s', animationDelay: '-4s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '20%', animationDuration: '16s', animationDelay: '-8s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '30%', animationDuration: '24s', animationDelay: '-2s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '40%', animationDuration: '20s', animationDelay: '-10s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '50%', animationDuration: '17s', animationDelay: '-6s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '60%', animationDuration: '23s', animationDelay: '-12s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '70%', animationDuration: '19s', animationDelay: '-3s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '80%', animationDuration: '21s', animationDelay: '-7s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
        <div className="vc-matrix-col" style={{ left: '90%', animationDuration: '25s', animationDelay: '-14s' }}>VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM·VITALCOM</div>
      </div>

      {/* ── FONDOS AMBIENTALES DINÁMICOS ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--vc-gradient-hero)' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--vc-gradient-glow)' }}
      />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full vc-orbit"
        style={{ background: 'var(--vc-gradient-primary)', filter: 'blur(140px)', opacity: 0.2 }}
      />
      <div
        className="pointer-events-none absolute -bottom-60 -left-40 h-[500px] w-[500px] rounded-full vc-orbit-reverse"
        style={{ background: 'var(--vc-gradient-primary)', filter: 'blur(120px)', opacity: 0.12 }}
      />
      {/* Grid sutil de fondo */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--vc-lime-main) 1px, transparent 1px), linear-gradient(90deg, var(--vc-lime-main) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* ── NAVBAR ── */}
      <header
        className="vc-reveal relative z-20 flex items-center justify-between px-6 py-4 md:px-16"
        style={{
          background: 'rgba(10, 10, 10, 0.7)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(198, 255, 60, 0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/assets/branding/logo-vitalcom.jpeg"
            alt="Vitalcom — Plataforma de bienestar"
            width={40}
            height={40}
            className="rounded-full"
            style={{
              boxShadow: '0 0 14px var(--vc-glow-lime)',
              border: '1px solid rgba(198, 255, 60, 0.3)',
            }}
            priority
          />
          <span
            className="vc-text-gradient text-lg font-black tracking-wider"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            VITALCOM
          </span>
        </div>
        <nav className="hidden items-center gap-8 lg:flex">
          {['Comunidad', 'Catálogo', 'Cursos', 'Herramientas'].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium transition-colors hover:text-[--vc-lime-main]"
              style={{
                color: 'var(--vc-white-dim)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-semibold transition-colors hover:text-[--vc-lime-main] sm:block"
            style={{
              color: 'var(--vc-white-dim)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_20px_var(--vc-glow-lime)]"
            style={{
              background: 'var(--vc-lime-main)',
              color: 'var(--vc-black)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Unirme gratis
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          HERO — Máximo impacto visual + conversión
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col items-center px-6 pb-20 pt-16 md:pt-24">
        {/* Badge live */}
        <div
          className="vc-reveal mb-8 flex items-center gap-2.5 rounded-full px-5 py-2.5 vc-border-glow"
          style={{
            background: 'rgba(198, 255, 60, 0.06)',
            border: '1px solid rgba(198, 255, 60, 0.25)',
          }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full vc-pulse"
            style={{
              background: 'var(--vc-lime-main)',
              boxShadow: '0 0 10px var(--vc-glow-strong)',
            }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-[0.15em]"
            style={{
              color: 'var(--vc-lime-main)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            En vivo · 1.500+ emprendedores activos ahora
          </span>
        </div>

        {/* Logo 3D efecto moneda */}
        <div className="vc-reveal-d1 relative mb-10" style={{ perspective: '800px' }}>
          {/* Anillo exterior pulsante */}
          <div
            className="absolute -inset-6 rounded-full vc-pulse"
            style={{ border: '1px solid rgba(198, 255, 60, 0.15)' }}
          />
          {/* Segundo anillo */}
          <div
            className="absolute -inset-3 rounded-full"
            style={{
              border: '1px solid rgba(198, 255, 60, 0.3)',
              animation: 'vc-pulse 2.5s ease-in-out infinite 0.5s',
            }}
          />
          {/* Glow detrás */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: '0 0 80px var(--vc-glow-lime), 0 0 160px rgba(198,255,60,0.2), 0 0 240px rgba(198,255,60,0.08)',
            }}
          />
          {/* Logo con flip 3D */}
          <Image
            src="/assets/branding/logo-vitalcom.jpeg"
            alt="Vitalcom — Productos de bienestar en Latinoamérica"
            width={160}
            height={160}
            className="relative rounded-full vc-coin-logo"
            style={{
              border: '2px solid rgba(198, 255, 60, 0.5)',
              boxShadow: '0 0 40px var(--vc-glow-lime)',
            }}
            priority
          />
        </div>

        {/* Headline principal — SEO H1 */}
        <h1
          className="vc-reveal-d2 mb-6 text-center text-5xl font-black leading-[1.05] md:text-7xl lg:text-[5.5rem]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span style={{ color: 'var(--vc-white-soft)' }}>VENDE</span>
          <br className="md:hidden" />{' '}
          <span className="vc-text-gradient-animated">BIENESTAR</span>
          <br />
          <span style={{ color: 'var(--vc-white-soft)' }}>GANA</span>
          <br className="md:hidden" />{' '}
          <span className="vc-text-gradient-animated">LIBERTAD</span>
        </h1>

        {/* Subtítulo SEO */}
        <p
          className="vc-reveal-d3 mb-5 max-w-2xl text-center text-lg font-medium leading-relaxed md:text-xl"
          style={{
            color: 'var(--vc-white-dim)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Únete a la comunidad de emprendedores de bienestar más grande de{' '}
          <span style={{ color: 'var(--vc-lime-main)', fontWeight: 700 }}>Latinoamérica</span>.
          Productos listos, envío incluido, ganancias reales.
        </p>

        {/* Bullets de valor rápidos */}
        <div
          className="vc-reveal-d4 mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {[
            'Sin inversión inicial',
            'Envío a todo Colombia',
            'Ganancias desde el día 1',
          ].map((t) => (
            <span
              key={t}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--vc-white-soft)' }}
            >
              <CheckCircle size={16} color="var(--vc-lime-main)" />
              {t}
            </span>
          ))}
        </div>

        {/* CTAs principales */}
        <div
          className="vc-reveal-d5 mb-6 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href="/register"
            className="vc-btn-primary vc-pulse flex items-center justify-center gap-2.5 px-10 py-4 text-base md:px-12 md:py-5 md:text-lg"
          >
            <Rocket size={22} />
            Empieza gratis ahora
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all hover:bg-[rgba(198,255,60,0.08)] hover:shadow-[0_0_24px_var(--vc-glow-lime)]"
            style={{
              background: 'transparent',
              color: 'var(--vc-lime-main)',
              border: '1px solid rgba(198, 255, 60, 0.4)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Ya tengo cuenta
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Social proof estrellas */}
        <div className="vc-reveal-d6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((i) => (
              <Star key={i} size={16} fill="var(--vc-lime-main)" color="var(--vc-lime-main)" />
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--vc-white-dim)' }}>
            <strong style={{ color: 'var(--vc-white-soft)' }}>4.9/5</strong> — valorado por +1.200 emprendedores activos
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PAÍSES — Presencia en 4 países con banderas SVG
         ══════════════════════════════════════════════════ */}
      <section
        className="relative z-10 py-16"
        style={{ borderTop: '1px solid rgba(198, 255, 60, 0.06)' }}
        aria-label="Países donde opera Vitalcom"
      >
        <div className="mx-auto max-w-5xl px-6">
          <p
            className="mb-8 text-center text-[11px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
          >
            Presencia activa en 4 países
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8">
            {([
              { code: 'CO' as const, name: 'Colombia', members: '920+', status: 'Sede principal' },
              { code: 'EC' as const, name: 'Ecuador', members: '280+', status: 'Operativo' },
              { code: 'GT' as const, name: 'Guatemala', members: '180+', status: 'Operativo' },
              { code: 'CL' as const, name: 'Chile', members: '120+', status: 'Operativo' },
            ]).map((c, i) => (
              <div
                key={c.code}
                className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl px-6 py-5 transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_var(--vc-glow-lime)] vc-reveal-d${i+1}`}
                style={{
                  background: 'var(--vc-black-mid)',
                  border: '1px solid rgba(198, 255, 60, 0.12)',
                }}
              >
                {/* Scan line */}
                <div className="vc-scan-line" />
                <div
                  className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <CountryFlag country={c.code} size={44} />
                </div>
                <div>
                  <p
                    className="text-base font-bold"
                    style={{
                      color: 'var(--vc-white-soft)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {c.name}
                  </p>
                  <p
                    className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--vc-lime-main)' }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        background: 'var(--vc-lime-main)',
                        boxShadow: '0 0 6px var(--vc-glow-strong)',
                      }}
                    />
                    {c.members} miembros
                  </p>
                  <p
                    className="mt-0.5 text-[9px]"
                    style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                  >
                    {c.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MÉTRICAS — Contadores animados con partículas
         ══════════════════════════════════════════════════ */}
      <AnimatedMetrics />

      {/* ══════════════════════════════════════════════════
          COMUNIDAD — El corazón de Vitalcom
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-24" aria-label="Comunidad Vitalcom de emprendedores">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'var(--vc-lime-main)', filter: 'blur(250px)', opacity: 0.05 }}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.3em]"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
            >
              Más que una plataforma, una familia
            </p>
            <h2
              className="mb-5 text-3xl font-black leading-tight md:text-5xl"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}
            >
              LA COMUNIDAD{' '}
              <span className="vc-text-gradient-animated">VITALCOM</span>
            </h2>
            <p
              className="mx-auto max-w-2xl text-base leading-relaxed md:text-lg"
              style={{ color: 'var(--vc-white-dim)' }}
            >
              Aquí no solo vendes: aprendes, conectas y creces con personas reales
              que comparten tus mismos sueños. Nadie camina solo.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: 'Red de emprendedores',
                desc: 'Conecta con personas reales que ya viven de esto. Estrategias, motivación y networking diario.',
                stat: '1.500+',
                statLabel: 'Miembros activos',
              },
              {
                icon: GraduationCap,
                title: 'Aprende de los mejores',
                desc: 'Cursos creados por los top sellers. Dropshipping, WhatsApp, redes sociales y mindset ganador.',
                stat: '6',
                statLabel: 'Cursos gratuitos',
              },
              {
                icon: ShoppingBag,
                title: 'Catálogo listo para ti',
                desc: 'Productos premium que se venden solos. Tú compartes, nosotros enviamos. Cero complicaciones.',
                stat: '140+',
                statLabel: 'Productos listos',
              },
              {
                icon: Zap,
                title: 'Herramientas PRO',
                desc: 'Calculadora de ganancias, chatbots automáticos y catálogo digital. Todo gratis e ilimitado.',
                stat: '3',
                statLabel: 'Tools incluidas',
              },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_0_40px_var(--vc-glow-lime)] vc-reveal-d${i+1}`}
                  style={{
                    background: 'var(--vc-black-mid)',
                    border: '1px solid rgba(198, 255, 60, 0.1)',
                  }}
                >
                  <div className="vc-scan-line" />
                  <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{
                      background: 'rgba(198, 255, 60, 0.03)',
                      borderBottom: '1px solid rgba(198, 255, 60, 0.06)',
                    }}
                  >
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:shadow-[0_0_20px_var(--vc-glow-lime)] group-hover:scale-110"
                      style={{
                        background: 'rgba(198, 255, 60, 0.1)',
                        border: '1px solid rgba(198, 255, 60, 0.25)',
                      }}
                    >
                      <Icon size={22} color="var(--vc-lime-main)" />
                    </div>
                    <div className="text-right">
                      <p
                        className="vc-text-gradient text-2xl font-black"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {f.stat}
                      </p>
                      <p
                        className="text-[8px] uppercase tracking-wider"
                        style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                      >
                        {f.statLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                    <h3
                      className="mb-2.5 text-lg font-bold"
                      style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                    >
                      {f.title}
                    </h3>
                    <p
                      className="mb-5 flex-1 text-sm leading-relaxed"
                      style={{ color: 'var(--vc-white-dim)' }}
                    >
                      {f.desc}
                    </p>
                    <div
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-all group-hover:gap-3"
                      style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}
                    >
                      Explorar <ArrowRight size={13} />
                    </div>
                  </div>

                  <div
                    className="h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                    style={{
                      background: 'var(--vc-gradient-primary)',
                      boxShadow: '0 0 12px var(--vc-glow-strong)',
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIOS — Prueba social real
         ══════════════════════════════════════════════════ */}
      <section
        className="relative z-10 px-6 py-20"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(198,255,60,0.02) 50%, transparent 100%)',
        }}
        aria-label="Testimonios de la comunidad Vitalcom"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p
              className="mb-3 text-[11px] uppercase tracking-[0.3em]"
              style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
            >
              Historias reales de nuestra comunidad
            </p>
            <h2
              className="text-3xl font-black md:text-4xl"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}
            >
              ELLOS YA <span className="vc-text-gradient">LO LOGRARON</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'María Restrepo',
                city: 'Bogotá',
                initials: 'MR',
                role: 'Dropshipper',
                quote: 'Entré sin saber nada de ventas. En 3 meses ya generaba $2M mensuales. La comunidad te empuja a crecer todos los días.',
                months: 3,
                revenue: '$2M/mes',
              },
              {
                name: 'Andrés Gómez',
                city: 'Medellín',
                initials: 'AG',
                role: 'Emprendedor',
                quote: 'Dejé mi trabajo de oficina. Hoy manejo mi tiempo, vendo desde el celular y gano más que antes. Vitalcom me cambió la vida.',
                months: 6,
                revenue: '$4.5M/mes',
              },
              {
                name: 'Verónica Salas',
                city: 'Bucaramanga',
                initials: 'VS',
                role: 'Top Seller',
                quote: 'Soy mamá de 2 hijos. Necesitaba ingresos sin salir de casa. Hoy soy top 10 nacional y ayudo a otras mamás a empezar.',
                months: 8,
                revenue: '$7M/mes',
              },
            ].map((t, i) => (
              <div
                key={t.name}
                className={`group relative overflow-hidden rounded-2xl p-7 transition-all hover:shadow-[0_0_30px_var(--vc-glow-lime)] vc-reveal-d${i+1}`}
                style={{
                  background: 'var(--vc-black-mid)',
                  border: '1px solid rgba(198, 255, 60, 0.1)',
                }}
              >
                <div className="vc-scan-line" />
                {/* Estrellas */}
                <div className="mb-4 flex gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={14} fill="var(--vc-lime-main)" color="var(--vc-lime-main)" />
                  ))}
                </div>

                <blockquote
                  className="relative mb-6 text-sm leading-relaxed"
                  style={{ color: 'var(--vc-white-soft)' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Resultado */}
                <div
                  className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: 'rgba(198, 255, 60, 0.06)',
                    border: '1px solid rgba(198, 255, 60, 0.15)',
                  }}
                >
                  <TrendingUp size={18} color="var(--vc-lime-main)" />
                  <div>
                    <p
                      className="text-sm font-black"
                      style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}
                    >
                      {t.revenue}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--vc-gray-mid)' }}>
                      En {t.months} meses con Vitalcom
                    </p>
                  </div>
                </div>

                {/* Autor */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: 'var(--vc-gradient-primary)',
                      color: 'var(--vc-black)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                    >
                      {t.name}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--vc-lime-main)' }}>
                      {t.role} · {t.city}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          POR QUÉ VITALCOM — Trust signals
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-20" aria-label="Por qué elegir Vitalcom">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2
              className="text-3xl font-black md:text-4xl"
              style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-display)' }}
            >
              ¿POR QUÉ <span className="vc-text-gradient">VITALCOM</span>?
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Shield, title: 'Cero riesgo', desc: 'No compras inventario. No inviertes dinero. Solo vendes y ganas.' },
              { icon: ShoppingBag, title: 'Nosotros enviamos', desc: 'Logística completa con Dropi. Empaque, despacho y tracking incluidos.' },
              { icon: MessageCircle, title: 'Soporte humano', desc: 'Equipo real que te responde. No bots, no esperas eternas.' },
              { icon: GraduationCap, title: 'Formación continua', desc: 'Lives semanales, cursos nuevos cada mes y mentorías con top sellers.' },
              { icon: Heart, title: 'Productos que sanan', desc: 'Solo vendemos lo que usaríamos nosotros. Suplementos y superalimentos reales.' },
              { icon: TrendingUp, title: 'Márgenes altos', desc: 'Hasta 60% de ganancia por venta. Tú decides cuánto quieres ganar.' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group flex items-start gap-4 rounded-xl p-5 transition-all hover:bg-[rgba(198,255,60,0.04)]"
                  style={{
                    border: '1px solid rgba(198, 255, 60, 0.06)',
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all group-hover:shadow-[0_0_16px_var(--vc-glow-lime)]"
                    style={{
                      background: 'rgba(198, 255, 60, 0.08)',
                      border: '1px solid rgba(198, 255, 60, 0.2)',
                    }}
                  >
                    <Icon size={18} color="var(--vc-lime-main)" />
                  </div>
                  <div>
                    <h3
                      className="mb-1 text-sm font-bold"
                      style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA FINAL — Conversión máxima
         ══════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-24" aria-label="Registro gratuito en Vitalcom">
        <div className="relative mx-auto max-w-5xl">
          <div
            className="pointer-events-none absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full vc-orbit"
            style={{ background: 'var(--vc-lime-main)', filter: 'blur(180px)', opacity: 0.1 }}
          />
          <div
            className="pointer-events-none absolute -bottom-32 -right-32 h-[350px] w-[350px] rounded-full vc-orbit-reverse"
            style={{ background: 'var(--vc-lime-electric)', filter: 'blur(150px)', opacity: 0.08 }}
          />

          <div
            className="relative overflow-hidden rounded-3xl"
            style={{
              background: 'var(--vc-black-mid)',
              border: '1px solid rgba(198, 255, 60, 0.2)',
              boxShadow: '0 0 80px rgba(198, 255, 60, 0.08), 0 4px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="h-1"
              style={{
                background: 'var(--vc-gradient-primary)',
                boxShadow: '0 0 20px var(--vc-glow-strong)',
              }}
            />
            <div className="vc-scan-line" />

            <div className="grid md:grid-cols-[1fr_1.2fr]">
              {/* Columna izquierda: pasos */}
              <div
                className="flex flex-col justify-center px-8 py-12 md:px-12 md:py-16"
                style={{ borderRight: '1px solid rgba(198, 255, 60, 0.06)' }}
              >
                <p
                  className="mb-6 text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                >
                  Listo en 30 segundos
                </p>

                <div className="space-y-7">
                  {[
                    {
                      step: '01',
                      title: 'Regístrate gratis',
                      desc: 'Solo necesitas tu correo y WhatsApp. Acceso inmediato a toda la plataforma.',
                    },
                    {
                      step: '02',
                      title: 'Aprende y conecta',
                      desc: 'Cursos, mentorías y una comunidad activa que te guía desde el primer día.',
                    },
                    {
                      step: '03',
                      title: 'Emprende con respaldo',
                      desc: 'Accede al catálogo, herramientas PRO y soporte real para hacer crecer tu negocio.',
                    },
                  ].map((s, i) => (
                    <div key={s.step} className={`flex gap-4 vc-reveal-d${i+1}`}>
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                        style={{
                          background: 'rgba(198, 255, 60, 0.1)',
                          border: '1px solid rgba(198, 255, 60, 0.3)',
                          color: 'var(--vc-lime-main)',
                          fontFamily: 'var(--font-display)',
                          boxShadow: '0 0 16px var(--vc-glow-lime)',
                        }}
                      >
                        {s.step}
                      </div>
                      <div>
                        <h3
                          className="mb-1 text-base font-bold"
                          style={{ color: 'var(--vc-white-soft)', fontFamily: 'var(--font-heading)' }}
                        >
                          {s.title}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--vc-white-dim)' }}>
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna derecha: CTA impactante */}
              <div
                className="relative flex flex-col items-center justify-center px-8 py-14 text-center md:px-12 md:py-20"
                style={{
                  background: 'linear-gradient(180deg, rgba(198,255,60,0.03) 0%, rgba(198,255,60,0.1) 100%)',
                }}
              >
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full vc-pulse"
                  style={{
                    background: 'var(--vc-lime-main)',
                    filter: 'blur(90px)',
                    opacity: 0.12,
                  }}
                />

                <p
                  className="relative mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
                >
                  No necesitas experiencia
                </p>

                <h2
                  className="relative mb-4 text-4xl font-black leading-tight md:text-5xl lg:text-6xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span style={{ color: 'var(--vc-white-soft)' }}>TU</span>{' '}
                  <span className="vc-text-gradient-animated">PRIMERA</span>
                  <br />
                  <span style={{ color: 'var(--vc-white-soft)' }}>VENTA</span>{' '}
                  <span className="vc-text-gradient-animated">HOY</span>
                </h2>

                <p
                  className="relative mb-8 max-w-sm text-base leading-relaxed"
                  style={{ color: 'var(--vc-white-dim)' }}
                >
                  Miles de colombianos buscan productos de bienestar ahora mismo.
                  Sé quien se los lleve.
                </p>

                <Link
                  href="/register"
                  className="vc-btn-primary vc-pulse relative flex items-center gap-3 px-12 py-5 text-lg md:text-xl"
                >
                  <Rocket size={24} />
                  Empezar gratis ahora
                </Link>

                <div className="relative mt-8 space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                    {[
                      'Sin inversión inicial',
                      'Sin tarjeta de crédito',
                      'Acceso inmediato',
                    ].map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-2"
                        style={{ color: 'var(--vc-white-dim)' }}
                      >
                        <CheckCircle size={14} color="var(--vc-lime-main)" />
                        {t}
                      </span>
                    ))}
                  </div>
                  <p
                    className="flex items-center justify-center gap-2 text-sm font-bold"
                    style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}
                  >
                    <Users size={14} />
                    +200 personas se unieron esta semana
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 px-6 py-10"
        style={{ borderTop: '1px solid rgba(198, 255, 60, 0.06)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/branding/logo-vitalcom.jpeg"
              alt="Vitalcom"
              width={32}
              height={32}
              className="rounded-full"
              style={{
                border: '1px solid rgba(198, 255, 60, 0.3)',
                boxShadow: '0 0 10px var(--vc-glow-lime)',
              }}
            />
            <span
              className="vc-text-gradient text-sm font-black tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              VITALCOM
            </span>
          </div>
          <div className="flex items-center gap-6">
            {(['CO', 'EC', 'GT', 'CL'] as const).map((code) => (
              <div key={code} className="flex flex-col items-center gap-1">
                <CountryFlag country={code} size={32} />
                <span
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
                >
                  {code}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
            {['Comunidad', 'Catálogo', 'Cursos', 'Herramientas', 'Contacto', 'Términos'].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-[--vc-lime-main]">{l}</a>
            ))}
          </div>
          <p
            className="text-[10px]"
            style={{ color: 'var(--vc-gray-mid)', fontFamily: 'var(--font-mono)' }}
          >
            2026 Vitalcom Platform · Bienestar que conecta a Latinoamérica · Todos los derechos reservados
          </p>
        </div>
      </footer>
    </main>
  )
}
