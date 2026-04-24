// V42 — Onboarding interactivo para VITALCOMMERS nuevos.
// Los pasos se derivan del estado existente de la BD (no hay tabla dedicada) —
// eso garantiza que el widget siempre refleja la realidad y evita dual state.
//
// Helpers puros: sin Prisma, sin fetch. El endpoint calcula los flags, esta
// capa los convierte en steps + progress.

export type StepKey =
  | 'profile'
  | 'store'
  | 'product'
  | 'calculation'
  | 'whatsapp'
  | 'post'
  | 'order'

export type OnboardingStep = {
  key: StepKey
  title: string
  description: string
  cta: { label: string; href: string }
  estimatedMin: number
  required: boolean
  completed: boolean
  points: number // puntos de gamificación que gana al completar
}

// ── Flags crudos que el endpoint calcula de la BD ──
export type UserCompletionFlags = {
  hasAvatar: boolean
  hasBio: boolean
  hasWhatsapp: boolean
  hasStore: boolean
  hasProductSync: boolean
  hasCalculation: boolean
  hasChannelClick: boolean
  hasPost: boolean
  hasOrder: boolean
}

// ── Definición de pasos ──
// Orden intencional: de menor a mayor fricción.
// Los 4 primeros son "required" — se consideran setup mínimo.
export function buildSteps(flags: UserCompletionFlags): OnboardingStep[] {
  return [
    {
      key: 'profile',
      title: 'Completa tu perfil',
      description: 'Agrega foto, bio y WhatsApp para que la comunidad te conozca.',
      cta: { label: 'Editar perfil', href: '/perfil' },
      estimatedMin: 2,
      required: true,
      completed: flags.hasAvatar && flags.hasBio && flags.hasWhatsapp,
      points: 15,
    },
    {
      key: 'whatsapp',
      title: 'Únete a los canales de Vitalcom',
      description: 'WhatsApp de comunidad, soporte y anuncios. Es donde pasa todo.',
      cta: { label: 'Ver canales', href: '/canales' },
      estimatedMin: 1,
      required: true,
      completed: flags.hasChannelClick,
      points: 10,
    },
    {
      key: 'calculation',
      title: 'Haz tu primera calculación',
      description: 'Prueba la calculadora de precios con un producto que te interese.',
      cta: { label: 'Calculadora', href: '/herramientas/calculadora' },
      estimatedMin: 3,
      required: true,
      completed: flags.hasCalculation,
      points: 10,
    },
    {
      key: 'post',
      title: 'Preséntate en el feed',
      description: 'Cuenta a la comunidad quién eres y qué te trae a Vitalcom.',
      cta: { label: 'Ir al feed', href: '/feed' },
      estimatedMin: 3,
      required: true,
      completed: flags.hasPost,
      points: 20,
    },
    {
      key: 'store',
      title: 'Conecta tu tienda Shopify',
      description: 'Importa productos Vitalcom directo a tu tienda con un clic.',
      cta: { label: 'Mi tienda', href: '/mi-tienda' },
      estimatedMin: 10,
      required: false,
      completed: flags.hasStore,
      points: 50,
    },
    {
      key: 'product',
      title: 'Importa tu primer producto',
      description: 'Lleva tu primer producto Vitalcom a tu tienda con imágenes y descripción.',
      cta: { label: 'Catálogo', href: '/herramientas/catalogo' },
      estimatedMin: 5,
      required: false,
      completed: flags.hasProductSync,
      points: 30,
    },
    {
      key: 'order',
      title: 'Genera tu primera venta',
      description: 'Cuando recibas tu primer pedido aparecerá acá. ¡Vamos!',
      cta: { label: 'Mis pedidos', href: '/pedidos' },
      estimatedMin: 0,
      required: false,
      completed: flags.hasOrder,
      points: 100,
    },
  ]
}

export type OnboardingProgress = {
  steps: OnboardingStep[]
  completedRequired: number
  totalRequired: number
  completedOptional: number
  totalOptional: number
  percent: number // 0-100 considerando todos los pasos
  percentRequired: number // 0-100 solo required
  nextStep: OnboardingStep | null
  totalPointsEarned: number
  totalPointsAvailable: number
  allRequiredComplete: boolean
  allComplete: boolean
}

export function computeProgress(steps: OnboardingStep[]): OnboardingProgress {
  const required = steps.filter((s) => s.required)
  const optional = steps.filter((s) => !s.required)
  const completedRequired = required.filter((s) => s.completed).length
  const completedOptional = optional.filter((s) => s.completed).length
  const completedAll = steps.filter((s) => s.completed).length

  const nextStep = steps.find((s) => !s.completed) ?? null

  const totalPointsAvailable = steps.reduce((acc, s) => acc + s.points, 0)
  const totalPointsEarned = steps
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.points, 0)

  return {
    steps,
    completedRequired,
    totalRequired: required.length,
    completedOptional,
    totalOptional: optional.length,
    percent: Math.round((completedAll / steps.length) * 100),
    percentRequired:
      required.length === 0 ? 100 : Math.round((completedRequired / required.length) * 100),
    nextStep,
    totalPointsEarned,
    totalPointsAvailable,
    allRequiredComplete: completedRequired === required.length,
    allComplete: completedAll === steps.length,
  }
}

// ── Visibilidad del widget ──
// Se oculta si:
// - El user hizo dismiss
// - Completó todos los requeridos Y es usuario "veterano" (>30 días)
// - Es staff interno (no aplica el flujo de onboarding de dropshippers)
export function shouldShowWidget(input: {
  role: string
  createdAt: Date
  dismissedAt: Date | null
  allRequiredComplete: boolean
  now?: Date
}): boolean {
  const now = input.now ?? new Date()
  if (input.dismissedAt) return false

  const isStaff = ['SUPERADMIN', 'ADMIN', 'MANAGER_AREA', 'EMPLOYEE'].includes(input.role)
  if (isStaff) return false

  // Si todavía está en los primeros 30 días, mostrar aunque requireds completos
  // (para empujar los opcionales y la primera venta).
  const daysOld = (now.getTime() - input.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysOld <= 30) return true

  // Después de 30 días, ocultar si los required ya están listos
  return !input.allRequiredComplete
}

// ── Mensaje motivacional según progreso ──
export function getMotivationMessage(progress: OnboardingProgress): string {
  if (progress.allComplete) {
    return '¡Eres un Vitalcommer completo! 🚀'
  }
  if (progress.allRequiredComplete) {
    return '¡Setup mínimo listo! Ahora a vender.'
  }
  if (progress.completedRequired === 0) {
    return 'Bienvenido a Vitalcom. Empecemos paso a paso.'
  }
  if (progress.percentRequired >= 75) {
    return '¡Casi! Un paso más para el setup completo.'
  }
  return `${progress.completedRequired} de ${progress.totalRequired} pasos listos. Sigue así.`
}
