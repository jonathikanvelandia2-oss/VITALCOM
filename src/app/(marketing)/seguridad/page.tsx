import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Lock, FileCheck, Eye, Server, Scale, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Seguridad y Confianza — Vitalcom',
  description: 'Cómo Vitalcom protege los datos de su comunidad, socios y clientes. Controles técnicos, cumplimiento legal multi-país y transparencia operativa.',
}

// Página pública de seguridad — cara institucional.
// Objetivo: transmitir a prospects y socios (Dropi, Effi, proveedores de pagos,
// dropshippers evaluando entrar) que Vitalcom opera con estándares serios.
// Complementa el reporte técnico interno en /admin/seguridad/compliance.

const PILLARS = [
  {
    icon: Lock,
    title: 'Datos cifrados',
    body: 'Transporte TLS 1.3 forzado · contraseñas con PBKDF2 (100k iteraciones) · secretos en bóveda de variables de entorno · backups automáticos diarios en infraestructura SOC 2 Type II (Vercel + Supabase).',
  },
  {
    icon: Eye,
    title: 'Auditoría total',
    body: 'Cada operación sensible — login, cambio de rol, modificación de pedido, exportación — queda registrada en una bitácora inmutable con actor, IP, timestamp y metadata. Exportable a CSV para revisión externa en cualquier momento.',
  },
  {
    icon: ShieldCheck,
    title: 'OWASP Top 10 cubierto',
    body: 'Score interno de cumplimiento del 95% sobre el estándar de la industria. Controles sobre acceso roto, inyección, diseño inseguro, fallas de autenticación y monitoreo, documentados con evidencia verificable.',
  },
  {
    icon: Scale,
    title: 'Legal multi-país',
    body: 'Cumplimiento activo de Ley 1581 (Colombia), LOPDP (Ecuador), Decreto 57-2008 (Guatemala) y Ley 21.719 (Chile). Derechos del titular ejercidos por correo a privacidad@vitalcom.co con respuesta en máximo 15 días hábiles.',
  },
  {
    icon: Server,
    title: 'Infraestructura serie',
    body: 'PostgreSQL gestionado en Supabase con pooling · edge runtime Vercel · observabilidad Sentry-compatible · separación estricta admin/community/marketing · rate limiting por IP y por acción.',
  },
  {
    icon: FileCheck,
    title: 'Integraciones firmadas',
    body: 'Todos los webhooks de terceros (WhatsApp Business API, Shopify, Effi) se validan con HMAC-SHA256 antes de procesar payload. Ninguna integración puede invocar acciones sin firma criptográfica válida.',
  },
]

export default function SeguridadPage() {
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
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>
            VITALCOM
          </Link>
          <Link href="/" className="text-sm" style={{ color: 'var(--vc-white-dim)' }}>
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[var(--vc-gray-dark)] px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--vc-lime-main)]/30 bg-[var(--vc-lime-main)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--vc-lime-main)]">
            <ShieldCheck size={14} />
            Confianza por diseño
          </div>
          <h1
            className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Seguridad <span style={{ color: 'var(--vc-lime-main)' }}>auditable</span>
            <br />
            y transparente
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[var(--vc-white-dim)] md:text-lg">
            Vitalcom opera la cadena de proveeduría de cientos de emprendedores en cuatro países.
            La confianza no es un eslogan: es la suma de controles técnicos verificables, cumplimiento
            legal activo y una bitácora inmutable que documenta cada decisión.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-[var(--vc-gray-dark)] bg-[var(--vc-black-mid)] p-6 transition-colors hover:border-[var(--vc-lime-main)]/50"
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(198, 255, 60, 0.1)', color: 'var(--vc-lime-main)' }}
                >
                  <p.icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {p.title}
                </h3>
                <p className="text-sm leading-6 text-[var(--vc-white-dim)]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para socios */}
      <section className="border-t border-[var(--vc-gray-dark)] px-6 py-16" style={{ background: 'var(--vc-black-mid)' }}>
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-6 text-center text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Para socios comerciales y proveedores
          </h2>
          <p className="mb-8 text-center text-sm text-[var(--vc-white-dim)]">
            Dropi, Effi, pasarelas de pago y otros socios que requieran evidencia formal pueden
            solicitar el reporte técnico completo.
          </p>

          <div className="rounded-xl border border-[var(--vc-lime-main)]/30 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileCheck size={18} style={{ color: 'var(--vc-lime-main)' }} />
              <div className="text-sm font-semibold text-white">Reporte de Cumplimiento de Seguridad</div>
            </div>
            <ul className="space-y-2 text-sm text-[var(--vc-white-dim)]">
              <li>• Score OWASP Top 10 — 2021 con evidencia por categoría</li>
              <li>• Inventario de controles técnicos con referencias al código fuente</li>
              <li>• Telemetría operativa real (eventos auditados, eventos críticos, métricas)</li>
              <li>• Plan de respuesta a incidentes (RPO ≤ 24h · RTO ≤ 1h)</li>
              <li>• Detalle de tratamiento de datos y encargados por país</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="mailto:seguridad@vitalcom.co?subject=Solicitud%20de%20reporte%20de%20compliance"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--vc-lime-main)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-[var(--vc-lime-electric)]"
              >
                Solicitar reporte completo
              </a>
              <Link
                href="/politica-privacidad"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--vc-gray-dark)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--vc-white-soft)] transition-colors hover:border-[var(--vc-lime-main)] hover:text-[var(--vc-lime-main)]"
              >
                Política de privacidad
              </Link>
              <Link
                href="/terminos"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--vc-gray-dark)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--vc-white-soft)] transition-colors hover:border-[var(--vc-lime-main)] hover:text-[var(--vc-lime-main)]"
              >
                Términos y condiciones
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Vulnerabilidad reporting */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-xl border border-[var(--vc-warning)]/30 bg-[var(--vc-warning)]/5 p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgba(255, 184, 0, 0.15)', color: 'var(--vc-warning)' }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-white">
                ¿Encontraste una vulnerabilidad?
              </h3>
              <p className="mb-3 text-sm leading-6 text-[var(--vc-white-dim)]">
                Agradecemos el reporte responsable. Escribe a{' '}
                <a href="mailto:seguridad@vitalcom.co" className="font-mono text-[var(--vc-lime-main)] hover:underline">
                  seguridad@vitalcom.co
                </a>{' '}
                con el detalle técnico. Respondemos en menos de 48 horas hábiles y publicamos
                reconocimiento (opcional) tras corrección.
              </p>
              <div className="text-xs text-[var(--vc-white-dim)]">
                No incluyas datos de usuarios reales en el reporte. Usa cuentas de prueba y
                evita pruebas destructivas sobre infraestructura productiva.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--vc-gray-dark)] px-6 py-10 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 text-sm font-bold" style={{ color: 'var(--vc-lime-main)', fontFamily: 'var(--font-display)' }}>
            VITALCOM
          </div>
          <div className="text-xs text-[var(--vc-white-dim)]">
            © {new Date().getFullYear()} Vitalcom S.A.S. · Colombia · Ecuador · Guatemala · Chile
          </div>
          <div className="mt-2 text-xs text-[var(--vc-white-dim)]">
            Plataforma versión 2.26.0 · Documento actualizado con cada despliegue
          </div>
        </div>
      </footer>
    </div>
  )
}
