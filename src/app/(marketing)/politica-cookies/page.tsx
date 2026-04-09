import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cookies — Vitalcom',
  description: 'Información sobre el uso de cookies en la plataforma Vitalcom.',
}

export default function PoliticaCookiesPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--vc-black)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(198, 255, 60, 0.18)',
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>
            VITALCOM
          </Link>
          <Link href="/" className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1
          className="mb-2 text-3xl font-bold"
          style={{ color: 'var(--vc-white)', fontFamily: 'var(--font-heading)' }}
        >
          Política de Cookies
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--vc-white-dim)' }}>
          Última actualización: 9 de abril de 2026
        </p>

        <div className="space-y-8" style={{ color: 'var(--vc-white-soft)' }}>
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              1. ¿Qué son las cookies?
            </h2>
            <p className="leading-relaxed">
              Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas
              un sitio web. Se utilizan para recordar tus preferencias, mantener tu sesión activa
              y mejorar tu experiencia de navegación.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              2. Cookies que utilizamos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderColor: 'var(--vc-gray-dark)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--vc-gray-dark)' }}>
                    <th className="px-3 py-2 text-left font-bold" style={{ color: 'var(--vc-lime-main)' }}>Cookie</th>
                    <th className="px-3 py-2 text-left font-bold" style={{ color: 'var(--vc-lime-main)' }}>Tipo</th>
                    <th className="px-3 py-2 text-left font-bold" style={{ color: 'var(--vc-lime-main)' }}>Duración</th>
                    <th className="px-3 py-2 text-left font-bold" style={{ color: 'var(--vc-lime-main)' }}>Propósito</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--vc-gray-dark)' }}>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">next-auth.session-token</td>
                    <td className="px-3 py-2">Esencial</td>
                    <td className="px-3 py-2">24 horas</td>
                    <td className="px-3 py-2">Mantener tu sesión activa</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">next-auth.csrf-token</td>
                    <td className="px-3 py-2">Seguridad</td>
                    <td className="px-3 py-2">Sesión</td>
                    <td className="px-3 py-2">Protección contra ataques CSRF</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">vc-role</td>
                    <td className="px-3 py-2">Funcional</td>
                    <td className="px-3 py-2">24 horas</td>
                    <td className="px-3 py-2">Determinar tu tipo de acceso (admin/comunidad)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">vc-country</td>
                    <td className="px-3 py-2">Funcional</td>
                    <td className="px-3 py-2">30 días</td>
                    <td className="px-3 py-2">Recordar tu país de operación</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">vc-cookie-consent</td>
                    <td className="px-3 py-2">Esencial</td>
                    <td className="px-3 py-2">1 año</td>
                    <td className="px-3 py-2">Recordar tu decisión sobre cookies</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              3. Cookies de terceros
            </h2>
            <p className="leading-relaxed">
              <strong>No utilizamos cookies de seguimiento publicitario de terceros.</strong> No compartimos
              datos de navegación con redes publicitarias ni utilizamos cookies para perfilamiento comercial.
              Las únicas cookies de terceros presentes son las de Google Fonts (para cargar tipografías)
              y Supabase (para autenticación segura).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              4. Gestión de cookies
            </h2>
            <p className="leading-relaxed">
              Puedes gestionar las cookies desde la configuración de tu navegador. Sin embargo,
              desactivar las cookies esenciales puede impedir el funcionamiento correcto de la plataforma
              (por ejemplo, no podrás mantener tu sesión activa).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              5. Contacto
            </h2>
            <p className="leading-relaxed">
              Si tienes preguntas sobre nuestra política de cookies: <strong>privacidad@vitalcom.co</strong>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t pt-6" style={{ borderColor: 'var(--vc-gray-dark)' }}>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
            <Link href="/politica-privacidad" className="underline hover:no-underline" style={{ color: 'var(--vc-lime-deep)' }}>
              Política de Privacidad
            </Link>
            <Link href="/terminos" className="underline hover:no-underline" style={{ color: 'var(--vc-lime-deep)' }}>
              Términos y Condiciones
            </Link>
            <span>© 2026 Vitalcom. Todos los derechos reservados.</span>
          </div>
        </div>
      </main>
    </div>
  )
}
