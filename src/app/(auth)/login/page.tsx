import Link from 'next/link'
import { Users, Building2, ArrowRight } from 'lucide-react'

// Pantalla de elección de acceso: Comunidad vs Equipo Vitalcom
// El CEO y todos los empleados (8 áreas) entran por "Equipo".
// Los 1500 usuarios / dropshippers entran por "Comunidad".
export default function LoginEntryPage() {
  return (
    <div className="w-full max-w-4xl">
      <div className="mb-12 text-center">
        <p
          className="mb-3 text-xs uppercase tracking-[0.3em]"
          style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-mono)' }}
        >
          Acceso a la plataforma
        </p>
        <h1
          className="vc-text-gradient mb-4 text-4xl font-black md:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ¿CÓMO ENTRAS HOY?
        </h1>
        <p
          className="mx-auto max-w-xl text-base"
          style={{ color: 'var(--vc-white-dim)', fontFamily: 'var(--font-heading)' }}
        >
          Vitalcom es una sola plataforma con dos mundos. Elige el que te corresponde.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* COMUNIDAD */}
        <Link
          href="/login/comunidad"
          className="vc-card group relative overflow-hidden"
          style={{ padding: '2rem' }}
        >
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 transition-opacity group-hover:opacity-40"
            style={{ background: 'var(--vc-gradient-primary)', filter: 'blur(40px)' }}
          />
          <div
            className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(198, 255, 60, 0.12)',
              border: '1px solid rgba(198, 255, 60, 0.3)',
            }}
          >
            <Users size={26} color="var(--vc-lime-main)" />
          </div>
          <h2
            className="relative mb-2 text-2xl font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Soy de la comunidad
          </h2>
          <p
            className="relative mb-6 text-sm leading-relaxed"
            style={{ color: 'var(--vc-white-dim)' }}
          >
            Dropshippers, emprendedores de bienestar y revendedores. Acceso al feed,
            cursos, calculadora, generador de flujos y catálogo navegable.
          </p>
          <div
            className="relative flex items-center gap-2 text-sm font-semibold uppercase tracking-wider transition-all group-hover:gap-3"
            style={{
              color: 'var(--vc-lime-main)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Entrar a la comunidad <ArrowRight size={16} />
          </div>
        </Link>

        {/* EQUIPO */}
        <Link
          href="/login/equipo"
          className="vc-card group relative overflow-hidden"
          style={{ padding: '2rem' }}
        >
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 transition-opacity group-hover:opacity-40"
            style={{ background: 'var(--vc-gradient-primary)', filter: 'blur(40px)' }}
          />
          <div
            className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(198, 255, 60, 0.12)',
              border: '1px solid rgba(198, 255, 60, 0.3)',
            }}
          >
            <Building2 size={26} color="var(--vc-lime-main)" />
          </div>
          <h2
            className="relative mb-2 text-2xl font-bold"
            style={{
              color: 'var(--vc-white-soft)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Soy del equipo Vitalcom
          </h2>
          <p
            className="relative mb-6 text-sm leading-relaxed"
            style={{ color: 'var(--vc-white-dim)' }}
          >
            Dirección, ventas, logística, marketing, soporte, finanzas, producto y
            comunidad. Acceso al panel administrativo y operativo.
          </p>
          <div
            className="relative flex items-center gap-2 text-sm font-semibold uppercase tracking-wider transition-all group-hover:gap-3"
            style={{
              color: 'var(--vc-lime-main)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Acceso staff <ArrowRight size={16} />
          </div>
        </Link>
      </div>

      <p
        className="mt-10 text-center text-sm"
        style={{ color: 'var(--vc-white-dim)' }}
      >
        ¿Aún no tienes cuenta de comunidad?{' '}
        <Link
          href="/register"
          style={{
            color: 'var(--vc-lime-main)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
          }}
        >
          Regístrate aquí
        </Link>
      </p>
    </div>
  )
}
