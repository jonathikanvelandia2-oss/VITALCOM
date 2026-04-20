import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitalcom.vercel.app').replace(
  /\/$/,
  '',
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/politica-privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/politica-cookies`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terminos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  let productRoutes: MetadataRoute.Sitemap = []
  let courseRoutes: MetadataRoute.Sitemap = []

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      take: 2000,
    })
    productRoutes = products.map((p) => ({
      url: `${SITE_URL}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (err) {
    console.error('[sitemap] productos no disponibles:', err)
  }

  try {
    const courses = await (prisma as any).course?.findMany?.({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      take: 500,
    })
    if (Array.isArray(courses)) {
      courseRoutes = courses.map((c: { slug: string; updatedAt: Date }) => ({
        url: `${SITE_URL}/cursos/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (err) {
    console.error('[sitemap] cursos no disponibles:', err)
  }

  return [...staticRoutes, ...productRoutes, ...courseRoutes]
}
