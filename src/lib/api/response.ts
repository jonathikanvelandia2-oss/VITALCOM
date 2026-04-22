import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { captureException } from '@/lib/observability'

// ── Helpers de respuesta API ─────────────────────────────
// Formato consistente para todas las API routes de Vitalcom.

type ApiSuccessResponse<T = unknown> = {
  ok: true
  data: T
}

type ApiErrorResponse = {
  ok: false
  error: string
  code?: string
  fieldErrors?: Record<string, string[]>
}

/** Respuesta exitosa con formato estándar */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccessResponse<T>, { status })
}

/** Respuesta de error con formato estándar */
export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error: message, code } satisfies ApiErrorResponse, { status })
}

/** Wrapper que captura errores y retorna respuestas apropiadas */
export function withErrorHandler(
  handler: (req: Request, ctx?: any) => Promise<NextResponse>
) {
  return async (req: Request, ctx?: any) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      // Errores de validación Zod → 400 con detalle de campos
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {}
        for (const issue of error.issues) {
          const path = issue.path.join('.')
          if (!fieldErrors[path]) fieldErrors[path] = []
          fieldErrors[path].push(issue.message)
        }
        return NextResponse.json(
          { ok: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR', fieldErrors } satisfies ApiErrorResponse,
          { status: 400 }
        )
      }

      // Errores de auth/permisos
      if (error instanceof Error) {
        if (error.message === 'UNAUTHORIZED') {
          return apiError('No autenticado', 401, 'UNAUTHORIZED')
        }
        if (error.message === 'FORBIDDEN') {
          return apiError('Sin permisos', 403, 'FORBIDDEN')
        }
        if (error.message === 'NOT_FOUND') {
          return apiError('No encontrado', 404, 'NOT_FOUND')
        }
      }

      // Error interno — reportar con contexto sin filtrar al cliente
      const route = req.url ? new URL(req.url).pathname : undefined
      captureException(error, {
        route,
        tags: { surface: 'api' },
        extra: { method: req.method },
      })
      return apiError('Error interno del servidor', 500, 'INTERNAL_ERROR')
    }
  }
}
