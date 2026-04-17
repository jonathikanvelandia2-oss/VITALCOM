import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { requireRole } from '@/lib/auth/session'
import { supabaseAdmin, BUCKETS, getPublicUrl } from '@/lib/storage/supabase'

// ── POST /api/upload — Subir archivo a Supabase Storage ─
export const POST = withErrorHandler(async (req: Request) => {
  await requireRole('EMPLOYEE')

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bucket = (formData.get('bucket') as string) || BUCKETS.PRODUCTS
  const folder = (formData.get('folder') as string) || ''

  if (!file) throw new Error('NOT_FOUND')

  // Validar tipo y tamaño (max 5MB para imágenes, 50MB para videos)
  const maxSize = bucket === BUCKETS.VIDEOS ? 50 * 1024 * 1024 : 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error(`Archivo excede el límite de ${maxSize / 1024 / 1024}MB`)
  }

  const allowedTypes = bucket === BUCKETS.VIDEOS
    ? ['video/mp4', 'video/webm']
    : ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo no permitido: ${file.type}`)
  }

  // Generar path único
  const ext = file.name.split('.').pop() || 'webp'
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = folder
    ? `${folder}/${timestamp}-${safeName}`
    : `${timestamp}-${safeName}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const publicUrl = getPublicUrl(bucket, path)

  return apiSuccess({
    url: publicUrl,
    path,
    bucket,
    size: file.size,
    type: file.type,
  }, 201)
})
