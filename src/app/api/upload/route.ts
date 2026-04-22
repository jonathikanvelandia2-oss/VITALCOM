import { NextResponse } from 'next/server'
import { requireRole, requireSession } from '@/lib/auth/session'
import { captureException } from '@/lib/observability'
import { guardRateLimit } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

const BUCKETS = { products: 'products', videos: 'videos', avatars: 'avatars' }
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

// ── POST /api/upload — Subir archivo a Supabase Storage ─
export async function POST(req: Request) {
  try {
    const session = await requireSession()
    await requireRole('EMPLOYEE')

    // 30 uploads / 5min por usuario — previene storage-bomb abusivo
    const blocked = guardRateLimit(`upload:${session.id}`, { maxRequests: 30, windowMs: 5 * 60_000 })
    if (blocked) return blocked

    // Hardening: fallar con 503 en vez de crashear si faltan env vars en prod
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      captureException(new Error('Supabase env vars missing'), { route: '/api/upload' })
      return NextResponse.json(
        { ok: false, error: 'Servicio de storage no configurado', code: 'STORAGE_NOT_CONFIGURED' },
        { status: 503 },
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'products'
    const folder = (formData.get('folder') as string) || ''

    if (!file) {
      return NextResponse.json({ ok: false, error: 'Archivo requerido' }, { status: 400 })
    }

    const maxSize = bucket === 'videos' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: `Archivo excede ${maxSize / 1024 / 1024}MB` }, { status: 400 })
    }

    const allowedTypes = bucket === 'videos'
      ? ['video/mp4', 'video/webm']
      : ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ ok: false, error: `Tipo no permitido: ${file.type}` }, { status: 400 })
    }

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = folder ? `${folder}/${timestamp}-${safeName}` : `${timestamp}-${safeName}`

    const arrayBuffer = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      captureException(error, { route: '/api/upload', tags: { stage: 'supabase-upload' } })
      return NextResponse.json(
        { ok: false, error: 'No se pudo subir el archivo', code: 'UPLOAD_FAILED' },
        { status: 500 },
      )
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`

    return NextResponse.json({
      ok: true,
      data: { url: publicUrl, path, bucket, size: file.size, type: file.type },
    }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ ok: false, error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    if (msg === 'FORBIDDEN') {
      return NextResponse.json({ ok: false, error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
    }
    captureException(e, { route: '/api/upload', tags: { stage: 'handler' } })
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
