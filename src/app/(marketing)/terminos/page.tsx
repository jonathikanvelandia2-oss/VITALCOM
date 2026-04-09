import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Vitalcom',
  description: 'Términos y condiciones de uso de la plataforma Vitalcom. Aplica para Colombia, Ecuador, Guatemala y Chile.',
}

export default function TerminosPage() {
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
          <Link
            href="/"
            className="text-sm"
            style={{ color: 'var(--vc-white-dim)' }}
          >
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
          Términos y Condiciones
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--vc-white-dim)' }}>
          Última actualización: 9 de abril de 2026
        </p>

        <div className="space-y-8" style={{ color: 'var(--vc-white-soft)' }}>
          {/* 1. Aceptación */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              1. Aceptación de los términos
            </h2>
            <p className="leading-relaxed">
              Al registrarte y utilizar la plataforma Vitalcom, aceptas estos Términos y Condiciones
              en su totalidad. Si no estás de acuerdo con algún punto, no debes utilizar la plataforma.
              Estos términos aplican a usuarios en todos los países donde operamos: Colombia, Ecuador,
              Guatemala y Chile.
            </p>
          </section>

          {/* 2. Descripción del servicio */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              2. Descripción del servicio
            </h2>
            <p className="leading-relaxed">
              Vitalcom es una plataforma de proveeduría de productos de bienestar que ofrece:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1 leading-relaxed">
              <li>Comunidad de emprendedores y dropshippers con formación y herramientas.</li>
              <li>Catálogo de productos de bienestar disponibles para distribución.</li>
              <li>Herramientas de cálculo de precios y generación de flujos de automatización.</li>
              <li>Sistema de cursos, eventos y gamificación.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              <strong>Importante:</strong> Vitalcom es una plataforma de proveeduría y comunidad.
              No garantizamos ingresos, ganancias ni resultados comerciales específicos.
              El éxito comercial depende de las acciones, esfuerzo y decisiones individuales de cada usuario.
            </p>
          </section>

          {/* 3. Registro y cuenta */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              3. Registro y cuenta
            </h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>Debes ser mayor de 18 años para registrarte.</li>
              <li>La información de registro debe ser veraz y actualizada.</li>
              <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
              <li>Una persona solo puede tener una cuenta activa.</li>
              <li>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos.</li>
            </ul>
          </section>

          {/* 4. Uso aceptable */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              4. Uso aceptable
            </h2>
            <p className="mb-2 leading-relaxed">Al usar la plataforma, te comprometes a:</p>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>No publicar contenido ilegal, ofensivo, difamatorio o que viole derechos de terceros.</li>
              <li>No realizar spam, publicidad no autorizada o promoción de servicios competidores.</li>
              <li>No intentar acceder a cuentas de otros usuarios o a sistemas internos de la plataforma.</li>
              <li>No hacer uso automatizado (bots, scrapers) sin autorización expresa.</li>
              <li>No hacer declaraciones engañosas sobre ingresos o resultados comerciales.</li>
              <li>Respetar las normas de la comunidad y a los demás miembros.</li>
            </ul>
          </section>

          {/* 5. Propiedad intelectual */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              5. Propiedad intelectual
            </h2>
            <p className="leading-relaxed">
              Todo el contenido de la plataforma (marca, diseño, cursos, materiales) es propiedad de Vitalcom
              o de sus respectivos autores. No puedes reproducir, distribuir ni modificar este contenido
              sin autorización escrita. El contenido que publiques en la comunidad sigue siendo de tu propiedad,
              pero nos otorgas una licencia no exclusiva para mostrarlo dentro de la plataforma.
            </p>
          </section>

          {/* 6. Dropshipping */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              6. Condiciones de dropshipping
            </h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>Los precios del catálogo están sujetos a cambio sin previo aviso.</li>
              <li>Los tiempos de envío dependen de la ubicación y el socio logístico de cada país.</li>
              <li>Vitalcom actúa como proveedor; la relación con el cliente final es del dropshipper.</li>
              <li>El dropshipper es responsable de cumplir con la legislación comercial y tributaria de su país.</li>
              <li>No nos hacemos responsables por promesas de entrega que el dropshipper haga a sus clientes más allá de lo establecido por nuestros socios logísticos.</li>
            </ul>
          </section>

          {/* 7. Limitación de responsabilidad */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              7. Limitación de responsabilidad
            </h2>
            <p className="leading-relaxed">
              Vitalcom proporciona la plataforma &quot;tal cual&quot;. No garantizamos disponibilidad
              ininterrumpida ni la ausencia de errores. Nuestra responsabilidad se limita al monto
              pagado por el usuario en los últimos 12 meses. No somos responsables por daños indirectos,
              pérdida de beneficios ni daños consecuentes.
            </p>
          </section>

          {/* 8. Terminación */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              8. Terminación
            </h2>
            <p className="leading-relaxed">
              Puedes cancelar tu cuenta en cualquier momento desde tu perfil.
              Nos reservamos el derecho de suspender o cancelar cuentas por violación de estos términos,
              con notificación previa excepto en casos de actividad ilegal o que ponga en riesgo
              la seguridad de la plataforma o sus usuarios.
            </p>
          </section>

          {/* 9. Ley aplicable */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              9. Ley aplicable y jurisdicción
            </h2>
            <p className="leading-relaxed">
              Estos términos se rigen por la legislación del país donde el usuario tiene su residencia habitual.
              Para usuarios en Colombia, se aplicará la legislación colombiana y la jurisdicción de los tribunales
              de Bogotá, D.C. Para usuarios en otros países, se aplicará la legislación local correspondiente.
            </p>
          </section>

          {/* 10. Contacto */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              10. Contacto
            </h2>
            <p className="leading-relaxed">
              Para consultas sobre estos términos: <strong>legal@vitalcom.co</strong>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t pt-6" style={{ borderColor: 'var(--vc-gray-dark)' }}>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
            <Link href="/politica-privacidad" className="underline hover:no-underline" style={{ color: 'var(--vc-lime-deep)' }}>
              Política de Privacidad
            </Link>
            <Link href="/politica-cookies" className="underline hover:no-underline" style={{ color: 'var(--vc-lime-deep)' }}>
              Política de Cookies
            </Link>
            <span>© 2026 Vitalcom. Todos los derechos reservados.</span>
          </div>
        </div>
      </main>
    </div>
  )
}
