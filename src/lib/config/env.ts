import { z } from 'zod'

// ── Validación de variables de entorno con Zod ───────────
// Falla al boot si falta algo crítico, no en runtime.
// Uso: import { env } from '@/lib/config/env'

const envSchema = z.object({
  // ── Base de datos (obligatorio) ──
  DATABASE_URL: z.string().url('DATABASE_URL debe ser URL válida'),
  DIRECT_URL: z.string().url('DIRECT_URL debe ser URL válida'),

  // ── Supabase (obligatorio) ──
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL debe ser URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY requerida'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'SUPABASE_SERVICE_ROLE_KEY requerida'),

  // ── NextAuth (obligatorio) ──
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET debe tener mínimo 32 caracteres'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL debe ser URL válida'),

  // ── OpenAI (opcional — VITA degrada si falta) ──
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // ── Cloudinary (opcional — CDN) ──
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),

  // ── Dropi (opcional — fulfillment) ──
  DROPI_API_KEY: z.string().optional(),
  DROPI_API_URL: z.string().url().optional(),

  // ── Resend (opcional — emails) ──
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // ── App ──
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Vitalcom'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    console.error('\n❌ Variables de entorno inválidas:\n' + errors + '\n')

    // En build de producción queremos fallar duro.
    // En dev dejamos pasar para que puedas iterar sin .env completo.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuración de entorno inválida')
    }

    return process.env as unknown as Env
  }

  return result.data
}

export const env = parseEnv()

// Helpers derivados
export const isProd = env.NODE_ENV === 'production'
export const isDev = env.NODE_ENV === 'development'
export const hasOpenAI = Boolean(env.OPENAI_API_KEY)
export const hasCloudinary = Boolean(env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
export const hasDropi = Boolean(env.DROPI_API_KEY)
export const hasResend = Boolean(env.RESEND_API_KEY)
