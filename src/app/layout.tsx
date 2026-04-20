import type { Metadata, Viewport } from 'next'
import { Orbitron, Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import { CookieConsent } from '@/components/shared/CookieConsent'
import { Providers } from '@/components/providers/Providers'
import './globals.css'

// Fuentes oficiales Vitalcom (ver CLAUDE.md → Tipografía)
const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--font-display',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#0a0a0a' },
  ],
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitalcom.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Vitalcom — Bienestar que conecta',
    template: '%s · Vitalcom',
  },
  description:
    'Plataforma todo-en-uno para dropshippers de bienestar en LATAM. Catálogo · Pedidos · Academia · IA · Comunidad. Presencia en Colombia, Ecuador, Guatemala y Chile.',
  applicationName: 'Vitalcom',
  keywords: [
    'dropshipping bienestar',
    'proveedor bienestar LATAM',
    'catálogo mayorista Colombia',
    'plataforma emprendedores',
    'comunidad dropshippers',
    'bienestar Colombia Ecuador Guatemala Chile',
    'vitalcom',
  ],
  authors: [{ name: 'Vitalcom' }],
  creator: 'Vitalcom',
  publisher: 'Vitalcom',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: APP_URL,
    siteName: 'Vitalcom',
    title: 'Vitalcom — Bienestar que conecta',
    description:
      'Plataforma todo-en-uno para dropshippers de bienestar en LATAM. Catálogo · Pedidos · Academia · IA · Comunidad.',
    images: [
      {
        url: '/assets/branding/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Vitalcom — Bienestar que conecta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vitalcom — Bienestar que conecta',
    description: 'Dropshipping de bienestar en LATAM · CO · EC · GT · CL',
    images: ['/assets/branding/og-default.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/assets/branding/logo-icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/assets/branding/logo.png',
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${orbitron.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body>
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}
