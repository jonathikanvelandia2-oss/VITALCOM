/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },

  // ── Headers de seguridad globales ──────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evitar clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Evitar MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer seguro — no enviar path a terceros
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permisos del navegador
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // HSTS — forzar HTTPS en producción (max-age 1 año + subdominios)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // CSP — Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dropi.co https://api.openai.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          // Cross-Origin policies
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },

  // ── Redirecciones de seguridad ─────────────────────────
  async redirects() {
    return [
      // Forzar trailing slash consistente
      {
        source: '/admin',
        destination: '/admin/',
        permanent: true,
        has: [{ type: 'header', key: 'x-no-redirect', value: undefined }],
      },
    ]
  },
}

export default nextConfig
