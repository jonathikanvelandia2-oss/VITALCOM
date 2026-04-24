// V38 — Helpers puros para canales Vitalcom.
// Normaliza teléfonos, arma URLs wa.me seguras, agrupa canales por tipo
// para la UI y valida input antes de persistir. Todo determinista, sin I/O.

export type ChannelTypeLite = 'STAFF_DM' | 'COMMUNITY_GROUP' | 'BROADCAST_LIST' | 'ANNOUNCEMENTS'

export type ChannelLike = {
  id: string
  type: ChannelTypeLite
  area: string | null
  label: string
  description: string | null
  phone: string | null
  inviteUrl: string | null
  defaultMessage: string | null
  icon: string | null
  country: string | null
  active: boolean
  order: number
}

// ── Normalización de teléfonos ───────────────────────
// Aceptamos varios formatos y los convertimos al canónico E.164 SIN "+"
// (formato que wa.me consume directamente).
//
// Ejemplos:
//   "+57 300 123 4567"   → "573001234567"
//   "(+593) 99-123-4567" → "593991234567"
//   "57-300-123-4567"    → "573001234567"

export function normalizePhone(raw: string): string {
  return raw.trim().replace(/[^0-9]/g, '')
}

export function isValidE164(raw: string): boolean {
  const clean = normalizePhone(raw)
  // E.164 sin "+": 8 a 15 dígitos, el primero no es 0
  return /^[1-9]\d{7,14}$/.test(clean)
}

// Prefijos válidos para los 4 países Vitalcom. Usado para advertir cuando
// alguien pone un número que no pertenece al país seleccionado.
export const COUNTRY_PHONE_PREFIX: Record<'CO' | 'EC' | 'GT' | 'CL', string> = {
  CO: '57',
  EC: '593',
  GT: '502',
  CL: '56',
}

export function phoneMatchesCountry(phone: string, country: 'CO' | 'EC' | 'GT' | 'CL'): boolean {
  const clean = normalizePhone(phone)
  const prefix = COUNTRY_PHONE_PREFIX[country]
  return clean.startsWith(prefix)
}

// ── URLs wa.me ───────────────────────────────────────
// wa.me es el shortlink oficial de WhatsApp que funciona sin WABA.
// Formato: https://wa.me/573001234567?text=Hola%20quiero...
// - Solo números (sin "+") en el path
// - text URL-encoded

export function buildWaMeUrl(phone: string | null | undefined, message?: string | null): string | null {
  if (!phone) return null
  const clean = normalizePhone(phone)
  if (!isValidE164(clean)) return null
  const base = `https://wa.me/${clean}`
  if (!message) return base
  const text = encodeURIComponent(message.trim().slice(0, 1000))
  return `${base}?text=${text}`
}

// Valida que un inviteUrl parezca URL legítima de WhatsApp.
// Aceptamos: https://chat.whatsapp.com/... y https://whatsapp.com/channel/...
const VALID_WA_INVITE_HOSTS = ['chat.whatsapp.com', 'whatsapp.com']

export function isValidWhatsAppInvite(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    return VALID_WA_INVITE_HOSTS.includes(u.hostname)
  } catch {
    return false
  }
}

// ── Resolución a URL de destino ───────────────────────
// Dependiendo del tipo de canal, la URL final es distinta. Esta función
// es el punto único que la UI consume.

export function resolveChannelUrl(channel: ChannelLike): string | null {
  switch (channel.type) {
    case 'STAFF_DM':
      return buildWaMeUrl(channel.phone, channel.defaultMessage)
    case 'BROADCAST_LIST':
      // El user escribe a un número para suscribirse. Reutilizamos wa.me.
      return buildWaMeUrl(channel.phone, channel.defaultMessage ?? 'Quiero suscribirme')
    case 'COMMUNITY_GROUP':
    case 'ANNOUNCEMENTS':
      return channel.inviteUrl && isValidWhatsAppInvite(channel.inviteUrl) ? channel.inviteUrl : null
  }
}

// ── Agrupación para UI ───────────────────────────────
// La comunidad ve 3 bloques: Grupos · Áreas de staff · Anuncios.

export type ChannelGroup = {
  key: 'groups' | 'staff' | 'announcements'
  label: string
  description: string
  channels: ChannelLike[]
}

export function groupChannelsForUI(channels: ChannelLike[]): ChannelGroup[] {
  const sortByOrder = (a: ChannelLike, b: ChannelLike) => a.order - b.order || a.label.localeCompare(b.label)

  const groups = channels.filter((c) => c.active && c.type === 'COMMUNITY_GROUP').sort(sortByOrder)
  const staff = channels
    .filter((c) => c.active && (c.type === 'STAFF_DM' || c.type === 'BROADCAST_LIST'))
    .sort(sortByOrder)
  const announcements = channels.filter((c) => c.active && c.type === 'ANNOUNCEMENTS').sort(sortByOrder)

  const out: ChannelGroup[] = []
  if (groups.length > 0) {
    out.push({
      key: 'groups',
      label: 'Grupos de la comunidad',
      description: 'Espacios para conectar con otros VITALCOMMERS y compartir aprendizajes',
      channels: groups,
    })
  }
  if (staff.length > 0) {
    out.push({
      key: 'staff',
      label: 'Áreas de Vitalcom',
      description: 'Contacta al área que necesites — respuesta en horario hábil',
      channels: staff,
    })
  }
  if (announcements.length > 0) {
    out.push({
      key: 'announcements',
      label: 'Anuncios oficiales',
      description: 'Suscríbete para recibir actualizaciones oficiales de Vitalcom',
      channels: announcements,
    })
  }
  return out
}

// ── Filtros ──────────────────────────────────────────
export function filterChannelsForCountry<T extends ChannelLike>(channels: T[], country: string | null): T[] {
  if (!country) return channels
  return channels.filter((c) => !c.country || c.country === country)
}

// ── Validación de input admin ────────────────────────
export type ChannelValidationError = { field: string; message: string }

export function validateChannelInput(input: {
  type: ChannelTypeLite
  label: string
  phone?: string | null
  inviteUrl?: string | null
}): ChannelValidationError[] {
  const errors: ChannelValidationError[] = []

  if (!input.label || input.label.trim().length < 2) {
    errors.push({ field: 'label', message: 'Label mínimo 2 caracteres' })
  }

  if (input.type === 'STAFF_DM' || input.type === 'BROADCAST_LIST') {
    if (!input.phone) {
      errors.push({ field: 'phone', message: 'Teléfono requerido para este tipo' })
    } else if (!isValidE164(input.phone)) {
      errors.push({ field: 'phone', message: 'Teléfono debe estar en formato E.164 (ej: 573001234567)' })
    }
  }

  if (input.type === 'COMMUNITY_GROUP' || input.type === 'ANNOUNCEMENTS') {
    if (!input.inviteUrl) {
      errors.push({ field: 'inviteUrl', message: 'URL de invitación requerida' })
    } else if (!isValidWhatsAppInvite(input.inviteUrl)) {
      errors.push({ field: 'inviteUrl', message: 'URL debe ser de chat.whatsapp.com o whatsapp.com' })
    }
  }

  return errors
}

// ── Analytics: agregaciones de clicks ────────────────
// Toma una lista plana de clicks ({channelId, createdAt}) y devuelve
// métricas útiles. Pure, para usar con datos ya leídos de BD.

export type ClickAggregation = {
  channelId: string
  total: number
  last7Days: number
  last30Days: number
  lastClickAt: string | null
}

export function aggregateClicks(
  clicks: Array<{ channelId: string; createdAt: Date }>,
  now: Date = new Date(),
): Map<string, ClickAggregation> {
  const DAY_MS = 24 * 60 * 60 * 1000
  const cutoff7 = now.getTime() - 7 * DAY_MS
  const cutoff30 = now.getTime() - 30 * DAY_MS

  const map = new Map<string, ClickAggregation>()

  for (const c of clicks) {
    const ts = c.createdAt.getTime()
    const prev = map.get(c.channelId) ?? {
      channelId: c.channelId,
      total: 0,
      last7Days: 0,
      last30Days: 0,
      lastClickAt: null as string | null,
    }
    prev.total++
    if (ts >= cutoff7) prev.last7Days++
    if (ts >= cutoff30) prev.last30Days++
    if (!prev.lastClickAt || new Date(prev.lastClickAt).getTime() < ts) {
      prev.lastClickAt = c.createdAt.toISOString()
    }
    map.set(c.channelId, prev)
  }

  return map
}
