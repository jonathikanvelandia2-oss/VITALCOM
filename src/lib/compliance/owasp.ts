// V41 — OWASP Top 10 — 2021 checklist con evidencia real.
// Cada ítem referencia archivos/componentes concretos del repo para que el
// auditor pueda verificar la implementación. Esta estructura es la base
// del reporte de compliance entregable a Dropi/Effi.

export type ComplianceStatus = 'implemented' | 'partial' | 'pending'

export type OwaspItem = {
  code: string // A01:2021
  title: string
  risk: string
  status: ComplianceStatus
  controls: string[] // qué hacemos
  evidence: string[] // archivos/endpoints concretos
}

export const OWASP_TOP_10_2021: OwaspItem[] = [
  {
    code: 'A01:2021',
    title: 'Broken Access Control',
    risk: 'Usuarios pueden acceder a datos/acciones fuera de su rol',
    status: 'implemented',
    controls: [
      'RBAC con 6 roles (SUPERADMIN/ADMIN/MANAGER_AREA/EMPLOYEE/COMMUNITY/DROPSHIPPER)',
      'Helper requireRole() + requireArea() en toda API protegida',
      'Filtrado atómico por ownership: findFirst({ where: { id, userId } }) → 404 sin revelar existencia',
      'Middleware de rutas protegidas por patrón',
    ],
    evidence: [
      'src/lib/auth/session.ts — requireSession/requireRole/requireArea/isStaff/isAdmin',
      'src/app/api/orders/[id]/route.ts:28 — filtrado atómico ownership',
      'src/middleware.ts — protección a nivel edge',
    ],
  },
  {
    code: 'A02:2021',
    title: 'Cryptographic Failures',
    risk: 'Datos sensibles expuestos en tránsito o en reposo',
    status: 'implemented',
    controls: [
      'Passwords hasheadas con PBKDF2 (100k iteraciones, SHA-256)',
      'HTTPS forzado en producción vía Vercel + HSTS',
      'Secrets en variables de entorno, nunca en repo',
      'HMAC-SHA256 en webhooks (WhatsApp + Shopify + Effi)',
      'NEXTAUTH_SECRET mínimo 32 chars validado',
    ],
    evidence: [
      'src/lib/security/password.ts — hashPassword/verifyPassword PBKDF2',
      'src/app/api/webhooks/*/route.ts — verificación HMAC',
      '.env.example — ningún valor real committed',
    ],
  },
  {
    code: 'A03:2021',
    title: 'Injection',
    risk: 'SQL/NoSQL/Command injection',
    status: 'implemented',
    controls: [
      'Prisma ORM con queries parametrizadas — nunca SQL crudo con interpolación',
      'Zod valida TODO input del cliente antes de llegar a la BD',
      'Template literals sanitizados en wa.me deep links',
    ],
    evidence: [
      'src/lib/api/schemas/*.ts — schemas Zod por endpoint',
      'src/lib/db/prisma.ts — cliente único tipado',
      'src/lib/channels/helpers.ts — normalizePhone + E.164 validation',
    ],
  },
  {
    code: 'A04:2021',
    title: 'Insecure Design',
    risk: 'Fallas de diseño arquitectural',
    status: 'implemented',
    controls: [
      'Audit log global de operaciones sensibles (V40)',
      'Separación clara marketing / admin / community',
      'Rate limiting por acción (login, register, password reset, etc.)',
      'Transiciones de estado validadas server-side (pedidos)',
      'Separación role vs área — principio de menor privilegio',
    ],
    evidence: [
      'src/lib/audit/logger.ts — bitácora centralizada',
      'src/lib/security/rate-limit.ts — guardRateLimit + RATE_LIMITS',
      'src/lib/api/schemas/order.ts — VALID_TRANSITIONS server-side',
    ],
  },
  {
    code: 'A05:2021',
    title: 'Security Misconfiguration',
    risk: 'Configuración insegura por defecto',
    status: 'implemented',
    controls: [
      'CSP + headers de seguridad en producción',
      'Modo TESTING_MODE solo en desarrollo, nunca en prod',
      'Sin debug expuesto — console.* controlado por observabilidad',
      'Variables de entorno validadas con schema',
      'Prisma schema con connection pooling (pgbouncer)',
    ],
    evidence: [
      'next.config.ts — headers de seguridad',
      'src/lib/observability/index.ts — captureException/Warning/Event',
      '.env.example — DATABASE_URL con pooler obligatorio',
    ],
  },
  {
    code: 'A06:2021',
    title: 'Vulnerable and Outdated Components',
    risk: 'Dependencias con CVEs conocidas',
    status: 'partial',
    controls: [
      'Dependabot activo en GitHub',
      'Next.js 14 (última LTS major)',
      'Prisma 5.22 (mayor update a 7.x pendiente de evaluar)',
      'Auditoría manual con npm audit antes de cada release',
    ],
    evidence: [
      'package.json — versions pinneadas',
      '.github/dependabot.yml — auto-PRs semanales',
    ],
  },
  {
    code: 'A07:2021',
    title: 'Identification and Authentication Failures',
    risk: 'Bypass de login, sesiones robadas, brute force',
    status: 'implemented',
    controls: [
      'Rate limit en /api/auth/register + login (5 intentos / 15 min / IP)',
      'JWT sessions con expiración 24h + refresh 1h',
      'Password reset con tokens de un solo uso, expiración 1h',
      'Login fallido logueado en audit (AuditAction.LOGIN_FAILED, WARNING)',
      'Desactivación de cuenta soft + inhabilita login inmediato',
    ],
    evidence: [
      'src/lib/auth/auth.config.ts — authorize con logging',
      'src/app/api/auth/reset-password/route.ts — tokens one-time',
      'src/lib/audit/logger.ts — failedLoginsLastHour KPI',
    ],
  },
  {
    code: 'A08:2021',
    title: 'Software and Data Integrity Failures',
    risk: 'Cambios no verificados en datos o código',
    status: 'implemented',
    controls: [
      'Audit log inmutable de cambios sensibles (role, status de pedido, config)',
      'FulfillmentLog transaccional por pedido',
      'GitHub branch protection en main',
      'Vercel immutable deploys',
    ],
    evidence: [
      'src/lib/fulfillment/service.ts — writeFulfillmentLog atómico',
      'prisma/schema.prisma — model AuditLog + FulfillmentLog',
    ],
  },
  {
    code: 'A09:2021',
    title: 'Security Logging and Monitoring Failures',
    risk: 'Incidentes no detectados o no investigables',
    status: 'implemented',
    controls: [
      'AuditLog con 29 tipos de acción + severidad automática',
      'Dashboard /admin/seguridad con KPIs tiempo real',
      'Export CSV para revisión legal / investigación externa',
      'Sentry-compatible captureException en todos los catches',
      'IP + user agent preservados para investigación',
      'Snapshot de actor (email/rol) sobrevive borrado de usuario',
    ],
    evidence: [
      'src/lib/audit/logger.ts — helper fire-and-forget',
      'src/app/admin/seguridad/page.tsx — dashboard operativo',
      'src/app/api/admin/audit-logs/export/route.ts — export CSV firmado',
    ],
  },
  {
    code: 'A10:2021',
    title: 'Server-Side Request Forgery (SSRF)',
    risk: 'API hace requests a URLs controladas por el atacante',
    status: 'implemented',
    controls: [
      'URLs de terceros (Dropi, Meta, Shopify, Cloudinary) vienen de env vars',
      'Webhooks validan HMAC antes de procesar payload',
      'No se permite al usuario final especificar URLs arbitrarias',
      'Imágenes: validación de dominios permitidos en next.config',
    ],
    evidence: [
      'next.config.ts — images.remotePatterns whitelist',
      'src/app/api/webhooks/*/route.ts — verify HMAC before parse',
    ],
  },
]

export type ComplianceSummary = {
  total: number
  implemented: number
  partial: number
  pending: number
  score: number // 0-100
}

export function summarizeCompliance(items: OwaspItem[]): ComplianceSummary {
  const counts = { implemented: 0, partial: 0, pending: 0 }
  for (const item of items) counts[item.status]++
  const score = Math.round(
    ((counts.implemented * 1 + counts.partial * 0.5) / items.length) * 100,
  )
  return {
    total: items.length,
    implemented: counts.implemented,
    partial: counts.partial,
    pending: counts.pending,
    score,
  }
}

// ── Otros estándares relevantes (referencia adicional para el pitch) ──
export const ADDITIONAL_STANDARDS = [
  {
    name: 'Ley 1581/2012 — Colombia (Habeas Data)',
    status: 'implemented' as ComplianceStatus,
    note: 'Política de privacidad publicada + endpoints de consulta/rectificación implementados',
  },
  {
    name: 'Ley 21.719/2024 — Chile (Protección de Datos)',
    status: 'implemented' as ComplianceStatus,
    note: 'Consentimiento explícito en registro + retención documentada',
  },
  {
    name: 'LOPDP — Ecuador (2021)',
    status: 'implemented' as ComplianceStatus,
    note: 'DPO designado (CEO) + registro de tratamientos',
  },
  {
    name: 'Decreto 57-2008 — Guatemala',
    status: 'implemented' as ComplianceStatus,
    note: 'Acceso a información pública + derecho de acceso del titular',
  },
  {
    name: 'PCI-DSS SAQ A',
    status: 'pending' as ComplianceStatus,
    note: 'No aplicable hasta que pagos LATAM (Wompi/MercadoPago) estén activos',
  },
]
