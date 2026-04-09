import { z } from 'zod'

// ── Validación de variables de entorno al arrancar ──────
// Si falta alguna variable crítica, la app NO arranca.
// Esto previene deploys rotos y conexiones inseguras.

const serverEnvSchema = z.object({
  // Base de datos — obligatorio siempre
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL es requerida')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL debe ser una URL de PostgreSQL válida'
    ),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL es requerida'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Auth
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET debe tener al menos 32 caracteres'),
  NEXTAUTH_URL: z.string().url(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Vitalcom'),

  // Opcionales (Fase 2+)
  OPENAI_API_KEY: z.string().optional(),
  DROPI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  WOMPI_PUBLIC_KEY: z.string().optional(),
  WOMPI_PRIVATE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
})

// Variables públicas (accesibles desde el cliente)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Vitalcom'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

/**
 * Valida las variables de entorno del servidor.
 * Llamar en server-side code (API routes, middleware, server components).
 * Falla ruidosamente si falta algo crítico.
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ✗ ${i.path.join('.')}: ${i.message}`)
      .join('\n')

    throw new Error(
      `\n╔══════════════════════════════════════════╗\n` +
      `║  VITALCOM — Error de configuración       ║\n` +
      `╚══════════════════════════════════════════╝\n\n` +
      `Variables de entorno inválidas o faltantes:\n${missing}\n\n` +
      `Revisa tu archivo .env.local\n`
    )
  }

  return result.data
}

/**
 * Valida variables públicas (cliente).
 */
export function validateClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  })
}
