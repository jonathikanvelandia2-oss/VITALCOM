// Helpers de URL para Supabase Storage y Cloudinary
// No inicializa clientes aquí — se hace lazy en cada API route

export const BUCKETS = {
  PRODUCTS: 'products',
  VIDEOS: 'videos',
  AVATARS: 'avatars',
} as const

export function getPublicUrl(bucket: string, path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${url}/storage/v1/object/public/${bucket}/${path}`
}

export function getOptimizedImageUrl(
  rawUrl: string,
  width: number = 400,
  quality: string = 'auto'
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (cloudName && rawUrl) {
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_${quality},w_${width},c_fill/${encodeURIComponent(rawUrl)}`
  }
  return rawUrl
}

export function getCloudinaryUrl(
  rawUrl: string,
  transforms: string = 'f_auto,q_auto,w_800'
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName || !rawUrl) return rawUrl
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms}/${encodeURIComponent(rawUrl)}`
}
