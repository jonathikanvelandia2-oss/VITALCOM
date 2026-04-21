// V30 — Opt-out detection + validation
// ═══════════════════════════════════════════════════════════
// Meta exige que las plantillas MARKETING mencionen cómo
// darse de baja. Aquí centralizamos:
// 1) Detección de mensajes entrantes con intención de baja
// 2) Validación de cuerpos de plantilla MARKETING
// 3) Texto de confirmación al usuario
//
// Palabras clave cubren ES (LATAM) + EN básico.

// Entrantes: detectar mensajes cortos de STOP
const STOP_KEYWORDS_REGEX =
  /^\s*(stop|baja|salir|cancelar|unsubscribe|parar|no\s+m[aá]s|no\s+molestar|darme\s+de\s+baja)\s*!*\s*$/i

export function isOptOutMessage(text: string | null | undefined): boolean {
  if (!text) return false
  return STOP_KEYWORDS_REGEX.test(text)
}

// Confirmación al usuario tras opt-out
export const OPT_OUT_CONFIRMATION_TEXT =
  '✅ Listo. No recibirás más mensajes de marketing. ' +
  'Si cambias de idea, respóndenos *ALTA* en cualquier momento.'

// Re-activación (futuro)
const OPT_IN_KEYWORDS_REGEX = /^\s*(alta|volver|suscribir|opt[\s-]?in|resume)\s*!*\s*$/i

export function isOptInMessage(text: string | null | undefined): boolean {
  if (!text) return false
  return OPT_IN_KEYWORDS_REGEX.test(text)
}

export const OPT_IN_CONFIRMATION_TEXT =
  '🎉 ¡Bienvenido de vuelta! Volverás a recibir nuestras novedades. ' +
  'Recuerda que puedes darte de baja en cualquier momento enviando *STOP*.'

// Validación: una plantilla MARKETING debe mencionar cómo darse de baja
const MARKETING_DISCLOSURE_REGEX =
  /(stop|baja|darse\s+de\s+baja|no\s+recibir\s+m[aá]s|unsubscribe|cancelar\s+suscripci[oó]n|opt[\s-]?out)/i

export function marketingTemplateHasOptOut(text: string): boolean {
  return MARKETING_DISCLOSURE_REGEX.test(text)
}

// Footer sugerido para que el operador copie al crear una MARKETING
export const SUGGESTED_MARKETING_FOOTER =
  'Responde STOP para no recibir más mensajes.'

// V30.1 — auto-append del disclosure a una plantilla MARKETING
// Devuelve un nuevo { bodyText, footerText } con opt-out garantizado.
// Estrategia: prefiere agregar al footer (limpio, no cambia el body).
// Solo toca el body si footer ya no cabe (60 chars límite Meta).
const META_FOOTER_LIMIT = 60
const META_BODY_LIMIT = 1024

export interface MarketingTemplateTexts {
  bodyText: string
  footerText?: string | null | undefined
}

export interface AutoAppendResult {
  bodyText: string
  footerText: string | null
  modified: boolean
  target: 'footer' | 'body' | 'none'
}

export function ensureMarketingOptOut(input: MarketingTemplateTexts): AutoAppendResult {
  const body = input.bodyText
  const footer = input.footerText ?? null
  const combined = [body, footer ?? ''].join(' ')

  if (marketingTemplateHasOptOut(combined)) {
    return { bodyText: body, footerText: footer, modified: false, target: 'none' }
  }

  // 1) Si no hay footer, ponemos el sugerido
  if (!footer) {
    return {
      bodyText: body,
      footerText: SUGGESTED_MARKETING_FOOTER,
      modified: true,
      target: 'footer',
    }
  }

  // 2) Si hay footer pero cabe el disclosure, lo concatenamos
  const candidateFooter = `${footer.trim()} ${SUGGESTED_MARKETING_FOOTER}`
  if (candidateFooter.length <= META_FOOTER_LIMIT) {
    return {
      bodyText: body,
      footerText: candidateFooter,
      modified: true,
      target: 'footer',
    }
  }

  // 3) Fallback: si el footer no admite más, vamos al body
  const candidateBody = `${body.trim()}\n\n${SUGGESTED_MARKETING_FOOTER}`
  if (candidateBody.length <= META_BODY_LIMIT) {
    return {
      bodyText: candidateBody,
      footerText: footer,
      modified: true,
      target: 'body',
    }
  }

  // Último recurso: reemplazamos footer con sólo el disclosure (pierde su footer original)
  return {
    bodyText: body,
    footerText: SUGGESTED_MARKETING_FOOTER,
    modified: true,
    target: 'footer',
  }
}
