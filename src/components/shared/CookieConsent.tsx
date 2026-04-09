'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Banner de consentimiento de cookies ─────────────────
// Requisito legal en CO, EC, GT, CL.
// Se muestra una vez y guarda la decisión en cookie (1 año).

const COOKIE_NAME = 'vc-cookie-consent'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 año en segundos

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Solo mostrar si no hay decisión previa
    const hasConsent = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${COOKIE_NAME}=`))
    if (!hasConsent) {
      // Pequeño delay para no bloquear la carga inicial
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    document.cookie = `${COOKIE_NAME}=accepted; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    setVisible(false)
  }

  function reject() {
    document.cookie = `${COOKIE_NAME}=rejected; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t p-4 md:p-6"
      style={{
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(198, 255, 60, 0.2)',
      }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: 'var(--vc-white-soft)' }}
          >
            Utilizamos cookies esenciales para el funcionamiento de la plataforma
            (sesión, seguridad, preferencias).{' '}
            <strong style={{ color: 'var(--vc-lime-main)' }}>
              No usamos cookies de seguimiento publicitario.
            </strong>
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--vc-white-dim)' }}>
            Consulta nuestra{' '}
            <Link href="/politica-cookies" className="underline" style={{ color: 'var(--vc-lime-deep)' }}>
              Política de Cookies
            </Link>{' '}
            y{' '}
            <Link href="/politica-privacidad" className="underline" style={{ color: 'var(--vc-lime-deep)' }}>
              Política de Privacidad
            </Link>{' '}
            para más información.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={reject}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
            style={{
              borderColor: 'var(--vc-gray-dark)',
              color: 'var(--vc-white-dim)',
            }}
          >
            Solo esenciales
          </button>
          <button
            onClick={accept}
            className="vc-btn-primary px-4 py-2 text-sm"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
