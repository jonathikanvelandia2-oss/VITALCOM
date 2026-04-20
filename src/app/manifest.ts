import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vitalcom — Plataforma de bienestar',
    short_name: 'Vitalcom',
    description:
      'Plataforma todo-en-uno para dropshippers de bienestar en LATAM. Catálogo, P&G, IA, comunidad y más.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#c6ff3c',
    lang: 'es-CO',
    categories: ['business', 'productivity', 'shopping'],
    icons: [
      {
        src: '/assets/branding/logo-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/assets/branding/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
