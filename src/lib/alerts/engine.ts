// V31 — Proactive Alerts Engine
// ═══════════════════════════════════════════════════════════
// Evalúa reglas activas del dropshipper contra la BD y dispara
// notificaciones in-app + WhatsApp. Respeta cooldown por alerta.
//
// Diseño:
//  - Evaluadores puros por tipo (devuelven ocurrencias = ventos detectados)
//  - Dispatcher aplica cooldown + crea Notification + envía WhatsApp
//  - Cooldown se calcula contra lastTriggeredAt en cada alerta
//
// No dispara si `lastTriggeredAt + cooldownMinutes > now`.
// Guarda log por cada entrega (éxito o fallo).

import { prisma } from '@/lib/db/prisma'
import {
  NotificationType,
  OrderStatus,
  ProactiveAlertChannel,
  ProactiveAlertType,
  type ProactiveAlert,
} from '@prisma/client'

// ─── Tipos ──────────────────────────────────────────────────
export interface AlertOccurrence {
  title: string
  body: string
  link?: string
  meta?: Record<string, unknown>
  whatsappText: string
}

export interface EngineRunResult {
  evaluated: number
  triggered: number
  skippedCooldown: number
  errors: number
}

// ─── Utilidades cooldown ────────────────────────────────────
export function isOnCooldown(alert: Pick<ProactiveAlert, 'lastTriggeredAt' | 'cooldownMinutes'>, now: Date = new Date()): boolean {
  if (!alert.lastTriggeredAt) return false
  const elapsed = now.getTime() - alert.lastTriggeredAt.getTime()
  return elapsed < alert.cooldownMinutes * 60_000
}

// ─── Evaluadores por tipo ───────────────────────────────────
// STOCK_LOW — Vitalcom stock en el país del usuario cae bajo threshold
// config: { threshold: number, productSkus?: string[] }
export async function evalStockLow(
  userId: string,
  config: { threshold?: number; productSkus?: string[] },
): Promise<AlertOccurrence | null> {
  const threshold = typeof config.threshold === 'number' ? config.threshold : 10

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { country: true },
  })
  if (!user?.country) return null

  const stockWhere = {
    country: user.country,
    quantity: { lte: threshold, gt: 0 }, // todavía queda algo pero poco
    ...(config.productSkus && config.productSkus.length > 0
      ? { product: { sku: { in: config.productSkus } } }
      : {}),
  }

  const low = await prisma.stock.findMany({
    where: stockWhere,
    include: { product: { select: { sku: true, name: true } } },
    orderBy: { quantity: 'asc' },
    take: 5,
  })

  if (low.length === 0) return null

  const names = low.map(s => `${s.product.name} (${s.quantity})`).join(', ')
  const title = `Stock bajo en ${user.country}`
  const body = `Productos cerca de agotarse: ${names}`
  return {
    title,
    body,
    link: '/herramientas/catalogo',
    meta: {
      country: user.country,
      items: low.map(s => ({ sku: s.product.sku, quantity: s.quantity })),
    },
    whatsappText:
      `⚠️ *Stock bajo* en ${user.country}:\n${low
        .map(s => `• ${s.product.name} — quedan ${s.quantity}`)
        .join('\n')}\n\nReabastece o ajusta tu catálogo antes de lanzar ads.`,
  }
}

// ORDER_DISPATCHED / ORDER_DELIVERED — uno de tus pedidos cambió de estado
// config: { includeTracking?: boolean }
export async function evalOrderStatus(
  userId: string,
  status: OrderStatus,
  lookbackMinutes: number,
): Promise<AlertOccurrence | null> {
  const since = new Date(Date.now() - lookbackMinutes * 60_000)
  const orders = await prisma.order.findMany({
    where: {
      userId,
      status,
      updatedAt: { gte: since },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  })

  if (orders.length === 0) return null

  const verb =
    status === OrderStatus.DISPATCHED
      ? 'salieron de bodega'
      : status === OrderStatus.DELIVERED
        ? 'fueron entregados'
        : 'cambiaron de estado'

  const title = `${orders.length} pedido${orders.length > 1 ? 's' : ''} ${verb}`
  const body = orders
    .slice(0, 3)
    .map(o => `#${o.number} — ${o.customerName}`)
    .join(' · ')

  return {
    title,
    body,
    link: '/pedidos',
    meta: {
      status,
      orderIds: orders.map(o => o.id),
      orderNumbers: orders.map(o => o.number),
    },
    whatsappText:
      `📦 *${title}*\n\n${orders
        .slice(0, 3)
        .map(
          o =>
            `• #${o.number} (${o.customerName})${o.trackingCode ? ` · tracking ${o.trackingCode}` : ''}`,
        )
        .join('\n')}`,
  }
}

// DAILY_SUMMARY — resumen simple del día (pedidos + revenue)
export async function evalDailySummary(
  userId: string,
): Promise<AlertOccurrence | null> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const orders = await prisma.order.findMany({
    where: { userId, createdAt: { gte: startOfDay } },
    select: { total: true, status: true },
  })

  if (orders.length === 0) {
    return {
      title: 'Resumen del día — 0 pedidos',
      body: 'Hoy no tuviste pedidos nuevos. Revisa tus campañas.',
      link: '/mi-pyg',
      meta: { ordersToday: 0 },
      whatsappText:
        '📊 *Resumen del día*\n\nHoy: 0 pedidos. Hora de revisar campañas y creativos.',
    }
  }

  const revenue = orders.reduce((sum, o) => sum + o.total, 0)
  const delivered = orders.filter(o => o.status === OrderStatus.DELIVERED).length
  const dispatched = orders.filter(o => o.status === OrderStatus.DISPATCHED).length

  return {
    title: `Resumen — ${orders.length} pedidos hoy`,
    body: `Revenue: $${revenue.toLocaleString('es-CO')} · ${dispatched} en ruta · ${delivered} entregados`,
    link: '/mi-pyg',
    meta: { ordersToday: orders.length, revenue, delivered, dispatched },
    whatsappText:
      `📊 *Resumen del día*\n\n` +
      `• Pedidos: ${orders.length}\n` +
      `• Revenue: $${revenue.toLocaleString('es-CO')}\n` +
      `• En ruta: ${dispatched}\n` +
      `• Entregados: ${delivered}`,
  }
}

// ROAS_DROP — aproxima ROAS = revenue(Order) / spend(AdSpendEntry)
// config: { threshold: number, windowHours: number }
export async function evalRoasDrop(
  userId: string,
  config: { threshold?: number; windowHours?: number },
): Promise<AlertOccurrence | null> {
  const threshold = typeof config.threshold === 'number' ? config.threshold : 1.5
  const windowHours = typeof config.windowHours === 'number' ? config.windowHours : 24

  const since = new Date(Date.now() - windowHours * 3_600_000)

  // Gasto: suma de AdSpendEntry de las AdAccount del usuario
  const spendAgg = await prisma.adSpendEntry.aggregate({
    where: {
      account: { userId },
      date: { gte: since },
    },
    _sum: { spend: true },
  })
  const totalSpend = spendAgg._sum?.spend ?? 0
  if (totalSpend === 0) return null

  // Revenue: suma de Order.total del mismo usuario en la ventana
  const revenueAgg = await prisma.order.aggregate({
    where: {
      userId,
      createdAt: { gte: since },
    },
    _sum: { total: true },
  })
  const totalRevenue = revenueAgg._sum?.total ?? 0

  const roas = totalRevenue / totalSpend
  if (roas >= threshold) return null

  return {
    title: `ROAS cayó a ${roas.toFixed(2)}x`,
    body: `En las últimas ${windowHours}h: gastaste $${totalSpend.toLocaleString('es-CO')}, vendiste $${totalRevenue.toLocaleString('es-CO')}.`,
    link: '/publicidad',
    meta: { roas, totalSpend, totalRevenue, threshold },
    whatsappText:
      `🚨 *ROAS bajo*\n\n` +
      `Últimas ${windowHours}h:\n` +
      `• Gasto: $${totalSpend.toLocaleString('es-CO')}\n` +
      `• Revenue: $${totalRevenue.toLocaleString('es-CO')}\n` +
      `• ROAS: ${roas.toFixed(2)}x (umbral ${threshold}x)\n\n` +
      `Revisa creativos o pausa campañas que no escalan.`,
  }
}

// ─── Dispatcher por alerta individual ───────────────────────
export async function evaluateAlert(
  alert: ProactiveAlert,
): Promise<AlertOccurrence | null> {
  const config = (alert.config as Record<string, unknown>) ?? {}

  switch (alert.type) {
    case ProactiveAlertType.STOCK_LOW:
      return evalStockLow(alert.userId, config as { threshold?: number; productSkus?: string[] })
    case ProactiveAlertType.ORDER_DISPATCHED:
      return evalOrderStatus(
        alert.userId,
        OrderStatus.DISPATCHED,
        Math.max(60, alert.cooldownMinutes),
      )
    case ProactiveAlertType.ORDER_DELIVERED:
      return evalOrderStatus(
        alert.userId,
        OrderStatus.DELIVERED,
        Math.max(60, alert.cooldownMinutes),
      )
    case ProactiveAlertType.DAILY_SUMMARY:
      return evalDailySummary(alert.userId)
    case ProactiveAlertType.ROAS_DROP:
      return evalRoasDrop(
        alert.userId,
        config as { threshold?: number; windowHours?: number },
      )
    default:
      return null
  }
}

// ─── Run masivo (lo llama el cron) ──────────────────────────
export async function runAlertsEngine(options?: { userId?: string; dryRun?: boolean }): Promise<EngineRunResult> {
  const dryRun = options?.dryRun ?? false
  const alerts = await prisma.proactiveAlert.findMany({
    where: {
      enabled: true,
      ...(options?.userId ? { userId: options.userId } : {}),
    },
    include: { user: { select: { whatsapp: true, name: true } } },
  })

  const result: EngineRunResult = {
    evaluated: alerts.length,
    triggered: 0,
    skippedCooldown: 0,
    errors: 0,
  }

  for (const alert of alerts) {
    if (isOnCooldown(alert)) {
      result.skippedCooldown++
      continue
    }

    try {
      const occ = await evaluateAlert(alert)
      if (!occ) continue

      if (dryRun) {
        result.triggered++
        continue
      }

      await deliverOccurrence(alert, occ)
      result.triggered++
    } catch (err) {
      console.error('[alerts:engine] error evaluando alert', alert.id, err)
      result.errors++
    }
  }

  return result
}

// ─── Entrega (in-app + whatsapp) ────────────────────────────
async function deliverOccurrence(
  alert: ProactiveAlert & { user: { whatsapp: string | null; name: string | null } },
  occ: AlertOccurrence,
) {
  let notifyId: string | null = null
  let whatsappSent = false
  let errorMessage: string | null = null

  // In-app
  if (
    alert.channel === ProactiveAlertChannel.IN_APP
    || alert.channel === ProactiveAlertChannel.BOTH
  ) {
    try {
      const n = await prisma.notification.create({
        data: {
          userId: alert.userId,
          type: mapAlertToNotifType(alert.type),
          title: occ.title,
          body: occ.body,
          link: occ.link,
          meta: (occ.meta ?? {}) as never,
        },
      })
      notifyId = n.id
    } catch (err) {
      errorMessage = `notification: ${(err as Error).message}`
    }
  }

  // WhatsApp — requiere phoneE164 del usuario + WhatsappAccount propia o de Vitalcom
  if (
    (alert.channel === ProactiveAlertChannel.WHATSAPP
      || alert.channel === ProactiveAlertChannel.BOTH)
    && alert.user.whatsapp
  ) {
    try {
      await sendWhatsappAlert(alert.userId, alert.user.whatsapp, occ.whatsappText)
      whatsappSent = true
    } catch (err) {
      errorMessage = `${errorMessage ? errorMessage + ' · ' : ''}whatsapp: ${(err as Error).message}`
    }
  }

  await prisma.proactiveAlert.update({
    where: { id: alert.id },
    data: { lastTriggeredAt: new Date() },
  })

  await prisma.proactiveAlertLog.create({
    data: {
      alertId: alert.id,
      payload: {
        title: occ.title,
        body: occ.body,
        meta: occ.meta ?? {},
      } as never,
      channel: alert.channel,
      whatsappSent,
      notifyId,
      errorMessage,
    },
  })
}

function mapAlertToNotifType(type: ProactiveAlertType): NotificationType {
  switch (type) {
    case ProactiveAlertType.ORDER_DISPATCHED:
    case ProactiveAlertType.ORDER_DELIVERED:
      return NotificationType.ORDER_STATUS
    case ProactiveAlertType.DAILY_SUMMARY:
      return NotificationType.MORNING_BRIEF
    case ProactiveAlertType.STOCK_LOW:
    case ProactiveAlertType.ROAS_DROP:
      return NotificationType.AI_ACTION
    default:
      return NotificationType.SYSTEM
  }
}

// Envía texto WhatsApp usando la cuenta del dropshipper (si tiene una activa)
// — en MOCK mode simula éxito.
async function sendWhatsappAlert(userId: string, toPhoneE164: string, text: string): Promise<void> {
  const account = await prisma.whatsappAccount.findFirst({
    where: { userId, isActive: true },
  })
  if (!account) {
    // Fallback: sin account activo, registramos como mock
    console.log('[alerts:wa:mock] no account for', userId, '→', text.slice(0, 80))
    return
  }

  const { sendText } = await import('@/lib/whatsapp/client')
  await sendText({
    accountId: account.id,
    toPhoneE164,
    text,
  })
}
