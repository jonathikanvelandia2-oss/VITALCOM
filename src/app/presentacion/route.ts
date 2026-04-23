// Presentación ejecutiva interactiva — route handler que sirve el HTML
// self-contained. Bypass de rewrites/redirects para garantizar deploy
// confiable en Vercel serverless. Lee el archivo UNA vez por instancia
// (cache en memoria) — la presentación no cambia entre requests.

import { readFileSync } from 'fs'
import path from 'path'

export const dynamic = 'force-static'
export const revalidate = 3600 // 1h — re-valida si se re-despliega

// Lectura perezosa + cache por instancia serverless
let cachedHtml: string | null = null

function loadHtml(): string {
  if (cachedHtml !== null) return cachedHtml
  try {
    cachedHtml = readFileSync(
      path.join(process.cwd(), 'public', 'presentacion.html'),
      'utf-8',
    )
    return cachedHtml
  } catch (err) {
    // Fallback: mensaje human-readable si el archivo falta
    return '<!DOCTYPE html><html><body style="background:#0A0A0A;color:#C6FF3C;font-family:monospace;padding:2rem;"><h1>Presentación en construcción</h1><p>Archivo no disponible. Contacta al equipo de desarrollo.</p></body></html>'
  }
}

export async function GET() {
  const html = loadHtml()
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
