import type { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitalcom.vercel.app').replace(
  /\/$/,
  '',
)

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/productos/', '/cursos/', '/comunidad', '/feed', '/ranking'],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/',
          '/api/*',
          '/login',
          '/register',
          '/perfil',
          '/mi-tienda',
          '/mi-pyg',
          '/mi-blueprint',
          '/pedidos',
          '/rendimiento',
          '/analitica',
          '/tareas',
          '/reuniones',
          '/chat',
          '/asistente',
          '/automatizaciones',
        ],
      },
      {
        userAgent: ['GPTBot', 'Claude-Web', 'ClaudeBot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
