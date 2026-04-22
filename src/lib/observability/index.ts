// V33 — Observability wrapper
// ═══════════════════════════════════════════════════════════
// Abstracción para reportar errores y eventos. Hoy imprime logs
// estructurados a stdout (Vercel los captura). Para activar Sentry:
//   1) npm install @sentry/nextjs
//   2) set SENTRY_DSN en Vercel env
//   3) reemplazar los console.* de abajo con Sentry.captureException
//
// Diseñado para NO agregar dependencias hoy — solo crear la API
// consistente que después llamamos desde error boundaries y endpoints.

export interface ErrorContext {
  route?: string
  userId?: string
  requestId?: string
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 3) return '[max-depth]'
  if (obj == null) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(v => redact(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (/(password|token|secret|authorization|cookie|api[_-]?key)/i.test(k)) {
      out[k] = '[REDACTED]'
    } else {
      out[k] = redact(v, depth + 1)
    }
  }
  return out
}

export function captureException(err: unknown, ctx?: ErrorContext): void {
  const error = err instanceof Error ? err : new Error(String(err))
  const payload = {
    level: 'error' as const,
    ts: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...ctx,
    extra: ctx?.extra ? redact(ctx.extra) : undefined,
  }
  // Vercel capta stdout y lo indexa en Runtime Logs.
  console.error('[vitalcom:error]', JSON.stringify(payload))
}

export function captureWarning(message: string, ctx?: ErrorContext): void {
  console.warn(
    '[vitalcom:warn]',
    JSON.stringify({
      level: 'warn',
      ts: new Date().toISOString(),
      message,
      ...ctx,
      extra: ctx?.extra ? redact(ctx.extra) : undefined,
    }),
  )
}

export function captureEvent(name: string, ctx?: ErrorContext): void {
  console.log(
    '[vitalcom:event]',
    JSON.stringify({
      level: 'info',
      ts: new Date().toISOString(),
      name,
      ...ctx,
      extra: ctx?.extra ? redact(ctx.extra) : undefined,
    }),
  )
}
