import type { Metadata } from 'next'
import { Orbitron, Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Vitalcom — Bienestar que conecta',
  description:
    'Plataforma de proveeduría de productos de bienestar con presencia en Colombia, Ecuador, Guatemala y Chile. SaaS administrativo + comunidad de emprendedores.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'Vitalcom',
    description: 'Bienestar que conecta — CO · EC · GT · CL',
    type: 'website',
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
      <body>{children}</body>
    </html>
  )
}
