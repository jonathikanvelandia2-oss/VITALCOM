import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Vitalcom',
  description: 'Política de privacidad y protección de datos personales de Vitalcom. Cumplimiento legal en Colombia, Ecuador, Guatemala y Chile.',
}

// ── Política de Privacidad — Multi-país LATAM ───────────
// Cumple con:
// 🇨🇴 Ley 1581 de 2012 (Habeas Data) + Decreto 1377 de 2013
// 🇪🇨 Ley Orgánica de Protección de Datos Personales (2021)
// 🇬🇹 Decreto 57-2008 (Acceso a la Información Pública)
// 🇨🇱 Ley 19.628 (Protección de la Vida Privada) + reforma 2024

export default function PoliticaPrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--vc-white-dim)' }}>
          Última actualización: 9 de abril de 2026
        </p>

        <div className="space-y-8" style={{ color: 'var(--vc-white-soft)' }}>
          {/* 1. Responsable */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              1. Responsable del tratamiento
            </h2>
            <p className="leading-relaxed">
              <strong>VITALCOM</strong> (en adelante &quot;la Empresa&quot;) es responsable del tratamiento de los datos personales
              que recopila a través de esta plataforma. Operamos en Colombia, Ecuador, Guatemala y Chile,
              cumpliendo con la legislación de protección de datos vigente en cada país.
            </p>
            <p className="mt-2 leading-relaxed">
              Contacto del oficial de protección de datos: <strong>privacidad@vitalcom.co</strong>
            </p>
          </section>

          {/* 2. Datos recopilados */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              2. Datos personales que recopilamos
            </h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico, número de WhatsApp/teléfono.</li>
              <li><strong>Datos de acceso:</strong> contraseña (almacenada con hash criptográfico PBKDF2 — nunca en texto plano).</li>
              <li><strong>Datos de perfil:</strong> biografía, avatar, país de operación.</li>
              <li><strong>Datos de uso:</strong> actividad en la comunidad (publicaciones, comentarios, cursos completados, puntos).</li>
              <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas (solo para seguridad y mejora del servicio).</li>
              <li><strong>Datos comerciales:</strong> historial de pedidos, cálculos de precios guardados (solo para usuarios tipo dropshipper).</li>
            </ul>
          </section>

          {/* 3. Finalidad */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              3. Finalidad del tratamiento
            </h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>Gestionar tu cuenta y autenticación en la plataforma.</li>
              <li>Proveer acceso a la comunidad, cursos, herramientas y catálogo.</li>
              <li>Procesar pedidos y coordinar la logística con nuestros socios.</li>
              <li>Enviar comunicaciones transaccionales (confirmaciones, actualizaciones de pedido).</li>
              <li>Mejorar nuestros servicios mediante análisis de uso agregado y anónimo.</li>
              <li>Cumplir con obligaciones legales y regulatorias de cada país.</li>
            </ul>
          </section>

          {/* 4. Base legal */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              4. Base legal por país
            </h2>
            <div className="space-y-3 leading-relaxed">
              <p>
                <strong>🇨🇴 Colombia:</strong> Ley 1581 de 2012 (Protección de Datos Personales) y Decreto 1377 de 2013.
                Tratamiento basado en autorización previa, expresa e informada del titular.
              </p>
              <p>
                <strong>🇪🇨 Ecuador:</strong> Ley Orgánica de Protección de Datos Personales (2021).
                Consentimiento del titular como base del tratamiento.
              </p>
              <p>
                <strong>🇬🇹 Guatemala:</strong> Decreto 57-2008 (Ley de Acceso a la Información Pública)
                y principios de protección de datos constitucionales (Art. 31 Constitución).
              </p>
              <p>
                <strong>🇨🇱 Chile:</strong> Ley 19.628 (Protección de la Vida Privada), con sus reformas vigentes.
                Consentimiento previo del titular para el tratamiento de datos personales.
              </p>
            </div>
          </section>

          {/* 5. Seguridad */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              5. Medidas de seguridad
            </h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>Conexiones cifradas con <strong>HTTPS/TLS</strong> en toda la plataforma.</li>
              <li>Contraseñas protegidas con hashing <strong>PBKDF2-SHA512</strong> (100.000 iteraciones + salt único).</li>
              <li>Tokens de sesión firmados con clave secreta de 256+ bits.</li>
              <li>Headers de seguridad: CSP, HSTS, X-Frame-Options, X-Content-Type-Options.</li>
              <li>Protección contra CSRF, XSS y SQL Injection.</li>
              <li>Rate limiting para prevenir ataques de fuerza bruta.</li>
              <li>Acceso a datos restringido por roles y áreas (principio de mínimo privilegio).</li>
              <li>Base de datos en infraestructura de Supabase con cifrado en reposo.</li>
            </ul>
          </section>

          {/* 6. Derechos */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              6. Tus derechos
            </h2>
            <p className="mb-3 leading-relaxed">
              En todos los países donde operamos, tienes derecho a:
            </p>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
              <li><strong>Revocación:</strong> retirar tu consentimiento en cualquier momento.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y de uso común.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Para ejercer estos derechos, escríbenos a <strong>privacidad@vitalcom.co</strong> indicando
              tu nombre completo, país de residencia y el derecho que deseas ejercer.
              Responderemos en un plazo máximo de 15 días hábiles.
            </p>
          </section>

          {/* 7. Transferencias */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              7. Transferencias internacionales
            </h2>
            <p className="leading-relaxed">
              Tus datos pueden ser procesados por proveedores de infraestructura ubicados fuera de tu país
              (servidores en AWS/Supabase, procesadores de pago internacionales).
              En todos los casos, exigimos que estos proveedores cumplan con estándares equivalentes
              de protección de datos y firmen acuerdos de confidencialidad.
            </p>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              8. Cookies
            </h2>
            <p className="leading-relaxed">
              Utilizamos cookies estrictamente necesarias para el funcionamiento de la plataforma
              (sesión de usuario, preferencias de idioma). No utilizamos cookies de seguimiento
              publicitario de terceros. Consulta nuestra{' '}
              <Link href="/politica-cookies" className="underline" style={{ color: 'var(--vc-lime-main)' }}>
                Política de Cookies
              </Link>{' '}
              para más detalles.
            </p>
          </section>

          {/* 9. Menores */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              9. Menores de edad
            </h2>
            <p className="leading-relaxed">
              Esta plataforma está dirigida a personas mayores de 18 años.
              No recopilamos intencionalmente datos de menores de edad.
              Si descubrimos que un menor se ha registrado, procederemos a eliminar su cuenta y datos.
            </p>
          </section>

          {/* 10. Cambios */}
          <section>
            <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-heading)' }}>
              10. Modificaciones
            </h2>
            <p className="leading-relaxed">
              Nos reservamos el derecho de actualizar esta política. Cualquier cambio material
              será notificado a través de la plataforma y por correo electrónico con al menos
              15 días de antelación. El uso continuado de la plataforma después de los cambios
              implica la aceptación de la política actualizada.
            </p>
          </section>
        </div>

        {/* Footer legal */}
        <div className="mt-12 border-t pt-6" style={{ borderColor: 'var(--vc-gray-dark)' }}>
          <p className="text-xs" style={{ color: 'var(--vc-gray-mid)' }}>
            © 2026 Vitalcom. Todos los derechos reservados. Esta política aplica a usuarios
            en Colombia (Ley 1581/2012), Ecuador (LOPDP 2021), Guatemala (Decreto 57-2008) y Chile (Ley 19.628).
          </p>
        </div>
      </main>
    </div>
  )
}
