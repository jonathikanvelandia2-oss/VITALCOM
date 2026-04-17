import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente con service role para operaciones server-side (uploads)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export const BUCKETS = {
  PRODUCTS: 'products',
  VIDEOS: 'videos',
  AVATARS: 'avatars',
} as const

export function getPublicUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

// URL con transformación de Cloudinary (cuando se configure)
export function getCloudinaryUrl(
  path: string,
  transforms: string = 'f_auto,q_auto,w_800'
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) return path // fallback a URL directa
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms}/${encodeURIComponent(path)}`
}

// Optimizar imagen: si hay Cloudinary usa transformaciones, si no usa Supabase directo
export function getOptimizedImageUrl(
  rawUrl: string,
  width: number = 400,
  quality: string = 'auto'
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (cloudName) {
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_${quality},w_${width},c_fill/${encodeURIComponent(rawUrl)}`
  }
  return rawUrl
}
