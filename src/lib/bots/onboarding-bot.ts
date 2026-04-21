import { prisma } from '@/lib/db/prisma'
import type { BotResult } from './types'

// ── OnboardingBot ────────────────────────────────────────
// Guía los primeros 7 días del nuevo VITALCOMMER con una
// notificación diaria de la siguiente acción concreta. Día 1
// bienvenida + Shopify, D2 catálogo, D3 calculadora, D4 primer
// curso, D5 lanzador, D6 feed/comunidad, D7 primer pedido.
// Se dispara 1x/día · dedup por (userId, stepKey).

type OnboardingStep = {
  day: number
  key: string
  title: string
  body: string
  link: string
}

const STEPS: OnboardingStep[] = [
  {
    day: 1,
    key: 'welcome_shopify',
    title: '👋 Bienvenido a Vitalcom — día 1',
    body: 'Empieza conectando tu tienda Shopify en /mi-tienda (2 min). Sin esto no podrás sincronizar productos.',
    link: '/mi-tienda',
  },
  {
    day: 2,
    key: 'explore_catalog',
    title: '🌿 Día 2 · Explora el catálogo',
    body: 'Revisa los 202 productos Vitalcom y filtra por bestsellers. Elige 3-5 que te enamoren para arrancar.',
    link: '/herramientas/catalogo',
  },
  {
    day: 3,
    key: 'pricing_calculator',
    title: '💰 Día 3 · Calcula tu margen',
    body: 'Antes de vender necesitas saber tu margen real. Usa la calculadora multi-país con comisiones reales.',
    link: '/herramientas/calculadora',
  },
  {
    day: 4,
    key: 'first_course',
    title: '🎓 Día 4 · Tu primer curso',
    body: 'Dedica 20 min al curso "Fundamentos Vitalcom". Gamas 50 puntos al completarlo.',
    link: '/cursos',
  },
  {
    day: 5,
    key: 'launch_campaign',
    title: '🚀 Día 5 · Lanza tu primera campaña',
    body: 'El wizard de 5 pasos te guía con IA en audiencia y creativo. Presupuesto sugerido: $20/día.',
    link: '/lanzador',
  },
  {
    day: 6,
    key: 'join_community',
    title: '💬 Día 6 · Únete a la comunidad',
    body: 'Pregunta lo que necesites en /feed. Los VITALCOMMERS son generosos — comparten tácticas reales.',
    link: '/feed',
  },
  {
    day: 7,
    key: 'command_center',
    title: '⚡ Día 7 · Conoce tu Command Center',
    body: 'Ya tienes datos. Entra al Command Center — la IA priorizará tus próximas acciones de crecimiento.',
    link: '/comando',
  },
]

export async function runOnboardingBot(): Promise<BotResult> {
  const now = Date.now()
  const cutoff8 = new Date(now - 8 * 86400000)

  // Usuarios creados hace <8 días
  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ['COMMUNITY', 'DROPSHIPPER'] },
      createdAt: { gte: cutoff8 },
    },
    select: { id: true, name: true, createdAt: true },
  })

  let usersProcessed = 0
  let notifsCreated = 0
  let errors = 0
  const errorLog: Array<{ userId?: string; message: string }> = []

  for (const user of users) {
    const daysSinceRegister = Math.floor((now - user.createdAt.getTime()) / 86400000) + 1
    const step = STEPS.find((s) => s.day === daysSinceRegister)
    if (!step) continue

    usersProcessed++

    try {
      // Dedup por stepKey
      const existing = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'SYSTEM',
          meta: { path: ['stepKey'], equals: step.key },
        },
      })
      if (existing) continue

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: step.title,
          body: step.body,
          link: step.link,
          meta: {
            bot: 'ONBOARDING_BOT',
            stepKey: step.key,
            day: step.day,
          },
        },
      })
      notifsCreated++
    } catch (err) {
      errors++
      errorLog.push({
        userId: user.id,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    usersProcessed,
    itemsAffected: usersProcessed,
    notifsCreated,
    errors,
    errorLog,
    summary: `${usersProcessed} nuevos usuarios guiados · ${notifsCreated} pasos entregados.`,
  }
}
