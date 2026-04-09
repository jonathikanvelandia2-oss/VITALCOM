// ── Auth barrel export ──────────────────────────────────
export { authOptions } from './auth.config'
export {
  getSession,
  requireSession,
  requireRole,
  requireArea,
  isStaff,
  isAdmin,
} from './session'
export type { UserSession } from './session'
export {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  requestResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './schemas'
export type {
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from './schemas'
