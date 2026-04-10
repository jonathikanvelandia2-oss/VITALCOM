'use client'

import { useEffect, useRef } from 'react'

// ── Efecto Matrix "VITALCOM" cayendo ────────────────────
// Canvas aislado que NO interfiere con Tailwind ni Next.js.
// Se monta con un portal-style approach: inline styles only.

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const word = 'VITALCOM'
    const fontSize = 13
    let w = 0
    let h = 0
    let columns = 0
    let drops: number[] = []

    function init() {
      w = canvas!.width = window.innerWidth
      h = canvas!.height = window.innerHeight
      columns = Math.floor(w / (fontSize + 4))
      drops = []
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -50
      }
    }

    init()

    function draw() {
      // Fondo con trail — crea el efecto de desvanecimiento
      ctx!.fillStyle = 'rgba(10, 10, 10, 0.04)'
      ctx!.fillRect(0, 0, w, h)

      ctx!.font = `600 ${fontSize}px monospace`

      for (let i = 0; i < columns; i++) {
        const charIdx = Math.abs(Math.floor(drops[i])) % word.length
        const char = word[charIdx]
        const x = i * (fontSize + 4)
        const y = drops[i] * fontSize

        if (y > 0) {
          // Algunas columnas más brillantes que otras
          if (i % 7 === 0) {
            ctx!.fillStyle = 'rgba(198, 255, 60, 0.07)'
          } else if (i % 3 === 0) {
            ctx!.fillStyle = 'rgba(127, 184, 0, 0.04)'
          } else {
            ctx!.fillStyle = 'rgba(74, 107, 0, 0.03)'
          }
          ctx!.fillText(char, x, y)
        }

        drops[i] += 0.3 + (i % 4) * 0.1

        if (drops[i] * fontSize > h && Math.random() > 0.99) {
          drops[i] = Math.random() * -30
        }
      }
    }

    const interval = setInterval(draw, 50)
    const onResize = () => init()
    window.addEventListener('resize', onResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Inline styles ONLY — no Tailwind classes — cannot break CSS pipeline
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
