import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'

export const runtime = 'nodejs'

const BUCKETS = { products: 'products', videos: 'videos', avatars: 'avatars' }
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

// ── POST /api/upload — Subir archivo a Supabase Storage ─
export async function POST(req: Request) {
  try {
    await requireRole('EMPLOYEE')

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

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
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

    return NextResponse.json({
      ok: true,
      data: { url: publicUrl, path, bucket, size: file.size, type: file.type },
    }, { status: 201 })
  } catch (e: any) {
    const status = e.message === 'UNAUTHORIZED' ? 401 : e.message === 'FORBIDDEN' ? 403 : 500
    return NextResponse.json({ ok: false, error: e.message || 'Error interno' }, { status })
  }
}
