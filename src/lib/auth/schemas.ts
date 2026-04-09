import { z } from 'zod'

// ── Schemas de validación para autenticación ────────────
// Usar en formularios (react-hook-form + zodResolver)
// y en API routes (server-side validation).

// Política de contraseñas: mínimo 8 chars, al menos 1 mayúscula,
// 1 minúscula, 1 número. Compatible con todos los países.
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede exceder 128 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número')

// ── Login ────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(254, 'Email demasiado largo')
    .transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ── Registro de comunidad ────────────────────────────────
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .max(254, 'Email demasiado largo')
    .transform((e) => e.toLowerCase().trim()),
  password: passwordSchema,
  confirmPassword: z.string(),
  whatsapp: z
    .string()
    .regex(/^\+?\d{7,15}$/, 'Número de WhatsApp inválido')
    .optional()
    .or(z.literal('')),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' }),
  }),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>

// ── Cambio de contraseña ─────────────────────────────────
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword'],
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ── Reset de contraseña ──────────────────────────────────
export const requestResetSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((e) => e.toLowerCase().trim()),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// ── Actualizar perfil ────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z
    .string()
    .regex(/^\+?\d{7,15}$/, 'Número de teléfono inválido')
    .optional()
    .or(z.literal('')),
  whatsapp: z
    .string()
    .regex(/^\+?\d{7,15}$/, 'Número de WhatsApp inválido')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, 'La bio no puede exceder 500 caracteres').optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
