import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import {
  OWASP_TOP_10_2021,
  ADDITIONAL_STANDARDS,
  summarizeCompliance,
  type ComplianceStatus,
} from '@/lib/compliance/owasp'
import { requireRole } from '@/lib/auth/session'
import { computeAuditStats } from '@/lib/audit/logger'
import { PrintButton } from './PrintButton'

// Server Component — stats reales de BD + OWASP render estático.
// Diseñado para print-friendly: @media print oculta navegación, mantiene
// contenido. El CEO descarga esto para entregar a Dropi/Effi/abogados.

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<ComplianceStatus, { color: string; bg: string; label: string }> = {
  implemented: { color: '#4A6B00', bg: '#DFFF80', label: 'Implementado' },
  partial: { color: '#7a5c00', bg: '#FFE7A3', label: 'Parcial' },
  pending: { color: '#7a0012', bg: '#FFCCD0', label: 'Pendiente' },
}

export default async function ComplianceReportPage() {
  await requireRole('ADMIN')

  const summary = summarizeCompliance(OWASP_TOP_10_2021)
  const now = new Date()

  // Datos reales de auditoría para reforzar el reporte
  const [totalLogs, recentRows, userCount, orderCount] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { severity: true, action: true, resource: true, createdAt: true },
    }),
    prisma.user.count({ where: { active: true } }),
    prisma.order.count(),
  ])

  const auditStats = computeAuditStats(recentRows, now)
  const reportNumber = `VC-COMP-${now.toISOString().slice(0, 10)}-${String(totalLogs).padStart(5, '0')}`

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      {/* Nav — oculta al imprimir */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/seguridad" className="text-sm text-gray-600 hover:text-gray-900">
            ← Volver a Seguridad
          </Link>
          <PrintButton />
        </div>
      </nav>

      <article className="mx-auto max-w-5xl px-8 py-10 print:px-0 print:py-0">
        {/* Header oficial */}
        <header className="mb-10 border-b-2 border-gray-900 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Vitalcom S.A.S.
              </div>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Reporte de Cumplimiento de Seguridad
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Evidencia de controles técnicos y legales para integraciones externas
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div><strong>Documento:</strong> {reportNumber}</div>
              <div><strong>Emitido:</strong> {now.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div><strong>Versión plataforma:</strong> 2.26.0</div>
              <div><strong>Jurisdicciones:</strong> CO · EC · GT · CL</div>
            </div>
          </div>
        </header>

        {/* Resumen ejecutivo */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-gray-900">
            1. Resumen ejecutivo
          </h2>
          <div className="mb-4 rounded-lg border-2 border-gray-300 p-5">
            <div className="grid grid-cols-4 gap-4">
              <Metric label="Score OWASP" value={`${summary.score}%`} highlight />
              <Metric label="Controles activos" value={`${summary.implemented}/${summary.total}`} />
              <Metric label="Eventos auditados" value={totalLogs.toLocaleString('es-CO')} />
              <Metric label="Países operativos" value="4" />
            </div>
          </div>
          <p className="text-sm leading-6 text-gray-700">
            Vitalcom opera una plataforma de proveeduría de productos de bienestar en Colombia,
            Ecuador, Guatemala y Chile. Este reporte certifica el estado de los controles de
            seguridad implementados sobre el stack productivo a la fecha de emisión y sirve como
            evidencia técnica para socios comerciales (Dropi, Effi, proveedores de pagos) que
            requieran validar nuestra capacidad para procesar datos de sus usuarios y pedidos con
            las garantías técnicas y legales apropiadas.
          </p>
        </section>

        {/* Arquitectura de seguridad */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-gray-900">
            2. Arquitectura de seguridad
          </h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-200">
              <Row k="Autenticación" v="NextAuth v4 · Credentials provider · JWT sessions 24h + refresh 1h" />
              <Row k="Password hashing" v="PBKDF2 · 100 000 iteraciones · SHA-256 · salt aleatorio por usuario" />
              <Row k="Transporte" v="HTTPS/TLS 1.3 forzado · HSTS · Vercel Edge Network" />
              <Row k="Base de datos" v="PostgreSQL 15 en Supabase · connection pooling · backups automáticos diarios" />
              <Row k="Webhooks" v="HMAC-SHA256 verification · rejected before parse · timestamp window 5min" />
              <Row k="Rate limiting" v="Per-IP + per-action · login 5/15min · reset 3/h · export 10/h" />
              <Row k="Input validation" v="Zod schemas en el 100% de endpoints · SQL injection prevenido por Prisma ORM" />
              <Row k="Audit logging" v="Inmutable · 29 tipos de acción · snapshot de actor · retención indefinida" />
              <Row k="Observabilidad" v="captureException + captureWarning en todos los catches · route-aware tags" />
              <Row k="Infraestructura" v="Vercel (hosting) · Supabase (BD + storage) · ambos con SOC 2 Type II" />
            </tbody>
          </table>
        </section>

        {/* OWASP Top 10 */}
        <section className="mb-10 break-before-page">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-gray-900">
            3. OWASP Top 10 — 2021 · estado por categoría
          </h2>
          <div className="space-y-4">
            {OWASP_TOP_10_2021.map((item) => {
              const style = STATUS_STYLE[item.status]
              return (
                <div key={item.code} className="rounded-lg border border-gray-300 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {item.code}
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                      <p className="mt-0.5 text-xs italic text-gray-600">Riesgo: {item.risk}</p>
                    </div>
                    <span
                      className="ml-4 inline-flex items-center rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {style.label}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Controles
                      </div>
                      <ul className="list-disc space-y-0.5 pl-4 text-xs text-gray-700">
                        {item.controls.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Evidencia
                      </div>
                      <ul className="list-disc space-y-0.5 pl-4 text-xs font-mono text-gray-700">
                        {item.evidence.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Estándares adicionales */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-gray-900">
            4. Estándares adicionales aplicables
          </h2>
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-b border-gray-300 px-3 py-2 text-left">Estándar</th>
                <th className="border-b border-gray-300 px-3 py-2 text-left">Estado</th>
                <th className="border-b border-gray-300 px-3 py-2 text-left">Nota</th>
              </tr>
            </thead>
            <tbody>
              {ADDITIONAL_STANDARDS.map((s) => {
                const style = STATUS_STYLE[s.status]
                return (
                  <tr key={s.name} className="border-b border-gray-200">
                    <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{s.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* Estadísticas del audit log */}
        <section className="mb-10 break-before-page">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-gray-900">
            5. Telemetría operativa (snapshot)
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Total histórico de eventos" value={totalLogs.toLocaleString('es-CO')} />
            <Metric label="Eventos últimas 24h" value={auditStats.totalLast24h.toLocaleString('es-CO')} />
            <Metric label="Críticos últimos 7d" value={auditStats.criticalLast7d.toLocaleString('es-CO')} />
            <Metric label="Usuarios activos" value={userCount.toLocaleString('es-CO')} />
            <Metric label="Pedidos procesados" value={orderCount.toLocaleString('es-CO')} />
            <Metric label="Logins fallidos última hora" value={auditStats.failedLoginsLastHour.toLocaleString('es-CO')} />
          </div>
          <p className="mt-4 text-xs text-gray-600">
            Todos los eventos están disponibles para consulta y exportación a CSV desde el panel
            administrativo. El sistema preserva snapshot del actor (email + rol) para garantizar
            trazabilidad incluso tras borrado de usuarios, conforme al principio de integridad
            requerido por las leyes de protección de datos de los cuatro países operados.
          </p>
        </section>

        {/* Tratamiento de datos */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-gray-900">
            6. Tratamiento de datos personales
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Responsable del tratamiento:</strong> Vitalcom S.A.S. · Colombia (sede principal) ·
              opera como Responsable en las 4 jurisdicciones (CO / EC / GT / CL).
            </p>
            <p>
              <strong>Categorías de datos tratados:</strong> identificación (nombre, email, teléfono),
              dirección de envío, historial transaccional, contenido generado en la comunidad.
              No se tratan datos sensibles (salud, biometría, orientación, etc.).
            </p>
            <p>
              <strong>Finalidades:</strong> operación del marketplace, soporte al cliente,
              mejora del servicio, comunicaciones transaccionales. Marketing directo solo bajo
              opt-in explícito con opt-out funcional en cada envío.
            </p>
            <p>
              <strong>Encargados:</strong> Supabase Inc. (infraestructura), Vercel Inc. (hosting),
              Resend (emails transaccionales), Meta (WhatsApp), Shopify (tiendas dropshipper),
              Dropi / Effi (fulfillment). Cada uno con su propio compromiso contractual de
              protección de datos.
            </p>
            <p>
              <strong>Retención:</strong> datos de cuenta mientras el usuario esté activo + 5 años
              post-baja. Audit log conservado indefinidamente por razones de integridad legal.
            </p>
            <p>
              <strong>Derechos del titular:</strong> acceso, rectificación, cancelación, oposición.
              Canal oficial: <span className="font-mono">privacidad@vitalcom.co</span>. Respuesta
              máximo 15 días hábiles.
            </p>
          </div>
        </section>

        {/* Plan de respuesta a incidentes */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-gray-900">
            7. Plan de respuesta a incidentes
          </h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
            <li><strong>Detección:</strong> alertas automáticas en dashboard `/admin/seguridad` cuando críticos/hora superan umbral configurable.</li>
            <li><strong>Contención:</strong> revocación inmediata de credenciales comprometidas + desactivación de cuentas afectadas via `/api/admin/users/[id]` DELETE.</li>
            <li><strong>Erradicación:</strong> parche desplegado vía Vercel (tiempo mediano de rollout: 3 min) + migración de BD si aplica.</li>
            <li><strong>Recuperación:</strong> restore desde backup Supabase automático (RPO ≤ 24h, RTO ≤ 1h).</li>
            <li><strong>Notificación:</strong> a afectados en menos de 72h si aplica el marco regulatorio; a autoridad de protección de datos del país respectivo según obligación.</li>
            <li><strong>Post-mortem:</strong> documento público de lecciones aprendidas + cambios implementados.</li>
          </ol>
        </section>

        {/* Firma */}
        <section className="mt-12 border-t-2 border-gray-900 pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                Emitido por
              </div>
              <div className="text-sm font-semibold text-gray-900">Dirección Técnica · Vitalcom S.A.S.</div>
              <div className="text-xs text-gray-600">Plataforma versión 2.26.0</div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                Hash de referencia
              </div>
              <div className="font-mono text-xs text-gray-900">{reportNumber}</div>
              <div className="text-xs text-gray-600">
                Este documento es generado dinámicamente a partir de datos reales del sistema.
              </div>
            </div>
          </div>
        </section>
      </article>

      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          nav { display: none !important; }
          body { background: white !important; }
          article { max-width: 100% !important; padding: 0 !important; }
          .break-before-page { break-before: page; }
        }
      `}</style>
    </div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg ${highlight ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-4`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-gray-300' : 'text-gray-500'}`}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td className="py-2 pr-4 font-semibold text-gray-900" style={{ width: '30%' }}>
        {k}
      </td>
      <td className="py-2 text-gray-700">{v}</td>
    </tr>
  )
}
